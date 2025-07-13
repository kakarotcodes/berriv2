import { BrowserWindow, screen } from 'electron'
import { HEIGHT, WIDTH } from '../../../../constants/constants'
import path from 'path'
import fs from 'fs'
import { pathToFileURL } from 'url'

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
      webSecurity: false // Allow data URLs and file URLs to load
    },
    // Open DevTools for debugging
    ...(process.env.NODE_ENV === 'development' && {
      webPreferences: {
        ...{
          contextIsolation: false,
          nodeIntegration: true,
          backgroundThrottling: false,
          webSecurity: false
        },
        devTools: true
      }
    })
  })

  previewWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  // Try to load the standalone HTML file first
  const htmlPath = path.resolve(__dirname, '../../src/main/features/screenCapture/ui/preview.html')
  console.log('[PREVIEW_INTERNAL] Attempting to load HTML file from:', htmlPath)
  console.log('[PREVIEW_INTERNAL] __dirname is:', __dirname)
  console.log('[PREVIEW_INTERNAL] File exists?', fs.existsSync(htmlPath))

  if (fs.existsSync(htmlPath)) {
    console.log('[PREVIEW_INTERNAL] Loading standalone HTML file')

    try {
      // Read the HTML file content
      const htmlContent = fs.readFileSync(htmlPath, 'utf8')

      // Get the directory for base URL
      const htmlDir = path.dirname(htmlPath)
      const baseHref = pathToFileURL(htmlDir + '/').href

      console.log('[PREVIEW_INTERNAL] Base href will be:', baseHref)

      // Inject base tag at the beginning of <head>
      const baseTag = `<base href="${baseHref}">`
      const modifiedHtml = htmlContent.replace('<head>', `<head>\n  ${baseTag}`)

      // Write modified HTML to a temporary file and load it
      const tempHtmlPath = path.join(htmlDir, 'preview_temp.html')
      fs.writeFileSync(tempHtmlPath, modifiedHtml)

      console.log('[PREVIEW_INTERNAL] Created temporary HTML file at:', tempHtmlPath)
      console.log(
        '[PREVIEW_INTERNAL] Modified HTML content preview:',
        modifiedHtml.substring(0, 500) + '...'
      )

      // Load the temporary HTML file
      previewWindow
        .loadFile(tempHtmlPath)
        .then(() => {
          console.log('[PREVIEW_INTERNAL] Temporary HTML file loaded successfully')

          // Clean up temp file after a delay (disabled for debugging)
          // setTimeout(() => {
          //   try {
          //     fs.unlinkSync(tempHtmlPath)
          //     console.log('[PREVIEW_INTERNAL] Cleaned up temporary HTML file')
          //   } catch (error) {
          //     console.error('[PREVIEW_INTERNAL] Failed to clean up temp file:', error)
          //   }
          // }, 1000)
        })
        .catch((error) => {
          console.error('[PREVIEW_INTERNAL] Failed to load temporary HTML file:', error)
        })

      // Wait for DOM ready to set image and check button functions
      previewWindow.webContents.once('dom-ready', () => {
        console.log('[PREVIEW_INTERNAL] DOM is ready, setting image and checking buttons')

        // Add a small delay to ensure all scripts have loaded
        setTimeout(() => {
          console.log('[PREVIEW_INTERNAL] Running delayed debugging check...')

          previewWindow?.webContents
            .executeJavaScript(
              `
          // Set image source
          const img = document.getElementById('previewImage');
          if (img) {
            img.src = '${imageDataUrl}';
            console.log('[PREVIEW_SCRIPT] Image source set successfully');
          } else {
            console.error('[PREVIEW_SCRIPT] Could not find previewImage element');
          }
          
          // Check if button functions are available
          console.log('[PREVIEW_SCRIPT] Checking button functions:');
          console.log('[PREVIEW_SCRIPT] copyImage available:', typeof window.copyImage);
          console.log('[PREVIEW_SCRIPT] saveImage available:', typeof window.saveImage);
          console.log('[PREVIEW_SCRIPT] shareImage available:', typeof window.shareImage);
          console.log('[PREVIEW_SCRIPT] closeWindow available:', typeof window.closeWindow);
          
          // Check which scripts are loaded
          const scripts = document.querySelectorAll('script');
          console.log('[PREVIEW_SCRIPT] Number of script tags:', scripts.length);
          scripts.forEach((script, index) => {
            console.log('[PREVIEW_SCRIPT] Script', index + ':', script.src || 'inline script');
          });
          
          // Check base tag
          const base = document.querySelector('base');
          console.log('[PREVIEW_SCRIPT] Base tag href:', base ? base.href : 'no base tag');
          
          // Log any script errors
          window.addEventListener('error', (e) => {
            console.error('[PREVIEW_SCRIPT] Script error:', e.message, 'at', e.filename, ':', e.lineno);
          });
          
          // Check if scripts loaded but failed to execute
          const scriptElements = document.querySelectorAll('script[src]');
          scriptElements.forEach((script, index) => {
            script.addEventListener('load', () => {
              console.log('[PREVIEW_SCRIPT] Script loaded successfully:', script.src);
            });
            script.addEventListener('error', (e) => {
              console.error('[PREVIEW_SCRIPT] Script failed to load:', script.src, e);
            });
          });
        `
            )
            .catch((jsError) => {
              console.error('[PREVIEW_INTERNAL] Failed to execute JavaScript:', jsError)
            })
        }, 100) // Reduced delay for faster loading
      })

      previewWindow.webContents.on('did-fail-load', (_, errorCode, errorDescription) => {
        console.error('[PREVIEW_INTERNAL] Failed to load page:', errorCode, errorDescription)
      })
    } catch (error) {
      console.error('[PREVIEW_INTERNAL] Failed to read HTML file:', error)
      previewWindow?.destroy()
      previewWindow = null
      return
    }
  } else {
    console.error('[PREVIEW_INTERNAL] HTML file not found at:', htmlPath)
    previewWindow?.destroy()
    previewWindow = null
    return
  }

  previewWindow.once('ready-to-show', () => {
    console.log('[PREVIEW_INTERNAL] Preview window ready, showing...')
    previewWindow?.show()

    // DevTools disabled for production

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
