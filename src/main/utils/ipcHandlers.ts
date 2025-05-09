import { ipcMain, BrowserWindow } from 'electron'
import { animateWindowResize } from './windowResize'

export function registerIpcHandlers(mainWindow: BrowserWindow) {
  ipcMain.on('resize-window', (_event, { width, height }) => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    animateWindowResize({
      window: mainWindow,
      targetWidth: width,
      targetHeight: height,
      duration: 300
    })
  })
}
