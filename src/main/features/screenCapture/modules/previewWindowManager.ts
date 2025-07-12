import { BrowserWindow, screen } from 'electron'
import { HEIGHT, WIDTH } from '../../../../constants/constants'
import { createPreviewHTML } from '../ui/previewTemplate'

let previewWindow: BrowserWindow | null = null

export function handlePreviewWindowManagement(imageUrl: string) {
  console.log('[PREVIEW_MANAGEMENT] Managing preview window for new snippet')
  
  // Check if preview window is already open
  const isWindowOpen = previewWindow && !previewWindow.isDestroyed()
  
  if (isWindowOpen) {
    console.log('[PREVIEW_MANAGEMENT] Existing preview window found, closing it first...')
    previewWindow!.destroy()
    previewWindow = null
    
    // Wait for window to be fully destroyed, then create new one
    setTimeout(() => {
      console.log('[PREVIEW_MANAGEMENT] Creating new preview window after closing existing one')
      createPreviewWindowOnCurrentScreen(imageUrl)
    }, 150)
  } else {
    console.log('[PREVIEW_MANAGEMENT] No existing preview window, creating new one immediately')
    createPreviewWindowOnCurrentScreen(imageUrl)
  }
}

function createPreviewWindowOnCurrentScreen(imageUrl: string) {
  console.log('[PREVIEW_CURRENT_SCREEN] Creating preview window on current screen')
  
  // Get current cursor position to determine which screen to show preview on
  const cursorPosition = screen.getCursorScreenPoint()
  const display = screen.getDisplayNearestPoint(cursorPosition)
  
  console.log('[PREVIEW_CURRENT_SCREEN] Current cursor position:', cursorPosition)
  console.log('[PREVIEW_CURRENT_SCREEN] Target display bounds:', display.bounds)
  
  // Validate image data
  if (!imageUrl || typeof imageUrl !== 'string') {
    console.error('[PREVIEW_CURRENT_SCREEN] Invalid image URL provided!')
    return
  }
  
  if (!imageUrl.startsWith('data:image/') && !imageUrl.startsWith('file://')) {
    console.error('[PREVIEW_CURRENT_SCREEN] Image URL is neither data: nor file: URL!')
    return
  }
  
  console.log('[PREVIEW_CURRENT_SCREEN] Image URL validation passed, creating window...')
  
  // Create the preview window
  createPreviewWindowInternalOnDisplay(imageUrl, display)
}

function createPreviewWindowInternalOnDisplay(imageDataUrl: string, display: Electron.Display) {
  console.log('[PREVIEW_INTERNAL] Creating preview window on display:', display.bounds)

  // Calculate position at bottom center of the target screen
  const windowWidth = WIDTH.SCREENSHOT_PREVIEW
  const windowHeight = HEIGHT.SCREENSHOT_PREVIEW
  const bottomPadding = 20

  const x = display.bounds.x + (display.bounds.width - windowWidth) / 2
  const y = display.bounds.y + display.bounds.height - windowHeight - bottomPadding

  console.log('[PREVIEW_INTERNAL] Window position calculated:', { x, y })

  previewWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: x,
    y: y,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    vibrancy: 'under-window',
    visualEffectState: 'active',
    roundedCorners: true,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      backgroundThrottling: false,
      webSecurity: false  // Allow data URLs and file URLs to load
    }
  })

  // Create the HTML content
  const htmlContent = createPreviewHTML(imageDataUrl)

  previewWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  previewWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`)

  previewWindow.once('ready-to-show', () => {
    console.log('[PREVIEW_INTERNAL] Preview window ready, showing...')
    previewWindow?.show()
    console.log('[PREVIEW_INTERNAL] Window positioned at:', { x, y }, 'on display:', display.bounds)
  })

  previewWindow.on('closed', () => {
    console.log('[PREVIEW_INTERNAL] Preview window closed')
    previewWindow = null
  })
}

export function getPreviewWindow(): BrowserWindow | null {
  return previewWindow
}