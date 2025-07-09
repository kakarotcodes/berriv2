import { ipcMain, BrowserWindow, nativeImage, clipboard } from 'electron'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

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
        await execAsync('screencapture -i -U /tmp/dummy_screenshot.png 2>/dev/null; rm -f /tmp/dummy_screenshot.png')
        console.log('[SCREEN_CAPTURE] Successfully opened screen capture toolbar via screencapture command')
        return { success: true }
      }
    } catch (error) {
      console.error('Failed to open screen capture toolbar:', error)
      return { 
        success: false, 
        error: 'Unable to open screen capture toolbar. Please try using Cmd+Shift+5 manually or grant accessibility permissions to this app in System Preferences > Security & Privacy > Privacy > Accessibility.'
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
        error: 'Unable to capture screenshot. Please grant accessibility permissions to this app in System Preferences > Security & Privacy > Privacy > Accessibility.'
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

    previewWindow = new BrowserWindow({
      width: 220,
      height: 250,
      frame: false,
      alwaysOnTop: true,
      transparent: true,
      resizable: false,
      skipTaskbar: true,
      webPreferences: {
        contextIsolation: false,
        nodeIntegration: true
      }
    })

         // Create simple HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            width: 220px; height: 250px;
            background: rgba(0, 0, 0, 0.9);
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }
          .image-container {
            width: 200px; height: 200px;
            margin: 10px;
            border-radius: 8px;
            overflow: hidden;
            background: #1a1a1a;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .preview-image {
            max-width: 100%; max-height: 100%;
            object-fit: contain;
            border-radius: 8px;
          }
          .toolbar {
            display: flex;
            justify-content: space-around;
            align-items: center;
            height: 40px;
            background: rgba(255, 255, 255, 0.05);
          }
          .toolbar-btn {
            width: 24px; height: 24px;
            border: none; background: none;
            cursor: pointer; border-radius: 4px;
            color: rgba(255, 255, 255, 0.8);
            transition: all 0.2s ease;
          }
          .toolbar-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            color: white;
          }
          .timer-dot {
            position: absolute;
            top: 8px; right: 8px;
            width: 4px; height: 4px;
            border-radius: 50%;
            background: #ff4444;
            animation: pulse 1s infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        </style>
      </head>
      <body>
        <div class="timer-dot"></div>
        <div class="image-container">
          <img class="preview-image" src="${imageDataUrl}" />
        </div>
        <div class="toolbar">
          <button class="toolbar-btn" onclick="copyImage()" title="Copy">📋</button>
          <button class="toolbar-btn" onclick="saveImage()" title="Save">💾</button>
          <button class="toolbar-btn" onclick="shareImage()" title="Share">📤</button>
          <button class="toolbar-btn" onclick="closeWindow()" title="Close">✕</button>
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

    previewWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`)

         previewWindow.once('ready-to-show', () => {
       console.log('[PREVIEW] Preview window ready, showing...')
       
       // Position window near cursor when ready
       const { screen } = require('electron')
       const cursorPosition = screen.getCursorScreenPoint()
       const display = screen.getDisplayNearestPoint(cursorPosition)
       
       // Calculate position with some offset, ensuring it stays on screen
       let x = cursorPosition.x + 15
       let y = cursorPosition.y + 15
       
       // Keep window on screen
       if (x + 220 > display.bounds.x + display.bounds.width) {
         x = cursorPosition.x - 235 // Position to the left instead
       }
       if (y + 250 > display.bounds.y + display.bounds.height) {
         y = cursorPosition.y - 265 // Position above instead
       }
       
       // Ensure minimum distance from screen edges
       x = Math.max(display.bounds.x + 10, x)
       y = Math.max(display.bounds.y + 10, y)
       
       previewWindow?.setPosition(x, y)
       previewWindow?.show()
       
       console.log(`[PREVIEW] Positioned at ${x}, ${y} (cursor was at ${cursorPosition.x}, ${cursorPosition.y})`)
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