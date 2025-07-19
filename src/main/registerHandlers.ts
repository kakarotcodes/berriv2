import { BrowserWindow } from 'electron'
import { registerWindowHandlers } from './features/window/ipcHandlers'
import { registerNotesHandlers } from './features/notes/ipcHandlers'
import { registerClipboardHandlers } from './features/clipboard/ipcHandlers'
import { registerExternalHandlers } from './features/external/ipcHandlers'
import { registerAuthHandlers } from './features/auth/ipcHandlers'
import { registerCalendarHandlers } from './features/calendar/ipcHandlers'
import { registerGmailHandlers } from './features/gmail/ipcHandlers'
import { registerNewGmailHandlers } from './features/gmail/newIpcHandlers'
import { registerScreenCaptureHandlers } from './features/screenCapture/ipcHandlers'
import { registerScreenshotsHandlers } from './features/screenshots/ipcHandlers'
import { registerThemeHandlers } from './features/theme/ipcHandlers'
import { registerAIHandlers } from './features/ai/ipcHandlers'

export function registerAllHandlers(mainWindow: BrowserWindow) {
  // Register feature-specific handlers
  registerWindowHandlers(mainWindow)
  registerNotesHandlers()
  registerClipboardHandlers(mainWindow)
  registerExternalHandlers()
  registerAuthHandlers()
  registerCalendarHandlers()
  registerGmailHandlers()
  registerNewGmailHandlers()
  registerScreenCaptureHandlers()
  registerScreenshotsHandlers()
  registerThemeHandlers(mainWindow)
  registerAIHandlers()
  console.log('[IPC] All handlers registered successfully')
}
