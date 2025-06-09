import { ipcMain, BrowserWindow, shell, clipboard } from 'electron'

export function registerExternalHandlers() {
  // Register IPC handler for opening external links
  ipcMain.on('open-external', (_event, url) => {
    // Only allow specific trusted URLs
    shell.openExternal(url)
  })

  // Register IPC handler for creating new Google Meet
  ipcMain.handle('start-google-meet', async () => {
    const meetStartUrl = 'https://meet.google.com/new'

    // Open in user's default browser
    shell.openExternal(meetStartUrl)

    // Open hidden browser window to capture redirect
    return new Promise((resolve, reject) => {
      const hiddenWin = new BrowserWindow({
        show: false,
        webPreferences: { sandbox: true }
      })

      hiddenWin.loadURL(meetStartUrl)

      const cleanup = () => {
        if (!hiddenWin.isDestroyed()) hiddenWin.destroy()
      }

      hiddenWin.webContents.on('did-redirect-navigation', (_e, url) => {
        if (url.includes('https://meet.google.com/')) {
          clipboard.writeText(url)
          cleanup()
          resolve(url)
        }
      })

      hiddenWin.webContents.on('did-navigate', (_e, url) => {
        if (url.includes('https://meet.google.com/')) {
          clipboard.writeText(url)
          cleanup()
          resolve(url)
        }
      })

      setTimeout(() => {
        cleanup()
        reject(new Error('Meet link fetch timeout'))
      }, 10000)
    })
  })
}
