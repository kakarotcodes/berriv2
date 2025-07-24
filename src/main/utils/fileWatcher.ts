import chokidar from 'chokidar'
import { promises as fs } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { BrowserWindow } from 'electron'

interface FileChangeEvent {
  type: 'add' | 'unlink' | 'change'
  path: string
  stats?: any
}

interface DirectoryStats {
  fileCount: number
  lastModified: number
}

export class FileWatcher {
  private static instance: FileWatcher
  private watchers: Map<string, chokidar.FSWatcher> = new Map()
  private mainWindow: BrowserWindow | null = null
  private isWatching = false
  private directoryStats: Map<string, DirectoryStats> = new Map()
  private pollInterval: NodeJS.Timeout | null = null
  private debounceTimeout: NodeJS.Timeout | null = null
  private isWindowVisible = true

  private constructor() {}

  static getInstance(): FileWatcher {
    if (!FileWatcher.instance) {
      FileWatcher.instance = new FileWatcher()
    }
    return FileWatcher.instance
  }

  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window
    
    // Listen for window visibility changes
    this.mainWindow.on('show', () => {
      this.isWindowVisible = true
      this.resumeWatching()
    })
    
    this.mainWindow.on('hide', () => {
      this.isWindowVisible = false
      this.pauseWatching()
    })
    
    this.mainWindow.on('minimize', () => {
      this.isWindowVisible = false
      this.pauseWatching()
    })
    
