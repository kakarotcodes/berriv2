import { app, BrowserWindow, screen, powerMonitor, ipcMain } from 'electron'
import path from 'path'
import { electronApp, optimizer } from '@electron-toolkit/utils'

// utiles
import { registerIpcHandlers } from './utils/ipcHandlers'
import { registerViewHandlers } from './utils/animateViewTransition'
import { cancelWindowResize } from './utils/windowResize'
import { setWindowOpacity } from './utils/windowOpacity'
import { prefs } from './utils/prefs'

// constants
import {
  PILL_VIEW_WIDTH,
  PILL_VIEW_HEIGHT,
  DEFAULT_VIEW_WIDTH,
  DEFAULT_VIEW_HEIGHT
} from '../constants/constants'

// types
import { ViewType } from '../types/types'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  // Get the display nearest to the cursor instead of primary display
  const cursorPos = screen.getCursorScreenPoint()
  const currentDisplay = screen.getDisplayNearestPoint(cursorPos)
  const { workArea } = currentDisplay

  // Define the default window dimensions
  const defaultWidth = DEFAULT_VIEW_WIDTH
  const defaultHeight = DEFAULT_VIEW_HEIGHT

  // Calculate position with consistent 20px margin from edges
  const margin = 20
  const x = workArea.x + workArea.width - defaultWidth - margin
  const y = workArea.y + workArea.height - defaultHeight - margin

  mainWindow = new BrowserWindow({
    backgroundColor: '#00000000',
    width: defaultWidth,
    height: defaultHeight,
    minWidth: PILL_VIEW_WIDTH,
    minHeight: PILL_VIEW_HEIGHT,
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

  // Set up sleep/wake handlers
  setupPowerMonitoring(mainWindow)
}

// Register IPC handler for window opacity
ipcMain.on('pill:set-opacity', (_e, alpha: number) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    setWindowOpacity(mainWindow, alpha)
  }
})

// Register IPC handler for persisting last view before sleep
ipcMain.on('persist-last-view', (_event, view) => {
  console.log('Persisting last view for sleep/wake:', view)
  prefs.set('lastViewAfterSleep', view)
})

// Handle sleep/wake events to preserve view state
function setupPowerMonitoring(window: BrowserWindow) {
  // Listen for system about to sleep
  powerMonitor.on('suspend', () => {
    if (!window || window.isDestroyed()) return

    // Save window position
    const [x, y] = window.getPosition()
    prefs.set('windowPosition', { x, y })

    // Request current view from renderer
    window.webContents.send('request-current-view')
    console.log('System suspending: requesting current view')
  })

  // Listen for system wake up
  powerMonitor.on('resume', () => {
    if (!window || window.isDestroyed()) return

    // Restore view after sleep
    const view = prefs.get('lastViewAfterSleep') as ViewType | undefined
    if (view) {
      console.log('System resuming: restoring view', view)
      window.webContents.send('resume-view', view)
    }
  })
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

// clear window resize before app quit
app.on('before-quit', () => {
  if (mainWindow) cancelWindowResize(mainWindow)
})

// main.ts - Add GPU constraints
app.commandLine.appendSwitch('disable-gpu-driver-bug-workarounds')
app.commandLine.appendSwitch('disable-software-rasterizer')

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

export { createWindow }
