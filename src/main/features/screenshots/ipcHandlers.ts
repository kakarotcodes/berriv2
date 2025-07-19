import { ipcMain, shell, nativeImage } from 'electron'
import { promises as fs } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

interface Screenshot {
  id: string
  name: string
  path: string
  dateAdded: Date
  size: number
  thumbnail?: string
}

export function registerScreenshotsHandlers() {
  // Get directories to scan for images
  const getImageDirectories = () => {
    return [
      join(homedir(), 'Desktop'),
      join(homedir(), 'Downloads')
    ]
  }

  // Helper function to create base64 data URL from image file
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
        case 'bmp':
          mimeType = 'image/bmp'
          break
        case 'tiff':
        case 'tif':
          mimeType = 'image/tiff'
          break
        case 'svg':
          mimeType = 'image/svg+xml'
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

  // Get all image files from Desktop and Downloads
  ipcMain.handle('screenshots:get-screenshots', async () => {
    try {
      const imageDirectories = getImageDirectories()
      const screenshots: Screenshot[] = []

      for (const directory of imageDirectories) {
        try {
          const files = await fs.readdir(directory, { withFileTypes: true })

          // Filter for all image files
          const imageFiles = files.filter((file) => {
            if (!file.isFile()) return false
            const name = file.name.toLowerCase()
            const isImageFile = /\.(png|jpg|jpeg|gif|webp|bmp|tiff|svg)$/i.test(name)
            return isImageFile
          })

          for (const file of imageFiles) {
            try {
              const filePath = join(directory, file.name)
              const stats = await fs.stat(filePath)

              // Create base64 thumbnail for display in renderer
              const thumbnail = await createThumbnail(filePath)

              screenshots.push({
                id: `${file.name}_${stats.mtime.getTime()}_${directory}`,
                name: file.name,
                path: filePath,
                dateAdded: stats.mtime,
                size: stats.size,
                thumbnail
              })
            } catch (error) {
              console.error(`Error processing image file ${file.name}:`, error)
            }
          }
        } catch (error) {
          console.error(`Error reading directory ${directory}:`, error)
        }
      }

      // Sort by date (newest first)
      screenshots.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())

      console.log(`[SCREENSHOTS] Found ${screenshots.length} image files`)
      return { success: true, screenshots }
    } catch (error) {
      console.error('[SCREENSHOTS] Error getting images:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Delete a screenshot
  ipcMain.handle('screenshots:delete-screenshot', async (_event, filePath: string) => {
    try {
      await fs.unlink(filePath)
      console.log(`[SCREENSHOTS] Deleted screenshot: ${filePath}`)
      return { success: true }
    } catch (error) {
      console.error('[SCREENSHOTS] Error deleting screenshot:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Open screenshot in Finder
  ipcMain.handle('screenshots:open-in-finder', async (_event, filePath: string) => {
    try {
      shell.showItemInFolder(filePath)
      console.log(`[SCREENSHOTS] Opened in Finder: ${filePath}`)
      return { success: true }
    } catch (error) {
      console.error('[SCREENSHOTS] Error opening in Finder:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Watch for new screenshots (optional enhancement)
  ipcMain.handle('screenshots:watch-directory', async () => {
    try {
      // This could be implemented with fs.watch if you want real-time updates
      // For now, we'll rely on manual refresh
      return { success: true }
    } catch (error) {
      console.error('[SCREENSHOTS] Error setting up directory watch:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Start drag operation for file
  ipcMain.on('screenshots:start-drag', async (event, filePath: string) => {
    try {
      console.log(`[SCREENSHOTS] Starting drag operation for: ${filePath}`)
      
      // Verify file exists
      await fs.access(filePath)
      
      // Create native image for drag
      const image = nativeImage.createFromPath(filePath)
      
      // Start the drag operation using the event sender
      event.sender.startDrag({
        file: filePath,
        icon: image.resize({ width: 64, height: 64 })
      })
      
      console.log(`[SCREENSHOTS] Drag operation started successfully`)
    } catch (error) {
      console.error('[SCREENSHOTS] Error starting drag operation:', error)
    }
  })
}
