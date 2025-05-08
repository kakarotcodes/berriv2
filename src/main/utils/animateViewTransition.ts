// main/utils/animateViewTransition.ts
import { BrowserWindow, ipcMain } from 'electron'
import { animateWindowResize } from './windowResize'

export function registerViewHandlers(mainWindow: BrowserWindow) {
  ipcMain.handle('animate-view-transition', async (_event, view: string) => {
    const dimensions = {
      default: { width: 512, height: 512 },
      pill: { width: 100, height: 48 },
      hover: { width: 240, height: 240 },
      expanded: { width: 800, height: 600 }
    }[view]

    if (!dimensions) return

    return new Promise((resolve) => {
      animateWindowResize(mainWindow, dimensions.width, dimensions.height, 300)
      setTimeout(resolve, 300) // Match animation duration
    })
  })
}
