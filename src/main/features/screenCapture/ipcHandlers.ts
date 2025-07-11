import { ipcMain, BrowserWindow, nativeImage, screen } from 'electron'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { HEIGHT, WIDTH } from '../../../constants/constants'

const execAsync = promisify(exec)

let previewWindow: BrowserWindow | null = null

// Step 1: Event listener for snippet completion
async function handleSnippetCompletion(tempScreenshotPath: string) {
  console.log('[SNIPPET_EVENT] Handling snippet completion event')
  
  // Step 2: Check if user took a snippet or cancelled (pressed escape)
  try {
    await fs.access(tempScreenshotPath)
    console.log('[SNIPPET_EVENT] Screenshot file exists, checking size...')

    const stats = await fs.stat(tempScreenshotPath)
    if (stats.size === 0) {
      console.log('[SNIPPET_EVENT] Screenshot file is empty (user cancelled/escaped)')
      await fs.unlink(tempScreenshotPath).catch(() => {})
      return
    }

    console.log('[SNIPPET_EVENT] User took a screenshot, size:', stats.size)
    
    // Process the screenshot
    const imageBuffer = await fs.readFile(tempScreenshotPath)
    const image = nativeImage.createFromBuffer(imageBuffer)
    
    if (image.isEmpty()) {
      console.error('[SNIPPET_EVENT] Failed to create image from buffer')
      await fs.unlink(tempScreenshotPath).catch(() => {})
      return
    }

    // Save to desktop with proper macOS naming
    const now = new Date()
    const formattedTime = now.toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const desktopPath = path.join(os.homedir(), 'Desktop')
    const finalScreenshotPath = path.join(desktopPath, `Screen Shot ${formattedTime}.png`)
    
    await fs.copyFile(tempScreenshotPath, finalScreenshotPath)
    console.log('[SNIPPET_EVENT] Screenshot saved to desktop:', finalScreenshotPath)

    // Create data URL for preview
    const dataUrl = image.toDataURL()
    if (!dataUrl || dataUrl.length < 100) {
      console.error('[SNIPPET_EVENT] Failed to generate data URL')
      await fs.unlink(tempScreenshotPath).catch(() => {})
      return
    }

    // Use file URL for large images to avoid browser limits
    let imageUrl = dataUrl
    if (dataUrl.length > 2 * 1024 * 1024) {
      console.log('[SNIPPET_EVENT] Using file URL for large image:', finalScreenshotPath)
      imageUrl = `file://${finalScreenshotPath}`
    }

    console.log('[SNIPPET_EVENT] Image processed successfully, URL type:', imageUrl.startsWith('data:') ? 'data URL' : 'file URL')
    
    // Step 3: Handle preview window management
    handlePreviewWindowManagement(imageUrl)

    // Clean up temp file
    setTimeout(async () => {
      try {
        await fs.unlink(tempScreenshotPath)
        console.log('[SNIPPET_EVENT] Temp file cleaned up')
      } catch (err) {
        console.log('[SNIPPET_EVENT] Temp file already cleaned up')
      }
    }, 5000)

  } catch (accessError) {
    console.log('[SNIPPET_EVENT] No screenshot file found (user cancelled/escaped)')
  }
}

