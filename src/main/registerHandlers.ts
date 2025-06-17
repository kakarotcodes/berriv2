import { BrowserWindow } from 'electron'
import { registerWindowHandlers } from './features/window/ipcHandlers'
import { registerNotesHandlers } from './features/notes/ipcHandlers'
import { registerClipboardHandlers } from './features/clipboard/ipcHandlers'
import { registerExternalHandlers } from './features/external/ipcHandlers'
import { registerAuthHandlers } from './features/auth/ipcHandlers'
import { registerCalendarHandlers } from './features/calendar/ipcHandlers'
import { registerScreenCaptureHandlers } from './features/screenCapture/ipcHandlers'

export function registerAllHandlers(mainWindow: BrowserWindow) {
  // Register feature-specific handlers
  registerWindowHandlers(mainWindow)
  registerNotesHandlers()
  registerClipboardHandlers(mainWindow)
  registerExternalHandlers()
  registerAuthHandlers()
  registerCalendarHandlers()
  registerScreenCaptureHandlers()
  console.log('[IPC] All handlers registered successfully')
}
