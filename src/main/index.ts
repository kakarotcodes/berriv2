import { app, BrowserWindow, screen } from 'electron'
import path from 'path'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { registerIpcHandlers } from './utils/ipcHandlers'
import { registerViewHandlers } from './utils/animateViewTransition'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  // Get the primary display's work area
  const primaryDisplay = screen.getPrimaryDisplay()
  const { bounds, workArea } = primaryDisplay

  // Calculate position (20px from right and bottom edges)
  const x = bounds.x + workArea.width - 512 - 20
  const y = bounds.y + workArea.height - 288

  mainWindow = new BrowserWindow({
    backgroundColor: '#00000000',
    width: 512,
    height: 288,
    minWidth: 100,
    minHeight: 40,
    vibrancy: 'under-window',
    visualEffectState: 'active',
    roundedCorners: true,
    x,
    y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, '../preload/index.js'),
      backgroundThrottling: false
    }
  })

  // Load the Vite dev server
  mainWindow.loadURL('http://localhost:5173')

  // Make window visible on all workspaces
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  // Register IPC handlers
  registerIpcHandlers(mainWindow)
  registerViewHandlers(mainWindow)
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

export { createWindow }