    this.mainWindow.on('restore', () => {
      this.isWindowVisible = true
      this.resumeWatching()
    })
  }

  private getWatchedDirectories(): string[] {
    return [
      join(homedir(), 'Downloads'),
      join(homedir(), 'Desktop')
    ]
  }

  private async getDirectoryStats(dirPath: string): Promise<DirectoryStats> {
    try {
      const files = await fs.readdir(dirPath)
      const stats = await Promise.all(
        files.map(async (file) => {
          try {
            const filePath = join(dirPath, file)
            const stat = await fs.stat(filePath)
            return stat.isFile() ? stat.mtime.getTime() : 0
          } catch {
            return 0
          }
        })
      )
      
      const validFiles = stats.filter(time => time > 0)
      return {
        fileCount: validFiles.length,
        lastModified: validFiles.length > 0 ? Math.max(...validFiles) : 0
      }
    } catch (error) {
      console.error(`Error getting directory stats for ${dirPath}:`, error)
      return { fileCount: 0, lastModified: 0 }
    }
  }

  private async hasDirectoryChanged(dirPath: string): Promise<boolean> {
    const currentStats = await this.getDirectoryStats(dirPath)
    const previousStats = this.directoryStats.get(dirPath)
    
    if (!previousStats) {
      this.directoryStats.set(dirPath, currentStats)
      return true
    }
    
    const hasChanged = 
      currentStats.fileCount !== previousStats.fileCount ||
      currentStats.lastModified !== previousStats.lastModified
    
    if (hasChanged) {
      this.directoryStats.set(dirPath, currentStats)
    }
    
    return hasChanged
  }

  private debounceRefresh() {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout)
    }
    
    this.debounceTimeout = setTimeout(() => {
      this.notifyRenderer()
    }, 500) // 500ms debounce to reduce flickering
  }

  private notifyRenderer() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      console.log('[FILE_WATCHER] Notifying renderer of file changes')
      this.mainWindow.webContents.send('files-changed')
    }
  }

  async startWatching(): Promise<void> {
    if (this.isWatching) {
      console.log('[FILE_WATCHER] Already watching, skipping start')
      return
    }

    console.log('[FILE_WATCHER] Starting file system watching')
    
    const directories = this.getWatchedDirectories()
    
    // Initialize directory stats
    for (const dir of directories) {
      await this.getDirectoryStats(dir).then(stats => {
        this.directoryStats.set(dir, stats)
      })
    }

    try {
      // Start file system watchers
      for (const dir of directories) {
        const watcher = chokidar.watch(dir, {
          ignored: [
            '**/.DS_Store',
            '**/Thumbs.db',
            '**/.git/**',
            '**/node_modules/**',
            '**/.tmp*',
            '**/.temp*'
          ],
          ignoreInitial: true,
          persistent: true,
          depth: 0, // Only watch direct children, not subdirectories
          awaitWriteFinish: {
            stabilityThreshold: 300,
            pollInterval: 100
          },
          usePolling: false, // Use native events for better performance
          atomic: true, // Wait for file operations to complete
        })

        watcher
          .on('add', (path) => {
            console.log(`[FILE_WATCHER] File added: ${path}`)
            this.debounceRefresh()
          })
          .on('unlink', (path) => {
            console.log(`[FILE_WATCHER] File removed: ${path}`)
            this.debounceRefresh()
          })
          .on('change', (path) => {
            console.log(`[FILE_WATCHER] File changed: ${path}`)
            this.debounceRefresh()
          })
          .on('error', (error) => {
            console.error(`[FILE_WATCHER] Watcher error for ${dir}:`, error)
          })

        this.watchers.set(dir, watcher)
        console.log(`[FILE_WATCHER] Started watching ${dir}`)
      }

      // Start polling fallback
      this.startPollingFallback()
      
      this.isWatching = true
      console.log('[FILE_WATCHER] File watching initialized successfully')
      
    } catch (error) {
      console.error('[FILE_WATCHER] Failed to start file watching:', error)
      // Fall back to polling only
      this.startPollingFallback()
    }
  }

  private startPollingFallback(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
    }

    this.pollInterval = setInterval(async () => {
      if (!this.isWindowVisible) {
        return // Skip polling when window is not visible
      }

      try {
        const directories = this.getWatchedDirectories()
        let hasAnyChanges = false

        for (const dir of directories) {
          const hasChanged = await this.hasDirectoryChanged(dir)
          if (hasChanged) {
            hasAnyChanges = true
          }
        }

        if (hasAnyChanges) {
          console.log('[FILE_WATCHER] Polling detected changes')
          this.notifyRenderer()
        }
      } catch (error) {
        console.error('[FILE_WATCHER] Polling error:', error)
      }
    }, 2000) // 2 second polling interval

    console.log('[FILE_WATCHER] Started polling fallback (2s interval)')
  }

  private pauseWatching(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }
    console.log('[FILE_WATCHER] Paused watching (window hidden)')
  }

  private resumeWatching(): void {
    if (!this.pollInterval && this.isWatching) {
      this.startPollingFallback()
      console.log('[FILE_WATCHER] Resumed watching (window visible)')
      
      // Immediately check for changes after resuming
      setTimeout(() => {
        this.notifyRenderer()
      }, 100)
    }
  }

  stopWatching(): void {
    console.log('[FILE_WATCHER] Stopping file watching')
    
    // Clear debounce timeout
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout)
      this.debounceTimeout = null
    }
    
    // Stop polling
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }
    
    // Stop file system watchers
    for (const [dir, watcher] of this.watchers) {
      try {
        watcher.close()
        console.log(`[FILE_WATCHER] Stopped watching ${dir}`)
      } catch (error) {
        console.error(`[FILE_WATCHER] Error closing watcher for ${dir}:`, error)
      }
    }
    
    this.watchers.clear()
    this.directoryStats.clear()
    this.isWatching = false
    
    console.log('[FILE_WATCHER] File watching stopped')
  }

  // Manual refresh trigger
  triggerRefresh(): void {
    console.log('[FILE_WATCHER] Manual refresh triggered')
    this.notifyRenderer()
  }

  // Get current watching status
  isCurrentlyWatching(): boolean {
    return this.isWatching
  }

  // Get watched directories
  getWatchedPaths(): string[] {
    return this.getWatchedDirectories()
  }
}