import { ipcMain } from 'electron'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import os from 'os'
import { handleSnippetCompletion } from './modules/screenshotProcessor'
import { getPreviewWindow } from './modules/previewWindowManager'

const execAsync = promisify(exec)

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
      } catch {
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
        error:
          'Unable to capture screenshot. Please grant accessibility permissions in System Preferences > Security & Privacy > Privacy > Accessibility.'
      }
    }
  })

  // IPC handlers for preview window actions
  ipcMain.on('preview-close', () => {
    console.log('[PREVIEW] IPC preview-close received')
    const previewWindow = getPreviewWindow()
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