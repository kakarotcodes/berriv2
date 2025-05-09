import { ipcMain, BrowserWindow } from 'electron'
import { animateWindowResize } from './windowResize'

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

  // Clean, minimal drag state
  const dragState = {
    isDragging: false,
    startMouseY: 0,
    initialWindowY: 0,
    initialWindowX: 0 // Store X to avoid fetching it repeatedly
  };

  // Start drag handler - capture everything we need once to avoid re-fetching
  ipcMain.on('start-vertical-drag', (_e, mouseY: number) => {
    // Skip if no window
    if (!mainWindow || mainWindow.isDestroyed()) return;
    
    // Get current window position once, at the beginning
    const bounds = mainWindow.getBounds();
    
    // Store everything we need
    dragState.isDragging = true;
    dragState.startMouseY = mouseY;
    dragState.initialWindowY = bounds.y;
    dragState.initialWindowX = bounds.x;
  });

  // Absolute bare minimum update handler for zero lag
  ipcMain.on('update-vertical-drag', (_e, mouseY: number) => {
    // Minimal check
    if (!dragState.isDragging || !mainWindow) return;
    
    try {
      // Direct delta calculation with no extra operations
      const y = dragState.initialWindowY + (mouseY - dragState.startMouseY);
      
      // Direct set with no options or extra calls
      mainWindow.setPosition(dragState.initialWindowX, y, false);
    } catch (e) {
      // Silently fail
    }
  });

  // End drag handler
  ipcMain.on('end-vertical-drag', () => {
    dragState.isDragging = false;
    dragState.startMouseY = 0;
    dragState.initialWindowY = 0;
    dragState.initialWindowX = 0;
  });
}
