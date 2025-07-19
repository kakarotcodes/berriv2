import { ipcMain, clipboard, nativeImage } from 'electron'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import os from 'os'
import { handleSnippetCompletion, renameCurrentScreenshot } from './scripts/screenshotProcessor'
import { getPreviewWindow } from './scripts/previewWindowManager'

const execAsync = promisify(exec)

// Function to share screenshot with specific apps
async function shareWithApp(imagePath: string, appName: string) {
  console.log(`[SHARE] Sharing image with ${appName}:`, imagePath)

  try {
    switch (appName.toLowerCase()) {
      case 'discord':
        await shareWithDiscord(imagePath)
        break
      case 'slack':
        await shareWithSlack(imagePath)
        break
      case 'whatsapp':
        await shareWithWhatsApp(imagePath)
        break
      case 'telegram':
        await shareWithTelegram(imagePath)
        break
      case 'messages':
        await shareWithMessages(imagePath)
        break
      case 'mail':
        await shareWithMail(imagePath)
        break
      default:
        console.error(`[SHARE] Unsupported app: ${appName}`)
    }
  } catch (error) {
    console.error(`[SHARE] Error sharing with ${appName}:`, error)
  }
}

// Discord sharing function
async function shareWithDiscord(imagePath: string) {
  try {
    // Method 1: Copy image to clipboard using Electron's clipboard API
    console.log('[SHARE] Copying image to clipboard and opening Discord')

    // Read image and put it on clipboard
    const fs = await import('fs/promises')
    const imageBuffer = await fs.readFile(imagePath)
    const image = nativeImage.createFromBuffer(imageBuffer)

    // Copy to clipboard
    clipboard.writeImage(image)
    console.log('[SHARE] Image copied to clipboard')

    // Open Discord
    await execAsync('open -a Discord')
    console.log('[SHARE] Discord opened - you can now paste (Cmd+V) the image')

    // Show a notification or log message
    console.log('[SHARE] TIP: Go to Discord and press Cmd+V to paste the image')
  } catch (error) {
    console.error('[SHARE] Error with Discord clipboard method:', error)

    // Fallback: Try drag and drop approach
    try {
      console.log('[SHARE] Trying drag and drop approach')
      // This will open Discord and show the image file in Finder
      await execAsync(`open -a Discord`)
      setTimeout(async () => {
        await execAsync(`open -R "${imagePath}"`)
      }, 1000)
      console.log(
        '[SHARE] Discord opened and image will be revealed in Finder - drag the image to Discord'
      )
    } catch (fallbackError) {
      console.error('[SHARE] Fallback method failed:', fallbackError)
      // Last resort: Use native share
      await openWithNativeShare(imagePath)
    }
  }
}

// Slack sharing function
async function shareWithSlack(imagePath: string) {
  try {
    await execAsync(`open -a Slack "${imagePath}"`)
    console.log('[SHARE] Successfully opened Slack with image')
  } catch (error) {
    console.error('[SHARE] Error opening Slack:', error)
    await openWithNativeShare(imagePath)
  }
}

// WhatsApp sharing function
async function shareWithWhatsApp(imagePath: string) {
  try {
    await execAsync(`open -a WhatsApp "${imagePath}"`)
    console.log('[SHARE] Successfully opened WhatsApp with image')
  } catch (error) {
    console.error('[SHARE] Error opening WhatsApp:', error)
    await openWithNativeShare(imagePath)
  }
}

// Telegram sharing function
async function shareWithTelegram(imagePath: string) {
  try {
    await execAsync(`open -a Telegram "${imagePath}"`)
    console.log('[SHARE] Successfully opened Telegram with image')
  } catch (error) {
    console.error('[SHARE] Error opening Telegram:', error)
    await openWithNativeShare(imagePath)
  }
}

// Messages sharing function
async function shareWithMessages(imagePath: string) {
  try {
    await execAsync(`open -a Messages "${imagePath}"`)
    console.log('[SHARE] Successfully opened Messages with image')
  } catch (error) {
    console.error('[SHARE] Error opening Messages:', error)
    await openWithNativeShare(imagePath)
  }
}

// Mail sharing function
async function shareWithMail(imagePath: string) {
  try {
    await execAsync(`open -a Mail "${imagePath}"`)
    console.log('[SHARE] Successfully opened Mail with image')
  } catch (error) {
    console.error('[SHARE] Error opening Mail:', error)
    await openWithNativeShare(imagePath)
  }
}

