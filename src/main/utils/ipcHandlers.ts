import { ipcMain, BrowserWindow, screen, Display } from 'electron'
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
    windowHeight: 0
  }

  ipcMain.on('start-vertical-drag', (_e, mouseY: number) => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    const bounds = mainWindow.getBounds();
    dragState.isDragging = true;
    dragState.startMouseY = mouseY;
    dragState.startWindowY = bounds.y;
    dragState.windowWidth = bounds.width;
    dragState.windowHeight = bounds.height;
    mainWindow.webContents.executeJavaScript(
      `document.body.classList.add('is-dragging')`
    ).catch(console.error);
  });

  ipcMain.on('update-vertical-drag', (_e, mouseY: number) => {
    if (!dragState.isDragging || !mainWindow) return;
    try {
      const cursorPoint = screen.getCursorScreenPoint();
      const currentDisplay = screen.getDisplayNearestPoint(cursorPoint);
      const workArea = currentDisplay.workArea;
      // Always stick to the right edge
      const newX = workArea.x + workArea.width - dragState.windowWidth;
      // Y follows the mouse, but is clamped to the display
      const deltaY = mouseY - dragState.startMouseY;
      const newY = dragState.startWindowY + deltaY;
      // Clamp Y so the pill is always fully visible
      const minY = workArea.y;
      const maxY = workArea.y + workArea.height - dragState.windowHeight;
      const boundedY = Math.max(minY, Math.min(maxY, newY));
      mainWindow.setPosition(newX, boundedY, false);
    } catch (error) {
      console.error('Error during drag update:', error);
    }
  });

  ipcMain.on('end-vertical-drag', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const [, y] = mainWindow.getPosition();
    prefs.set('pillY', y);
    dragState.isDragging = false;
    mainWindow.webContents.executeJavaScript(
      `document.body.classList.remove('is-dragging')`
    ).catch(console.error);
  });
}
