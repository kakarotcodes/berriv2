import { ipcMain, BrowserWindow, screen, shell, clipboard } from 'electron'
import { setWindowOpacity } from '../utils/windowOpacity'
import { animateWindowResize } from './windowResize'
import { prefs } from './prefs'
import { OFFSET, WIDTH } from '../../constants/constants'
import { getClipboardHistory, startClipboardPolling, stopClipboardPolling } from './clipboardMonitor'

export function registerIpcHandlers(mainWindow: BrowserWindow) {
  ipcMain.on('resize-window', (_event, { width, height }) => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    animateWindowResize({
      window: mainWindow,
      targetWidth: width,
      targetHeight: height,
      duration: 10
    })
  })

  // Drag state
  const dragState = {
    isDragging: false,
    startMouseY: 0,
    startWindowY: 0,
    windowWidth: 0,
    windowHeight: 0,
    currentDisplayId: 0,
    startMouseX: 0,
    startWindowX: 0
  }

  ipcMain.on('start-vertical-drag', (_e, mouseY: number) => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    const bounds = mainWindow.getBounds()
    dragState.isDragging = true
    dragState.startMouseY = mouseY
    dragState.startWindowY = bounds.y
    dragState.windowWidth = bounds.width
    dragState.windowHeight = bounds.height
    
    // Get cursor position for X tracking as well
    const cursor = screen.getCursorScreenPoint()
    dragState.startMouseX = cursor.x
    dragState.startWindowX = bounds.x
    
    mainWindow.webContents
      .executeJavaScript(`document.body.classList.add('is-dragging')`)
      .catch(console.error)
  })

  let lastUpdate = 0
  ipcMain.on('update-vertical-drag', (_e, _: number) => {
    if (!dragState.isDragging || !mainWindow) return

    const now = Date.now()
    if (now - lastUpdate < 16) return // ~60fps

    try {
      // Get cursor position directly from the main process
      // This is more accurate than the passed mouseY from renderer
      const cursor = screen.getCursorScreenPoint()
      const disp = screen.getDisplayNearestPoint(cursor)
      const area = disp.workArea

      // Get current window bounds
      const bounds = mainWindow.getBounds()

      // Calculate target position based on window type (pill or hover)
      let newX
      const isPillView = bounds.width === WIDTH.PILL
      const isHoverView = bounds.width === WIDTH.HOVER

      // Use appropriate offset based on window type
      if (isPillView) {
        // Use pill offset for pill view (50px from right edge)
        const pillOffset = OFFSET.PILLOFFSET
        newX = area.x + area.width - pillOffset
      } else if (isHoverView) {
        // For hover view, allow free horizontal movement
        
        // Calculate relative mouse movement
        const dx = cursor.x - dragState.startMouseX;
        // Apply the movement to the original window position
        let calculatedX = dragState.startWindowX + dx;
        
        // Ensure window stays within screen bounds
        const minX = area.x;
        const maxX = area.x + area.width - bounds.width;
        newX = Math.max(minX, Math.min(maxX, calculatedX));
      } else {
        // For other views, maintain current X position
        newX = bounds.x
      }

      // Use cursor position for vertical position
      const dragHandleOffset = 10
      const rawY = cursor.y - dragHandleOffset

      // Apply bounds limiting
      const minY = area.y
      const maxY = area.y + area.height - dragState.windowHeight
      const newY = Math.max(minY, Math.min(maxY, rawY))

      // Skip if position hasn't changed (improves performance)
      if (bounds.x === newX && bounds.y === newY) {
        return
      }

      // Set position directly - avoid animation
      mainWindow.setPosition(newX, newY, false)

      // Track display ID for transitions
      dragState.currentDisplayId = disp.id
    } catch (err) {
      console.error('drag update error', err)
    }
  })

  ipcMain.on('end-vertical-drag', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    const bounds = mainWindow.getBounds()
    const [_, y] = mainWindow.getPosition()
    
    // Save position based on window type
    const isPillView = bounds.width === WIDTH.PILL
    const isHoverView = bounds.width === WIDTH.HOVER
    
    if (isPillView) {
      // Save pill position directly
      prefs.set('pillY', y)
      console.log('[POSITION] Saved pill Y position after drag:', y)
    } else if (isHoverView) {
      // Save hover Y position as pill position
      prefs.set('pillY', y)
      console.log('[POSITION] Saved hover Y position as pill position:', y)
    }
    
    dragState.isDragging = false
    mainWindow.webContents
      .executeJavaScript(`document.body.classList.remove('is-dragging')`)
      .catch(console.error)
  })

  // Save pill position handler
  ipcMain.on('save-pill-position', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    const [, y] = mainWindow.getPosition()
    prefs.set('pillY', y)
  })
  
  // Handle window resizability
  ipcMain.on('set-resizable', (_event, resizable) => {
    if (!mainWindow || mainWindow.isDestroyed()) return

    try {
      // Set the window resizability
      mainWindow.setResizable(resizable)
      console.log(`Window resizability set to: ${resizable}`)
    } catch (error) {
      console.error('Error setting window resizability:', error)
    }
  })

  // Register IPC handler for opening external links
  ipcMain.on('open-external', (_event, url) => {
    // Only allow specific trusted URLs
    shell.openExternal(url)
    // if (url === 'https://meet.google.com/new') {
    //   shell.openExternal(url)
    // } else {
    //   console.error('Attempted to open untrusted URL:', url)
    // }
  })

  // Register IPC handler for creating new Google Meet
  ipcMain.handle('start-google-meet', async () => {
    const meetStartUrl = 'https://meet.google.com/new'

    // Open in user's default browser
    shell.openExternal(meetStartUrl)

    // Open hidden browser window to capture redirect
    return new Promise((resolve, reject) => {
      const hiddenWin = new BrowserWindow({
        show: false,
        webPreferences: { sandbox: true }
      })

      hiddenWin.loadURL(meetStartUrl)

      const cleanup = () => {
        if (!hiddenWin.isDestroyed()) hiddenWin.destroy()
      }

      hiddenWin.webContents.on('did-redirect-navigation', (_e, url) => {
        if (url.includes('https://meet.google.com/')) {
          clipboard.writeText(url)
          cleanup()
          resolve(url)
        }
      })

      hiddenWin.webContents.on('did-navigate', (_e, url) => {
        if (url.includes('https://meet.google.com/')) {
          clipboard.writeText(url)
          cleanup()
          resolve(url)
        }
      })

      setTimeout(() => {
        cleanup()
        reject(new Error('Meet link fetch timeout'))
      }, 10000)
    })
  })

  // Register IPC handler for window opacity
  ipcMain.on('pill:set-opacity', (_e, alpha: number) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      setWindowOpacity(mainWindow, alpha)
    }
  })

  // Register IPC handler for persisting last view before sleep
  ipcMain.on('persist-last-view', (_event, view) => {
    console.log('Persisting last view for sleep/wake:', view)
    prefs.set('lastViewAfterSleep', view)
  })

  // Register IPC handler for clipboard history
  ipcMain.handle('clipboard:get-history', () => {
    return getClipboardHistory()
  })
  
  // Start clipboard polling with a callback that sends updates to renderer
  startClipboardPolling((entry) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('clipboard:update', entry)
    }
  })
  
  // Clean up polling on window close
  if (mainWindow) {
    mainWindow.on('closed', () => {
      stopClipboardPolling()
    })
  }
} 
 