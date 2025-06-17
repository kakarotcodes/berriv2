import { ipcMain } from 'electron'
import { exec } from 'child_process'
import { promisify } from 'util'

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
      // Try AppleScript first, fallback to screencapture command
      const appleScript = `
        tell application "System Events"
          key code 21 using {command down, shift down}
        end tell
      `
      
      try {
        await execAsync(`osascript -e '${appleScript}'`)
        console.log('[SNIPPING_TOOL] Successfully opened snipping tool via AppleScript')
        return { success: true }
      } catch (appleScriptError) {
        console.log('[SNIPPING_TOOL] AppleScript failed, trying alternative method')
        // Fallback: Use screencapture command for interactive selection
        await execAsync('screencapture -i -s /tmp/dummy_screenshot.png 2>/dev/null; rm -f /tmp/dummy_screenshot.png')
        console.log('[SNIPPING_TOOL] Successfully opened snipping tool via screencapture command')
        return { success: true }
      }
    } catch (error) {
      console.error('Failed to open snipping tool:', error)
      return { 
        success: false, 
        error: 'Unable to open snipping tool. Please try using Cmd+Shift+4 manually or grant accessibility permissions to this app in System Preferences > Security & Privacy > Privacy > Accessibility.'
      }
    }
  })
} 