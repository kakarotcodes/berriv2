import { ipcMain, BrowserWindow, screen } from 'electron'
import { setWindowOpacity } from '../../utils/windowOpacity'
import { animateWindowResize } from '../../utils/windowResize'
import { prefs } from '../../utils/prefs'
import { OFFSET, WIDTH, HEIGHT } from '../../../constants/constants'
import { getSavedHoverSize, saveHoverSize } from '../../utils/hoverSize'

export function registerWindowHandlers(mainWindow: BrowserWindow) {
  // Window resize handler
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

  // Vertical drag handlers
  ipcMain.on('start-vertical-drag', (_e, mouseY: number) => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    const bounds = mainWindow.getBounds()
    dragState.isDragging = true
    dragState.startMouseY = mouseY
    dragState.startWindowY = bounds.y
    dragState.windowWidth = bounds.width
    dragState.windowHeight = bounds.height

    const cursor = screen.getCursorScreenPoint()
    dragState.startMouseX = cursor.x
    dragState.startWindowX = bounds.x

    mainWindow.webContents
      .executeJavaScript(`document.body.classList.add('is-dragging')`)
      .catch(console.error)
  })

  let lastUpdate = 0
  ipcMain.on('update-vertical-drag', () => {
    if (!dragState.isDragging || !mainWindow) return

    const now = Date.now()
    if (now - lastUpdate < 16) return // ~60fps
    lastUpdate = now

    try {
      const cursor = screen.getCursorScreenPoint()
      const disp = screen.getDisplayNearestPoint(cursor)
      const area = disp.workArea
      const bounds = mainWindow.getBounds()

      let newX
      const isPillView = bounds.width === WIDTH.PILL
      const isHoverView = bounds.width === WIDTH.HOVER

      if (isPillView) {
        const pillOffset = OFFSET.PILLOFFSET
        newX = area.x + area.width - pillOffset
      } else if (isHoverView) {
        const dx = cursor.x - dragState.startMouseX
        const calculatedX = dragState.startWindowX + dx
        const minX = area.x
        const maxX = area.x + area.width - bounds.width
        newX = Math.max(minX, Math.min(maxX, calculatedX))
      } else {
        newX = bounds.x
      }

      const dragHandleOffset = 10
      const rawY = cursor.y - dragHandleOffset
      const minY = area.y
      const maxY = area.y + area.height - dragState.windowHeight
      const newY = Math.max(minY, Math.min(maxY, rawY))

      if (bounds.x === newX && bounds.y === newY) {
        return
      }

      mainWindow.setPosition(newX, newY, false)
      
      // CRITICAL: Ensure window remains visible on all workspaces after position change
      mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
      
      dragState.currentDisplayId = disp.id
    } catch (err) {
      console.error('drag update error', err)
    }
  })

  ipcMain.on('end-vertical-drag', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    const bounds = mainWindow.getBounds()
    const [, y] = mainWindow.getPosition()

    const isPillView = bounds.width === WIDTH.PILL
    const isHoverView = bounds.width > WIDTH.PILL && bounds.height > HEIGHT.PILL

    if (isPillView) {
      prefs.set('pillY', y)
      console.log('[POSITION] Saved pill Y position after drag:', y)
    } else if (isHoverView) {
      const currentPillY = prefs.get('pillY') as number | null
      if (currentPillY === null || Math.abs(currentPillY - y) > 20) {
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

  // Full drag handlers (horizontal + vertical)
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
    
    // CRITICAL: Ensure window remains visible on all workspaces after position change
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
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

      if (resizable) {
        mainWindow.setMinimumSize(200, 200)
      } else {
        mainWindow.setMinimumSize(1, 1)
      }
    } catch (err) {
      console.error('[RESIZE] Failed to set resizability:', err)
    }
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

  // Window opacity handler
  ipcMain.on('pill:set-opacity', (_e, alpha: number) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      setWindowOpacity(mainWindow, alpha)
    }
  })

  // Get current window bounds
  ipcMain.handle('get-window-bounds', () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      console.warn('[DEBUG] get-window-bounds called but window is not available')
      return null
    }
    const bounds = mainWindow.getBounds()
    console.log('[DEBUG] get-window-bounds returning:', bounds)
    return bounds
  })

  // Hover size management handlers
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

      const savedSize = getSavedHoverSize()
      console.log('[HOVER] Confirmed saved dimensions:', savedSize)
    } else {
      console.error('[HOVER] Invalid width or height in save-hover-size:', dimensions)
    }
  })

  ipcMain.handle('get-hover-size', () => {
    const size = getSavedHoverSize()
    console.log('[HOVER] Retrieved saved hover dimensions:', size)
    return size
  })

  ipcMain.on('fix-hover-dimensions', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return

    const { width, height } = getSavedHoverSize()
    console.log('[HOVER] Fixing hover dimensions to:', { width, height })

    if (width === WIDTH.PILL || height === HEIGHT.PILL || width < 100 || height < 100) {
      console.log('[HOVER] Invalid hover dimensions (too small), using defaults:', {
        width: WIDTH.HOVER,
        height: HEIGHT.HOVER
      })

      const bounds = mainWindow.getBounds()
      mainWindow.setBounds(
        {
          x: bounds.x,
          y: bounds.y,
          width: WIDTH.HOVER,
          height: HEIGHT.HOVER
        },
        false
      )
    } else {
      const bounds = mainWindow.getBounds()
      mainWindow.setBounds(
        {
          x: bounds.x,
          y: bounds.y,
          width: width,
          height: height
        },
        false
      )
    }
  })

  // Persist last view before sleep
  ipcMain.on('persist-last-view', (_event, view) => {
    console.log('Persisting last view for sleep/wake:', view)
    prefs.set('lastViewAfterSleep', view)
  })

  // Handle temporary window hiding for flicker-free transitions
  ipcMain.handle('window:hide-temporarily', async () => {
    try {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.hide()
        return { success: true }
      }
      return { success: false, error: 'Window not available' }
    } catch (error) {
      console.error('Failed to hide window:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  ipcMain.handle('window:show', async () => {
    try {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show()
        return { success: true }
      }
      return { success: false, error: 'Window not available' }
    } catch (error) {
      console.error('Failed to show window:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
}