// Fallback: Open with native macOS share sheet
async function openWithNativeShare(imagePath: string) {
  try {
    // Use Quick Look to show the image with sharing options
    await execAsync(`qlmanage -p "${imagePath}" 2>/dev/null &`)
    console.log('[SHARE] Opened with Quick Look - use the share button in the preview')
  } catch (error) {
    console.error('[SHARE] Error with Quick Look:', error)
    // Last resort: Just open the image in default app
    await execAsync(`open "${imagePath}"`)
  }
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

  ipcMain.on('preview-copy', async () => {
    console.log('[PREVIEW] Copy action triggered')

    try {
      const { getCurrentScreenshotPath } = await import('./scripts/screenshotProcessor')
      const screenshotPath = getCurrentScreenshotPath()

      if (!screenshotPath) {
        console.error('[PREVIEW] No screenshot path available for copying')
        return
      }

      // Check if file exists
      const fs = await import('fs/promises')
      try {
        await fs.access(screenshotPath)
      } catch (error) {
        console.error('[PREVIEW] Screenshot file not found:', screenshotPath)
        return
      }

      // Copy image to clipboard
      const imageBuffer = await fs.readFile(screenshotPath)
      const image = nativeImage.createFromBuffer(imageBuffer)
      clipboard.writeImage(image)

      console.log('[PREVIEW] Image copied to clipboard successfully')
    } catch (error) {
      console.error('[PREVIEW] Error copying image to clipboard:', error)
    }
  })

  ipcMain.on('preview-save', async (event, filename = 'Screenshot') => {
    console.log('[PREVIEW] IPC preview-save received!')
    console.log('[PREVIEW] Event object:', event)
    console.log('[PREVIEW] Filename received:', filename)
    console.log('[PREVIEW] Filename type:', typeof filename)

    try {
      const success = await renameCurrentScreenshot(filename)
      if (success) {
        console.log('[PREVIEW] Successfully renamed screenshot to:', filename)
      } else {
        console.error(
          '[PREVIEW] Failed to rename screenshot - renameCurrentScreenshot returned false'
        )
      }
    } catch (error) {
      console.error('[PREVIEW] Error renaming screenshot:', error)
    }
  })

  ipcMain.on('preview-share', async (event, appName) => {
    console.log('[PREVIEW] Share action triggered for app:', appName)

    try {
      const { getCurrentScreenshotPath } = await import('./scripts/screenshotProcessor')
      const screenshotPath = getCurrentScreenshotPath()

      if (!screenshotPath) {
        console.error('[PREVIEW] No screenshot path available for sharing')
        return
      }

      // Check if file exists
      const fs = await import('fs/promises')
      try {
        await fs.access(screenshotPath)
      } catch (error) {
        console.error('[PREVIEW] Screenshot file not found:', screenshotPath)
        return
      }

      await shareWithApp(screenshotPath, appName)
    } catch (error) {
      console.error('[PREVIEW] Error sharing screenshot:', error)
    }
  })

  ipcMain.handle('preview-get-file-path', async () => {
    console.log('[PREVIEW] Get file path action triggered for drag and drop')

    try {
      const { getCurrentScreenshotPath } = await import('./scripts/screenshotProcessor')
      const screenshotPath = getCurrentScreenshotPath()

      if (!screenshotPath) {
        console.error('[PREVIEW] No screenshot path available for drag and drop')
        return null
      }

      // Check if file exists
      const fs = await import('fs/promises')
      try {
        await fs.access(screenshotPath)
        console.log('[PREVIEW] File path for drag and drop:', screenshotPath)
        return screenshotPath
      } catch (error) {
        console.error('[PREVIEW] Screenshot file not found:', screenshotPath)
        return null
      }
    } catch (error) {
      console.error('[PREVIEW] Error getting file path for drag and drop:', error)
      return null
    }
  })

  ipcMain.handle('preview-start-drag', async (event) => {
    console.log('[PREVIEW] Start drag operation triggered')

    try {
      const { getCurrentScreenshotPath } = await import('./scripts/screenshotProcessor')
      const screenshotPath = getCurrentScreenshotPath()

      if (!screenshotPath) {
        console.error('[PREVIEW] No screenshot path available for drag operation')
        return { success: false, error: 'No screenshot path available' }
      }

      // Check if file exists
      const fs = await import('fs/promises')
      try {
        await fs.access(screenshotPath)
      } catch (error) {
        console.error('[PREVIEW] Screenshot file not found:', screenshotPath)
        return { success: false, error: 'Screenshot file not found' }
      }

      // Create native image for drag
      const image = nativeImage.createFromPath(screenshotPath)

      // Start the drag operation
      event.sender.startDrag({
        file: screenshotPath,
        icon: image.resize({ width: 64, height: 64 })
      })

      console.log('[PREVIEW] Drag operation started successfully for:', screenshotPath)
      return { success: true }
    } catch (error) {
      console.error('[PREVIEW] Error starting drag operation:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  ipcMain.on('preview-start-native-drag', async (event) => {
    console.log('[PREVIEW] Native drag operation triggered via send')

    try {
      const { getCurrentScreenshotPath } = await import('./scripts/screenshotProcessor')
      const screenshotPath = getCurrentScreenshotPath()

      if (!screenshotPath) {
        console.error('[PREVIEW] No screenshot path available for native drag')
        return
      }

      // Check if file exists
      const fs = await import('fs/promises')
      try {
        await fs.access(screenshotPath)
      } catch (error) {
        console.error('[PREVIEW] Screenshot file not found:', screenshotPath)
        return
      }

      // Create native image for drag
      const image = nativeImage.createFromPath(screenshotPath)

      // Start the drag operation
      event.sender.startDrag({
        file: screenshotPath,
        icon: image.resize({ width: 64, height: 64 })
      })

      console.log('[PREVIEW] Native drag operation started successfully for:', screenshotPath)
    } catch (error) {
      console.error('[PREVIEW] Error starting native drag operation:', error)
    }
  })
}
