import { ipcMain, shell, nativeImage, app, BrowserWindow } from 'electron'
import { promises as fs } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { FileWatcher } from '../../utils/fileWatcher'

interface DownloadFile {
  id: string
  name: string
  path: string
  dateAdded: Date
  size: number
  extension: string
  type: string
  thumbnail?: string
}

interface FileTypeCategory {
  name: string
  extensions: string[]
  count: number
}

export function registerScreenshotsHandlers(mainWindow: BrowserWindow) {
  // Initialize file watcher
  const fileWatcher = FileWatcher.getInstance()
  fileWatcher.setMainWindow(mainWindow)
  
  // Get downloads and desktop directories
  const getDownloadsDirectory = () => {
    return join(homedir(), 'Downloads')
  }

  const getDesktopDirectory = () => {
    return join(homedir(), 'Desktop')
  }

  // Get file type category based on extension
  const getFileTypeCategory = (extension: string): string => {
    const ext = extension.toLowerCase()

    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico', 'tiff', 'tif'].includes(ext)) {
      return 'Images'
    }
    if (['pdf'].includes(ext)) {
      return 'PDFs'
    }
    if (['doc', 'docx', 'odt', 'rtf'].includes(ext)) {
      return 'Documents'
    }
    if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) {
      return 'Spreadsheets'
    }
    if (['ppt', 'pptx', 'odp'].includes(ext)) {
      return 'Presentations'
    }
    if (['txt', 'md', 'log', 'json', 'xml', 'yaml', 'yml'].includes(ext)) {
      return 'Text Files'
    }
    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(ext)) {
      return 'Archives'
    }
    if (['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', 'm4v'].includes(ext)) {
      return 'Videos'
    }
    if (['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg', 'wma'].includes(ext)) {
      return 'Audio'
    }
    if (['dmg', 'pkg', 'app', 'exe', 'msi', 'deb', 'rpm'].includes(ext)) {
      return 'Applications'
    }
    if (
      ['js', 'ts', 'py', 'java', 'cpp', 'c', 'php', 'rb', 'go', 'rs', 'swift', 'kt'].includes(ext)
    ) {
      return 'Code Files'
    }

    return 'Other'
  }

  // Helper function to create base64 data URL from image file (for images only)
  const createThumbnail = async (filePath: string): Promise<string | undefined> => {
    try {
      const imageBuffer = await fs.readFile(filePath)
      const ext = filePath.toLowerCase().split('.').pop()
      let mimeType = 'image/png'

      switch (ext) {
        case 'jpg':
        case 'jpeg':
          mimeType = 'image/jpeg'
          break
        case 'gif':
          mimeType = 'image/gif'
          break
        case 'webp':
          mimeType = 'image/webp'
          break
        default:
          mimeType = 'image/png'
      }

      return `data:${mimeType};base64,${imageBuffer.toString('base64')}`
    } catch (error) {
      console.error(`Error creating thumbnail for ${filePath}:`, error)
      return undefined
    }
  }

  // Get all files from downloads and desktop folders
  ipcMain.handle('screenshots:get-screenshots', async () => {
    try {
      const downloadsDir = getDownloadsDirectory()
      const desktopDir = getDesktopDirectory()

      // Read files from both directories
      const [downloadsFiles, desktopFiles] = await Promise.all([
        fs.readdir(downloadsDir, { withFileTypes: true }).catch(() => []),
        fs.readdir(desktopDir, { withFileTypes: true }).catch(() => [])
      ])

      // Filter for files only (no folders) and combine
      const allDirFiles = [
        ...downloadsFiles
          .filter((file) => file.isFile())
          .map((file) => ({ ...file, directory: downloadsDir, source: 'Downloads' })),
        ...desktopFiles
          .filter((file) => file.isFile())
          .map((file) => ({ ...file, directory: desktopDir, source: 'Desktop' }))
      ]

      const allFiles: DownloadFile[] = []
      const categoryMap = new Map<string, number>()

      for (const file of allDirFiles) {
        try {
          const filePath = join(file.directory, file.name)
          const stats = await fs.stat(filePath)

          // Get file extension
          const extension = file.name.includes('.')
            ? file.name.split('.').pop()?.toLowerCase() || ''
            : ''

          // Get file type category
          const type = getFileTypeCategory(extension)

          // Update category count
          categoryMap.set(type, (categoryMap.get(type) || 0) + 1)

          // Create thumbnail only for images
          let thumbnail: string | undefined
          if (type === 'Images') {
            thumbnail = await createThumbnail(filePath)
          }

          allFiles.push({
            id: `${file.source}_${file.name}_${stats.mtime.getTime()}`,
            name: file.name,
            path: filePath,
            dateAdded: stats.mtime,
            size: stats.size,
            extension,
            type,
            thumbnail
          })
        } catch (error) {
          console.error(`Error processing file ${file.name} from ${file.source}:`, error)
        }
      }

      // Sort by date (newest first)
      allFiles.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())

      // Create categories array
      const categories: FileTypeCategory[] = Array.from(categoryMap.entries())
        .map(([name, count]) => ({
          name,
          extensions: [], // We'll populate this if needed
          count
        }))
        .sort((a, b) => b.count - a.count) // Sort by count, most files first

      console.log(
        `[FILES] Found ${allFiles.length} files in ${categories.length} categories from Downloads and Desktop`
      )
      return { success: true, files: allFiles, categories }
    } catch (error) {
      console.error('[FILES] Error getting files:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Delete a file
  ipcMain.handle('screenshots:delete-screenshot', async (_event, filePath: string) => {
    try {
      await fs.unlink(filePath)
      console.log(`[FILES] Deleted file: ${filePath}`)
      return { success: true }
    } catch (error) {
      console.error('[FILES] Error deleting file:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Open file in Finder
  ipcMain.handle('screenshots:open-in-finder', async (_event, filePath: string) => {
    try {
      shell.showItemInFolder(filePath)
      console.log(`[FILES] Opened in Finder: ${filePath}`)
      return { success: true }
    } catch (error) {
      console.error('[FILES] Error opening in Finder:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Watch for new screenshots (optional enhancement)
  // File watching handlers
  ipcMain.handle('screenshots:watch-directory', async () => {
    try {
      await fileWatcher.startWatching()
      return { success: true }
    } catch (error) {
      console.error('[SCREENSHOTS] Error setting up directory watch:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  ipcMain.handle('screenshots:stop-watching', async () => {
    try {
      fileWatcher.stopWatching()
      return { success: true }
    } catch (error) {
      console.error('[SCREENSHOTS] Error stopping directory watch:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  ipcMain.handle('screenshots:refresh-files', async () => {
    try {
      fileWatcher.triggerRefresh()
      return { success: true }
    } catch (error) {
      console.error('[SCREENSHOTS] Error triggering refresh:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  ipcMain.handle('screenshots:get-watch-status', async () => {
    try {
      return { 
        success: true, 
        isWatching: fileWatcher.isCurrentlyWatching(),
        watchedPaths: fileWatcher.getWatchedPaths()
      }
    } catch (error) {
      console.error('[SCREENSHOTS] Error getting watch status:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Start drag operation for file
  ipcMain.on('screenshots:start-drag', async (event, filePath: string) => {
    try {
      await fs.access(filePath)

      // 1) Try to get OS icon (works for any type)
      let icon = await app.getFileIcon(filePath, { size: 'normal' })

      // 2) Fallback: tiny valid PNG (rarely needed if getFileIcon works)
      if (icon.isEmpty()) {
        icon = nativeImage.createFromBuffer(
          Buffer.from(
            // a real 1x1 transparent PNG
            '89504e470d0a1a0a0000000d4948445200000001000000010806000000' +
              '1f15c4890000000a49444154789c6360000002000154a24f5d00000000' +
              '49454e44ae426082',
            'hex'
          )
        )
      }

      event.sender.startDrag({ file: filePath, icon })
      console.log(`[FILES] Drag started for: ${filePath}`)
    } catch (err) {
      console.error('[FILES] startDrag failed:', err)
    }
  })
}
