import { app, BrowserWindow, screen, nativeTheme } from 'electron'
import path from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

// utilities
import { registerAllHandlers } from './registerHandlers'
import { registerViewHandlers } from './utils/animateViewTransition'
import { cancelWindowResize } from './utils/windowResize'
import { setupPowerMonitoring } from './utils/powerMonitor'
import { handleProtocolUrl, setupProtocolHandling } from './features/auth/protocolHandler'

// constants
import { WIDTH, HEIGHT, PROTOCOL } from '../constants/constants'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  // Get the display nearest to the cursor instead of primary display
  const cursorPos = screen.getCursorScreenPoint()
  const currentDisplay = screen.getDisplayNearestPoint(cursorPos)
  const { workArea } = currentDisplay

  // Define the default window dimensions
  const defaultWidth = WIDTH.DEFAULT
  const defaultHeight = HEIGHT.DEFAULT

  // Calculate position with consistent 20px margin from edges
  const margin = 20
  const x = workArea.x + workArea.width - defaultWidth - margin
  const y = workArea.y + workArea.height - defaultHeight - margin

  mainWindow = new BrowserWindow({
    backgroundColor: '#00000000',
    width: defaultWidth,
    height: defaultHeight,
    minWidth: WIDTH.PILL,
    minHeight: HEIGHT.PILL_COLLAPSED,
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
    acceptFirstMouse: true, // This is what was missing!
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, '../preload/index.js'),
      backgroundThrottling: false
    }
  })

  // Load the app
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    // Load the Vite dev server in development
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    // Load the built files in production
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  // Make window visible on all workspaces
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  // Register IPC handlers
  registerAllHandlers(mainWindow)

  // register view handlers
  registerViewHandlers(mainWindow)

  // Set up sleep/wake handlers
  setupPowerMonitoring(mainWindow)

  // Setup protocol handling
  setupProtocolHandling(mainWindow)
}

// Register as default protocol client
if (!app.isDefaultProtocolClient(PROTOCOL)) {
  app.setAsDefaultProtocolClient(PROTOCOL)
}

// Ensure single instance
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(() => {
    // Set app user model id for windows
    electronApp.setAppUserModelId('com.berri.app')

    // In development, clear any existing auth tokens to prevent stale sessions
    if (is.dev) {
      console.log('[AUTH] Development mode: clearing any existing auth tokens')
      ;(global as { authTokens?: any }).authTokens = undefined
    }

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    createWindow()

    // Handle any pending protocol URL from app launch
    if (process.env.PENDING_PROTOCOL_URL) {
      handleProtocolUrl(process.env.PENDING_PROTOCOL_URL, mainWindow)
      delete process.env.PENDING_PROTOCOL_URL
    }

    // Handle protocol URL from command line on Windows/Linux
    if (process.platform !== 'darwin') {
      const protocolUrl = process.argv.find((arg) => arg.startsWith(`${PROTOCOL}://`))
      if (protocolUrl) {
        handleProtocolUrl(protocolUrl, mainWindow)
      }
    }

    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })
}

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
  
  // Clear auth tokens from memory for security
  console.log('[AUTH] Clearing auth tokens on app quit')
  ;(global as { authTokens?: any }).authTokens = undefined
})

// main.ts - Add GPU constraints
app.commandLine.appendSwitch('disable-gpu-driver-bug-workarounds')
app.commandLine.appendSwitch('disable-software-rasterizer')

// Handle the protocol URL from macOS open-url event
app.on('open-url', (event, url) => {
  event.preventDefault()
  if (mainWindow) {
    handleProtocolUrl(url, mainWindow)
  } else {
    // Store the URL to handle after the window is created
    process.env.PENDING_PROTOCOL_URL = url
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

export { createWindow }
