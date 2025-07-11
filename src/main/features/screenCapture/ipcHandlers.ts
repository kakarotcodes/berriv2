import { ipcMain, BrowserWindow, nativeImage, screen } from 'electron'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { HEIGHT, WIDTH } from '../../../constants/constants'

const execAsync = promisify(exec)

let previewWindow: BrowserWindow | null = null

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
      console.log('[SNIPPING_TOOL] Starting snipping tool with preview')

      // Create temporary file for screenshot
      const tempDir = os.tmpdir()
      const timestamp = Date.now()
      const screenshotPath = path.join(tempDir, `berri-snippet-${timestamp}.png`)

      console.log('[SNIPPING_TOOL] Capturing screenshot to:', screenshotPath)

      // Capture screenshot using macOS screencapture with interactive selection
      await execAsync(`screencapture -i -s "${screenshotPath}"`)

      // Check if file was created (user might have cancelled)
      try {
        await fs.access(screenshotPath)
        console.log('[SNIPPING_TOOL] Screenshot captured successfully')

        // Read the image and create preview window
        const imageBuffer = await fs.readFile(screenshotPath)
        const image = nativeImage.createFromBuffer(imageBuffer)
        const dataUrl = image.toDataURL()

        // Create preview window
        createPreviewWindow(dataUrl)

        // Clean up temp file
        setTimeout(async () => {
          try {
            await fs.unlink(screenshotPath)
          } catch (err) {
            console.log('[SNIPPING_TOOL] Temp file already cleaned up')
          }
        }, 10000)

        return { success: true }
      } catch (accessError) {
        console.log('[SNIPPING_TOOL] No screenshot captured (user cancelled)')
        return { success: true, cancelled: true }
      }
    } catch (error) {
      console.error('Failed to open snipping tool:', error)
      return {
        success: false,
        error:
          'Unable to capture screenshot. Please grant accessibility permissions to this app in System Preferences > Security & Privacy > Privacy > Accessibility.'
      }
    }
  })

  // Helper function to create preview window
  function createPreviewWindow(imageDataUrl: string) {
    console.log('[PREVIEW] Creating preview window...')

    // Close existing preview window if it exists
    if (previewWindow && !previewWindow.isDestroyed()) {
      previewWindow.close()
    }

    // Get cursor position to determine which screen to show the preview on
    const { screen } = require('electron')
    const cursorPosition = screen.getCursorScreenPoint()
    const display = screen.getDisplayNearestPoint(cursorPosition)

    // Calculate position at bottom center of the screen where cursor is
    const windowWidth = WIDTH.SCREENSHOT_PREVIEW
    const windowHeight = HEIGHT.SCREENSHOT_PREVIEW
    const bottomPadding = 20

    // Calculate center X position on the correct screen
    const x = display.bounds.x + (display.bounds.width - windowWidth) / 2

    // Calculate bottom Y position with padding on the correct screen
    const y = display.bounds.y + display.bounds.height - windowHeight - bottomPadding

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
        nodeIntegration: true
      }
    })

    // Create macOS-native HTML content matching Berri's design system
    const htmlContent = `
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
          <img class="preview-image" src="${imageDataUrl}" alt="Screenshot preview" />
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
           const { ipcRenderer } = require('electron');
           
           let timer = setTimeout(() => {
             ipcRenderer.send('preview-close');
           }, 5000);
           
           document.body.addEventListener('mouseenter', () => {
             clearTimeout(timer);
           });
           
           document.body.addEventListener('mouseleave', () => {
             timer = setTimeout(() => {
               ipcRenderer.send('preview-close');
             }, 5000);
           });
           
           function copyImage() {
             ipcRenderer.send('preview-copy');
           }
           
           function saveImage() {
             ipcRenderer.send('preview-save');
           }
           
           function shareImage() {
             ipcRenderer.send('preview-share');
           }
           
           function closeWindow() {
             ipcRenderer.send('preview-close');
           }
         </script>
      </body>
      </html>
    `

    // Make window visible on all workspaces
    previewWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

    previewWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`)

    previewWindow.once('ready-to-show', () => {
      console.log('[PREVIEW] Preview window ready, showing...')
      previewWindow?.show()

      console.log(
        `[PREVIEW] Positioned at bottom center: ${x}, ${y} (display bounds: ${display.bounds.width}x${display.bounds.height})`
      )
    })

    previewWindow.on('closed', () => {
      console.log('[PREVIEW] Preview window closed')
      previewWindow = null
    })

    console.log('[PREVIEW] Preview window created')
  }

  // IPC handlers for preview window actions
  ipcMain.on('preview-close', () => {
    if (previewWindow && !previewWindow.isDestroyed()) {
      previewWindow.close()
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
