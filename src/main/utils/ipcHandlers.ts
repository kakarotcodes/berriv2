import { ipcMain, BrowserWindow, screen } from 'electron'
import { animateWindowResize } from './windowResize'
import { prefs } from './prefs'

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
    currentDisplayId: 0
  }

  ipcMain.on('start-vertical-drag', (_e, mouseY: number) => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    const bounds = mainWindow.getBounds()
    dragState.isDragging = true
    dragState.startMouseY = mouseY
    dragState.startWindowY = bounds.y
    dragState.windowWidth = bounds.width
    dragState.windowHeight = bounds.height
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

      // Calculate target positions
      const pillOffset = 98
      const newX = area.x + area.width - pillOffset

      // Use cursor position for vertical position
      const dragHandleOffset = 20
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
    const [, y] = mainWindow.getPosition()
    prefs.set('pillY', y)
    dragState.isDragging = false
    mainWindow.webContents
      .executeJavaScript(`document.body.classList.remove('is-dragging')`)
      .catch(console.error)
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
}
