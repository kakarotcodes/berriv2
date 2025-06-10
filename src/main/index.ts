import { app, BrowserWindow, screen } from 'electron'
import path from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

// utiles
import { registerAllHandlers } from './registerHandlers'
import { registerViewHandlers } from './utils/animateViewTransition'
import { cancelWindowResize } from './utils/windowResize'
import { setupPowerMonitoring } from './utils/powerMonitor'

// constants
import { WIDTH, HEIGHT, PROTOCOL } from '../constants/constants'

let mainWindow: BrowserWindow | null = null

// Handle deeplink URLs
function handleProtocolUrl(url: string): void {
  console.log('Protocol URL received:', url)

  try {
    // ① Parse tokens from the URL
    const parsed = new URL(url)
    const access = parsed.searchParams.get('access')
    const refresh = parsed.searchParams.get('refresh')
    const error = parsed.searchParams.get('error')

    console.log('access', access)
    console.log('refresh', refresh)
    console.log('error', error)

    // ② Handle authentication response
    if (access || error) {
      console.log('Authentication response received')

      // ③ Persist tokens securely (for now, store in memory - TODO: use keytar/secure storage)
      if (access) {
        ;(global as any).authTokens = {
          access,
          refresh,
          timestamp: Date.now()
        }
        console.log('Tokens stored successfully')
      }

      // ④ Forward to renderer so React can update UI
      if (mainWindow) {
        mainWindow.webContents.send('protocol-url', {
          url,
          tokens: access ? { access, refresh } : null,
          error
        })
      }

      // Note: No need to close auth window since we're using external browser
    } else {
      // Handle other protocol URLs (non-auth)
      if (mainWindow) {
        mainWindow.webContents.send('protocol-url', { url })
      }
    }
  } catch (parseError) {
    console.error('Error parsing protocol URL:', parseError)
    if (mainWindow) {
      mainWindow.webContents.send('protocol-url', {
        url,
        error: 'Failed to parse authentication response'
      })
    }
  }

  // ⑥ Focus the main window
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
}

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
    minHeight: HEIGHT.PILL,
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
}

// Register as default protocol client
if (!app.isDefaultProtocolClient(PROTOCOL)) {
  app.setAsDefaultProtocolClient(PROTOCOL)
}

// Handle protocol URLs on Windows/Linux
app.on('second-instance', (event, commandLine, workingDirectory) => {
  // Find protocol URL in command line arguments
  const protocolUrl = commandLine.find((arg) => arg.startsWith(`${PROTOCOL}://`))
  if (protocolUrl) {
    handleProtocolUrl(protocolUrl)
  }

  // Focus the main window
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

// Handle protocol URLs on macOS
app.on('open-url', (event, url) => {
  event.preventDefault()
  handleProtocolUrl(url)
})

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

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    createWindow()

    // Handle any pending protocol URL from app launch
    if (process.env.PENDING_PROTOCOL_URL) {
      handleProtocolUrl(process.env.PENDING_PROTOCOL_URL)
      delete process.env.PENDING_PROTOCOL_URL
    }

    // Handle protocol URL from command line on Windows/Linux
    if (process.platform !== 'darwin') {
      const protocolUrl = process.argv.find((arg) => arg.startsWith(`${PROTOCOL}://`))
      if (protocolUrl) {
        handleProtocolUrl(protocolUrl)
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
})

// main.ts - Add GPU constraints
app.commandLine.appendSwitch('disable-gpu-driver-bug-workarounds')
app.commandLine.appendSwitch('disable-software-rasterizer')

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

export { createWindow }