// Step 3: Manage preview window lifecycle
function handlePreviewWindowManagement(imageUrl: string) {
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

// Create preview window on the screen where mouse cursor currently is
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

// Create preview window on specific display
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

// Create HTML content for preview window
function createPreviewHTML(imageDataUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        :root {
          /* Light theme colors (matching Berri's theme system) */
          --color-surface-canvas: 255 255 255;
          --color-surface-primary: 242 242 242;
          --color-surface-elevated: 255 255 255;
          --color-border-primary: 209 209 214;
          --color-border-subtle: 229 229 231;
          --color-text-primary: 0 0 0;
          --color-text-secondary: 60 60 67;
          --color-accent-blue: 10 132 255;
          --color-status-success: 48 209 88;
          --color-status-destructive: 255 69 58;
          --color-shadow-card: 0 0 0;
        }

        @media (prefers-color-scheme: dark) {
          :root {
            --color-surface-canvas: 30 30 30;
            --color-surface-primary: 44 44 46;
            --color-surface-elevated: 44 44 46;
            --color-border-primary: 60 60 67;
            --color-border-subtle: 72 72 74;
            --color-text-primary: 255 255 255;
            --color-text-secondary: 235 235 245;
            --color-shadow-card: 0 0 0;
          }
        }

        * { 
          margin: 0; 
          padding: 0; 
          box-sizing: border-box; 
        }

        body {
          width: 300px; 
          height: 300px;
          /* Frosted glass effect matching Berri's main window */
          background: rgb(var(--color-surface-canvas) / 0.05);
          backdrop-filter: blur(36px);
          -webkit-backdrop-filter: blur(36px);
          border-radius: 12px;
          border: 1px solid rgb(var(--color-border-subtle) / 0.5);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-weight: 400;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          position: relative;
          /* macOS-native text rendering */
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: rgb(var(--color-surface-elevated) / 0.1);
          border-bottom: 1px solid rgb(var(--color-border-subtle) / 0.3);
        }

        .preview-title {
          font-size: 13px;
          font-weight: 500;
          color: rgb(var(--color-text-primary));
          letter-spacing: -0.01em;
        }

        .timer-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: rgb(var(--color-text-secondary));
          font-weight: 500;
        }

        .timer-dot {
          width: 6px; 
          height: 6px;
          border-radius: 50%;
          background: rgb(var(--color-status-destructive));
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.9); }
        }

        .image-container {
          flex: 1;
          margin: 16px;
          border-radius: 8px;
          overflow: hidden;
          background: rgb(var(--color-surface-primary) / 0.3);
          border: 1px solid rgb(var(--color-border-subtle) / 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .preview-image {
          max-width: 100%; 
          max-height: 100%;
          object-fit: contain;
          border-radius: 6px;
          box-shadow: 0 2px 8px rgb(var(--color-shadow-card) / 0.1);
        }

        .toolbar {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: rgb(var(--color-surface-elevated) / 0.05);
          border-top: 1px solid rgb(var(--color-border-subtle) / 0.3);
        }

        .toolbar-btn {
          width: 32px; 
          height: 32px;
          border: none; 
          background: rgb(var(--color-surface-primary) / 0.6);
          cursor: pointer; 
          border-radius: 6px;
          color: rgb(var(--color-text-primary));
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
          border: 1px solid rgb(var(--color-border-subtle) / 0.5);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .toolbar-btn:hover {
          background: rgb(var(--color-surface-elevated) / 0.8);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgb(var(--color-shadow-card) / 0.15);
          border-color: rgb(var(--color-border-primary) / 0.8);
        }

        .toolbar-btn:active {
          transform: translateY(0);
          box-shadow: 0 2px 4px rgb(var(--color-shadow-card) / 0.1);
        }

        .toolbar-btn.primary {
          background: rgb(var(--color-accent-blue));
          color: white;
          border-color: rgb(var(--color-accent-blue));
        }

        .toolbar-btn.primary:hover {
          background: rgb(var(--color-accent-blue) / 0.9);
          border-color: rgb(var(--color-accent-blue) / 0.9);
        }

        .toolbar-btn.destructive {
          background: rgb(var(--color-status-destructive) / 0.1);
          color: rgb(var(--color-status-destructive));
          border-color: rgb(var(--color-status-destructive) / 0.3);
        }

        .toolbar-btn.destructive:hover {
          background: rgb(var(--color-status-destructive) / 0.2);
          border-color: rgb(var(--color-status-destructive) / 0.5);
        }

        /* Accessibility improvements */
        .toolbar-btn:focus {
          outline: 2px solid rgb(var(--color-accent-blue) / 0.5);
          outline-offset: 2px;
        }

        /* Dark theme adjustments */
        @media (prefers-color-scheme: dark) {
          .preview-image {
            box-shadow: 0 2px 8px rgb(var(--color-shadow-card) / 0.3);
          }
          
          .toolbar-btn:hover {
            box-shadow: 0 4px 12px rgb(var(--color-shadow-card) / 0.4);
          }
        }
      </style>
    </head>
    <body>
      <div class="preview-header">
        <div class="preview-title">Screenshot Preview</div>
        <div class="timer-indicator">
          <div class="timer-dot"></div>
          <span>Auto-close</span>
        </div>
      </div>
      
      <div class="image-container">
        <img class="preview-image" src="${imageDataUrl}" alt="Screenshot preview" 
             onload="console.log('[PREVIEW] Image loaded successfully', this.naturalWidth, 'x', this.naturalHeight); document.body.style.borderColor='green';" 
             onerror="console.error('[PREVIEW] Image failed to load. URL type:', this.src ? (this.src.startsWith('data:') ? 'data URL' : 'file URL') : 'null', 'Length:', this.src ? this.src.length : 'null'); document.body.style.borderColor='red'; this.style.display='none';" />
      </div>
      
      <div class="toolbar">
        <button class="toolbar-btn primary" onclick="copyImage()" title="Copy to clipboard">
          📋
        </button>
        <button class="toolbar-btn" onclick="saveImage()" title="Save to file">
          💾
        </button>
        <button class="toolbar-btn" onclick="shareImage()" title="Share">
          📤
        </button>
        <button class="toolbar-btn destructive" onclick="closeWindow()" title="Close">
          ✕
        </button>
      </div>
               <script>
         console.log('[PREVIEW] Script loading...');
         const { ipcRenderer } = require('electron');
         console.log('[PREVIEW] ipcRenderer loaded:', !!ipcRenderer);
         
         let timer = null;
         
         function startAutoCloseTimer() {
           console.log('[PREVIEW] Starting auto-close timer...');
           if (timer) clearTimeout(timer);
           timer = setTimeout(() => {
             console.log('[PREVIEW] Auto-close timer firing...');
             try {
               ipcRenderer.send('preview-close');
             } catch (error) {
               console.error('[PREVIEW] IPC failed, using window.close():', error);
               window.close();
             }
           }, 5000);
         }
         
         // Log when DOM is ready
         document.addEventListener('DOMContentLoaded', () => {
           console.log('[PREVIEW] DOM loaded');
           const img = document.querySelector('.preview-image');
           console.log('[PREVIEW] Image element found:', !!img);
           if (img) {
             console.log('[PREVIEW] Image src length:', img.src ? img.src.length : 'null');
             console.log('[PREVIEW] Image src type:', img.src ? (img.src.startsWith('data:') ? 'data URL' : img.src.startsWith('file://') ? 'file URL' : 'unknown') : 'null');
             console.log('[PREVIEW] Image complete status:', img.complete);
             console.log('[PREVIEW] Image natural dimensions:', img.naturalWidth, 'x', img.naturalHeight);
             
             // Start the auto-close timer
             startAutoCloseTimer();
             
             // Set timeout to detect if image never loads
             setTimeout(() => {
               console.log('[PREVIEW] 3-second check - complete:', img.complete, 'naturalWidth:', img.naturalWidth);
               if (!img.complete || img.naturalWidth === 0) {
                 console.error('[PREVIEW] Image failed to load within 3 seconds');
                 document.body.style.borderColor = 'orange';
                 // Still start timer even if image fails to load
                 if (!timer) startAutoCloseTimer();
               }
             }, 3000);
           } else {
             console.error('[PREVIEW] Image element not found!');
             // Start timer anyway
             startAutoCloseTimer();
           }
         });
         
         document.body.addEventListener('mouseenter', () => {
           console.log('[PREVIEW] Mouse entered, clearing timer');
           if (timer) clearTimeout(timer);
           timer = null;
         });
         
         document.body.addEventListener('mouseleave', () => {
           console.log('[PREVIEW] Mouse left, restarting timer');
           startAutoCloseTimer();
         });
         
         function copyImage() {
           console.log('[PREVIEW] Copy button clicked');
           ipcRenderer.send('preview-copy');
         }
         
         function saveImage() {
           console.log('[PREVIEW] Save button clicked');
           ipcRenderer.send('preview-save');
         }
         
         function shareImage() {
           console.log('[PREVIEW] Share button clicked');
           ipcRenderer.send('preview-share');
         }
         
         function closeWindow() {
           console.log('[PREVIEW] Close button clicked');
           try {
             ipcRenderer.send('preview-close');
           } catch (error) {
             console.error('[PREVIEW] IPC failed, using window.close():', error);
             window.close();
           }
         }
         
         console.log('[PREVIEW] Script loaded successfully');
       </script>
    </body>
    </html>
  `
}

export function registerScreenCaptureHandlers() {
  // Register IPC handler for opening macOS screen capture toolbar (Cmd+Shift+5)
  ipcMain.handle('screen-capture:open-toolbar', async () => {
    try {
      // Try AppleScript first, fallback to screencapture command
      const appleScript = `
        tell application "System Events"
          key code 23 using {command down, shift down}
        end tell
      `

      try {
        await execAsync(`osascript -e '${appleScript}'`)
        console.log('[SCREEN_CAPTURE] Successfully opened screen capture toolbar via AppleScript')
        return { success: true }
      } catch (appleScriptError) {
        console.log('[SCREEN_CAPTURE] AppleScript failed, trying alternative method')
        // Fallback: Use screencapture command to trigger interactive mode
        await execAsync(
          'screencapture -i -U /tmp/dummy_screenshot.png 2>/dev/null; rm -f /tmp/dummy_screenshot.png'
        )
        console.log(
          '[SCREEN_CAPTURE] Successfully opened screen capture toolbar via screencapture command'
        )
        return { success: true }
      }
    } catch (error) {
      console.error('Failed to open screen capture toolbar:', error)
      return {
        success: false,
        error:
          'Unable to open screen capture toolbar. Please try using Cmd+Shift+5 manually or grant accessibility permissions to this app in System Preferences > Security & Privacy > Privacy > Accessibility.'
      }
    }
  })

  // Register IPC handler for opening macOS snipping tool (Cmd+Shift+4)
  ipcMain.handle('screen-capture:open-snipping-tool', async () => {
    try {
      console.log('[SNIPPING_TOOL] Starting snipping tool with event-driven approach')

      // Create temporary file for capture detection
      const tempDir = os.tmpdir()
      const timestamp = Date.now()
      const tempScreenshotPath = path.join(tempDir, `berri-capture-${timestamp}.png`)

      console.log('[SNIPPING_TOOL] Capturing to temp file:', tempScreenshotPath)

      // Use screencapture -i which shows the native crosshair UI and waits for user interaction
      await execAsync(`screencapture -i "${tempScreenshotPath}"`)
      
      console.log('[SNIPPING_TOOL] Screenshot capture process completed')

      // Handle the snippet completion event
      await handleSnippetCompletion(tempScreenshotPath)

      return { success: true }
      
    } catch (error) {
      console.error('Failed to run snipping tool:', error)
      return {
        success: false,
        error: 'Unable to capture screenshot. Please grant accessibility permissions in System Preferences > Security & Privacy > Privacy > Accessibility.'
      }
    }
  })





  // IPC handlers for preview window actions
  ipcMain.on('preview-close', () => {
    console.log('[PREVIEW] IPC preview-close received')
    if (previewWindow && !previewWindow.isDestroyed()) {
      console.log('[PREVIEW] Closing preview window')
      previewWindow.close()
    } else {
      console.log('[PREVIEW] Preview window not found or already destroyed')
    }
  })

  ipcMain.on('preview-copy', () => {
    console.log('[PREVIEW] Copy action triggered')
    // The image data is already in the preview window,
    // we'll copy from the original data that created the window
    // This is a simplified approach - in a real implementation,
    // you'd store the image data and copy it here
  })

  ipcMain.on('preview-save', () => {
    console.log('[PREVIEW] Save action triggered')
    // TODO: Implement save functionality
  })

  ipcMain.on('preview-share', () => {
    console.log('[PREVIEW] Share action triggered')
    // TODO: Implement share functionality
  })
}
