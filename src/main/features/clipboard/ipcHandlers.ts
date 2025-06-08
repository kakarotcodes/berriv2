import { ipcMain, BrowserWindow } from 'electron'
import {
  getClipboardHistory,
  startClipboardPolling,
  stopClipboardPolling
} from '../../utils/clipboardMonitor'

export function registerClipboardHandlers(mainWindow: BrowserWindow) {
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
