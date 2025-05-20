import { ipcMain, BrowserWindow, screen, shell, clipboard } from 'electron'
import { setWindowOpacity } from '../utils/windowOpacity'
import { animateWindowResize } from './windowResize'
import { prefs } from './prefs'
import { OFFSET, WIDTH, HEIGHT } from '../../constants/constants'
import {
  getClipboardHistory,
  startClipboardPolling,
  stopClipboardPolling
} from './clipboardMonitor'

// Notes
import { NotesDB } from '../../renderer/src/features/notes/db/notesDB'
import { getSavedHoverSize, saveHoverSize } from './hoverSize'

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

  // ------------------------------------------------------------
  // Vertical drag
  // ------------------------------------------------------------

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
        const dx = cursor.x - dragState.startMouseX
        // Apply the movement to the original window position
        let calculatedX = dragState.startWindowX + dx

        // Ensure window stays within screen bounds
        const minX = area.x
        const maxX = area.x + area.width - bounds.width
        newX = Math.max(minX, Math.min(maxX, calculatedX))
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
    const isHoverView = bounds.width > WIDTH.PILL && bounds.height > HEIGHT.PILL

    if (isPillView) {
      // Save pill position directly
      prefs.set('pillY', y)
      console.log('[POSITION] Saved pill Y position after drag:', y)
    } else if (isHoverView) {
      // Only update pillY if it's a significant change to avoid erratic behavior
      const currentPillY = prefs.get('pillY') as number | null;
      if (currentPillY === null || Math.abs(currentPillY - y) > 20) { 
        // Save hover Y position as pill position, but only for significant changes
        prefs.set('pillY', y)
        console.log('[POSITION] Updated pill Y position from hover position:', y)
      } else {
        console.log('[POSITION] Hover position change too small, keeping existing pill Y position')
      }
    }

    dragState.isDragging = false
    mainWindow.webContents
      .executeJavaScript(`document.body.classList.remove('is-dragging')`)
      .catch(console.error)
  })

  // ------------------------------------------------------------
  // --- Full drag support (horizontal + vertical) ---
  // ------------------------------------------------------------
  ipcMain.on('start-drag', (_e, { mouseX, mouseY }) => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    const bounds = mainWindow.getBounds()
    dragState.isDragging = true
    dragState.startMouseX = mouseX
    dragState.startMouseY = mouseY
    dragState.startWindowX = bounds.x
    dragState.startWindowY = bounds.y
  })

  ipcMain.on('update-drag', (_e, { mouseX, mouseY }) => {
    if (!dragState.isDragging || !mainWindow) return

    const newX = mouseX - (dragState.startMouseX - dragState.startWindowX)
    const newY = mouseY - (dragState.startMouseY - dragState.startWindowY)

    const { width, height } = mainWindow.getBounds()
    const cursor = screen.getCursorScreenPoint()
    const area = screen.getDisplayNearestPoint(cursor).workArea

    const clampedX = Math.max(area.x, Math.min(area.x + area.width - width, newX))
    const clampedY = Math.max(area.y, Math.min(area.y + area.height - height, newY))

    mainWindow.setBounds({ x: clampedX, y: clampedY, width, height }, false)
  })

  ipcMain.on('end-drag', () => {
    dragState.isDragging = false
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
      mainWindow.setResizable(resizable)
      console.log(`[RESIZE] Window resizability set to: ${resizable}`)
      
      // Important: If we're making the window resizable, make sure it has minimum dimensions
      if (resizable) {
        mainWindow.setMinimumSize(200, 200);
      } else {
        // When disabling resizable mode, clear minimum size constraints
        mainWindow.setMinimumSize(1, 1);
      }
    } catch (err) {
      console.error('[RESIZE] Failed to set resizability:', err)
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

  // ------------------------------------------------------------
  // Clipboard history
  // ------------------------------------------------------------

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

  // ------------------------------------------------------------
  // Notes API
  // ------------------------------------------------------------

  ipcMain.handle('notes:getAll', () => {
    return NotesDB.getAllNotes()
  })

  ipcMain.handle('notes:getTrashed', () => {
    return NotesDB.getTrashedNotes()
  })

  ipcMain.handle('notes:insert', (_event, note) => {
    return NotesDB.insertNote(note)
  })

  ipcMain.handle('notes:update', (_event, { id, fields }) => {
    return NotesDB.updateNote(id, fields)
  })

  ipcMain.handle('notes:trash', (_event, id) => {
    return NotesDB.trashNote(id)
  })

  ipcMain.handle('notes:restore', (_event, id) => {
    return NotesDB.restoreNote(id)
  })

  ipcMain.handle('notes:deleteForever', (_event, id) => {
    return NotesDB.permanentlyDeleteNote(id)
  })

  ipcMain.on('set-main-window-resizable', (_event, resizable: boolean) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      try {
        mainWindow.setResizable(resizable)
        console.log(`Window resizability set to: ${resizable}`)
      } catch (err) {
        console.error('Failed to set resizability:', err)
      }
    }
  })

  // Add handler to get current window bounds
  ipcMain.handle('get-window-bounds', () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      console.warn('[DEBUG] get-window-bounds called but window is not available')
      return null
    }
    const bounds = mainWindow.getBounds()
    console.log('[DEBUG] get-window-bounds returning:', bounds)
    return bounds
  })

  // Handler for saving hover view size
  ipcMain.on('save-hover-size', (_event, dimensions) => {
    console.log('[HOVER] save-hover-size called with dimensions:', dimensions)
    if (!dimensions || typeof dimensions !== 'object') {
      console.error('[HOVER] Invalid dimensions provided to save-hover-size:', dimensions)
      return
    }
    
    const { width, height } = dimensions
    if (typeof width === 'number' && typeof height === 'number') {
      console.log('[HOVER] Saving hover dimensions:', { width, height })
      saveHoverSize(width, height)
      
      // Debug: read back from prefs to confirm
      const savedSize = getSavedHoverSize()
      console.log('[HOVER] Confirmed saved dimensions:', savedSize)
    } else {
      console.error('[HOVER] Invalid width or height in save-hover-size:', dimensions)
    }
  })
  
  // Handler for getting saved hover size
  ipcMain.handle('get-hover-size', () => {
    const size = getSavedHoverSize()
    console.log('[HOVER] Retrieved saved hover dimensions:', size)
    return size
  })
  
  // Add a dedicated function to apply hover view dimensions
  ipcMain.on('fix-hover-dimensions', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    
    const { width, height } = getSavedHoverSize()
    console.log('[HOVER] Fixing hover dimensions to:', { width, height })
    
    // Validate dimensions - only apply if they're reasonable hover dimensions
    // This helps prevent applying pill dimensions to hover view
    if (width === WIDTH.PILL || height === HEIGHT.PILL || 
        width < 100 || height < 100) {
      console.log('[HOVER] Invalid hover dimensions (too small), using defaults:', 
                  { width: WIDTH.HOVER, height: HEIGHT.HOVER })
      
      const bounds = mainWindow.getBounds()
      mainWindow.setBounds({
        x: bounds.x,
        y: bounds.y,
        width: WIDTH.HOVER,
        height: HEIGHT.HOVER
      }, false)
    } else {
      // Apply the validated dimensions
      const bounds = mainWindow.getBounds()
      mainWindow.setBounds({
        x: bounds.x,
        y: bounds.y,
        width,
        height
      }, false)
    }
  })
}