import { ipcMain, BrowserWindow } from 'electron'
import { animateWindowResize } from './windowResize'

export function registerIpcHandlers(mainWindow: BrowserWindow) {
  ipcMain.on('resize-window', (_event, { width, height }) => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    animateWindowResize(mainWindow, width, height)
  })

  ipcMain.handle('windowAction', (_, action) => {
    if (!mainWindow || mainWindow.isDestroyed()) return

    if (action === 'minimize') mainWindow.minimize()
    if (action === 'close') mainWindow.close()
  })
}
