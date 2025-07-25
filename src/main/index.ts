import { app, BrowserWindow, screen, globalShortcut, ipcMain } from 'electron'
import path from 'path'
import fs from 'fs'
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
let lastViewBeforeHide: string | null = null

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
      sandbox: false,
      preload: path.join(__dirname, '../preload/index.js'),
      backgroundThrottling: false,
      devTools: true,
      nodeIntegration: false,
      webSecurity: false
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

  // Log when preload script finishes loading
  mainWindow.webContents.on('preload-error', (_event, preloadPath, error) => {
    console.error('[MAIN] Preload script error:', preloadPath, error)
  })

  mainWindow.webContents.once('did-finish-load', () => {
    console.log('[MAIN] WebContents did finish load')
  })

  mainWindow.webContents.once('dom-ready', () => {
    console.log('[MAIN] DOM ready - sending test message to verify preload')
    mainWindow!.webContents.send('test-message', 'Initial test from main process')
  })

  // Debug preload path
  const preloadPath = path.join(__dirname, '../preload/index.js')
  console.log('[MAIN] Preload path:', preloadPath)
  console.log('[MAIN] Preload file exists:', fs.existsSync(preloadPath))


  // Store the last view before hiding
  let lastViewBeforeHide: string | null = null

  // Toggle app visibility function
  function toggleAppVisibility() {
    if (!mainWindow || mainWindow.isDestroyed()) {
      console.log('[VISIBILITY] No main window available')
      return
    }

    const isVisible = mainWindow.isVisible()
    console.log(`[VISIBILITY] Current visibility: ${isVisible}`)

    if (isVisible) {
      // Before hiding, request the current view from renderer
      console.log('[VISIBILITY] Hiding app - requesting current view first')
      mainWindow.webContents.send('request-current-view-for-hide')
      
      // Hide after a short delay to allow view to be captured
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.hide()
        }
      }, 50)
    } else {
      // Show the app and restore to last view
      console.log('[VISIBILITY] Showing app')
      mainWindow.show()
      mainWindow.focus()
      
      // Reset opacity to 100% when showing via shortcut
      console.log('[VISIBILITY] Resetting opacity to 100%')
      mainWindow.setOpacity(1.0)
      
      // Also reset CSS opacity in renderer
      mainWindow.webContents.send('pill:set-css-opacity', 1.0)
      
      // Restore to the last view, defaulting to default if none was stored
      const viewToRestore = lastViewBeforeHide || 'default'
      console.log(`[VISIBILITY] Restoring to view: ${viewToRestore}`)
      
      // Only trigger view change if it's different from default view
      if (viewToRestore !== 'default') {
        setTimeout(() => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('restore-view-after-show', viewToRestore)
          }
        }, 100)
      }
      // If restoring to default view, don't send any message - let it stay as is
    }
  }

  // Handle the current view response when hiding
  ipcMain.on('current-view-for-hide', (_event, view) => {
    console.log(`[VISIBILITY] Storing current view before hide: ${view}`)
    lastViewBeforeHide = view
  })
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

    // Register global shortcuts after window is created
    registerGlobalShortcuts()

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
  globalShortcut.unregisterAll()
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

// Toggle app visibility function
function toggleAppVisibility() {
  if (!mainWindow || mainWindow.isDestroyed()) return
  const visible = mainWindow.isVisible()
  if (visible) {
    mainWindow.webContents.send('request-current-view-for-hide')
    setTimeout(() => mainWindow?.hide(), 50)
  } else {
    mainWindow.show()
    mainWindow.focus()
    mainWindow.setOpacity(1)
    mainWindow.webContents.send('pill:set-css-opacity', 1)
    const view = lastViewBeforeHide || 'default'
    if (view !== 'default') {
      setTimeout(() => mainWindow?.webContents.send('restore-view-after-show', view), 100)
    }
  }
}

// Show module in hover view function
function showModuleInHoverView(module: string) {
  if (!mainWindow || mainWindow.isDestroyed()) return
  if (!mainWindow.isVisible()) mainWindow.show()
  mainWindow.focus()
  mainWindow.setOpacity(1)
  mainWindow.webContents.send('pill:set-css-opacity', 1)
  setTimeout(() => mainWindow?.webContents.send('open-module-in-hover', module), 100)
}

// Handle the current view response when hiding
ipcMain.on('current-view-for-hide', (_e, view) => {
  lastViewBeforeHide = view
})

// Register global shortcuts function
function registerGlobalShortcuts() {
  console.log('[MAIN] Registering global shortcuts...')

  // Register existing shortcuts
  if (!globalShortcut.register('CommandOrControl+Shift+G', () => {
    mainWindow?.webContents.send('trigger-ai-notes-shortcut')
  })) {
    console.error('Failed to register CommandOrControl+Shift+G')
  }

  if (!globalShortcut.register('CommandOrControl+Escape', () => {
    mainWindow?.webContents.send('trigger-collapse-to-pill')
  })) {
    console.error('Failed to register CommandOrControl+Escape')
  }

  // Register Control+E for visibility toggle
  if (!globalShortcut.register('Control+E', toggleAppVisibility)) {
    console.error('Failed to register Control+E')
  }

  // Register module shortcuts
  const map: Record<string, string> = {
    'Control+1': 'emails',
    'Control+2': 'calendar',
    'Control+3': 'notes',
    'Control+4': 'clipboard',
    'Control+5': 'screenshots'
  }

  Object.entries(map).forEach(([acc, moduleName]) => {
    const ok = globalShortcut.register(acc, () => showModuleInHoverView(moduleName))
    console.log(`[MAIN] ${acc} registered?`, ok, globalShortcut.isRegistered(acc))
    if (!ok) console.error(`Failed to register ${acc}`)
  })
}

export { createWindow }
