import { nativeImage } from 'electron'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { handlePreviewWindowManagement } from './previewWindowManager'

// Store the current screenshot path for renaming
let currentScreenshotPath: string | null = null

export async function handleSnippetCompletion(tempScreenshotPath: string) {
  console.log('[SNIPPET_EVENT] Handling snippet completion event')

  // Check if user took a snippet or cancelled (pressed escape)
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
    
    // Store the current screenshot path for potential renaming
    currentScreenshotPath = finalScreenshotPath

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

    console.log(
      '[SNIPPET_EVENT] Image processed successfully, URL type:',
      imageUrl.startsWith('data:') ? 'data URL' : 'file URL'
    )

    // Handle preview window management
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

export function getCurrentScreenshotPath(): string | null {
  return currentScreenshotPath
}

export async function renameCurrentScreenshot(newFilename: string): Promise<boolean> {
  console.log('[RENAME_SCREENSHOT] Function called with:', newFilename)
  console.log('[RENAME_SCREENSHOT] Current screenshot path:', currentScreenshotPath)
  
  if (!currentScreenshotPath) {
    console.error('[RENAME_SCREENSHOT] No current screenshot path available')
    return false
  }

  try {
    // Check if the current file exists before renaming
    const currentExists = await fs.access(currentScreenshotPath).then(() => true).catch(() => false)
    console.log('[RENAME_SCREENSHOT] Current file exists:', currentExists)
    
    if (!currentExists) {
      console.error('[RENAME_SCREENSHOT] Current screenshot file does not exist:', currentScreenshotPath)
      return false
    }

    // Sanitize filename to remove invalid characters
    const sanitizedFilename = newFilename.replace(/[<>:"/\\|?*]/g, '-').trim()
    console.log('[RENAME_SCREENSHOT] Sanitized filename:', sanitizedFilename)

    // Ensure the filename has .png extension
    const filename = sanitizedFilename.endsWith('.png')
      ? sanitizedFilename
      : `${sanitizedFilename}.png`
    console.log('[RENAME_SCREENSHOT] Final filename:', filename)

    // Create new path with custom filename
    const desktopPath = path.join(os.homedir(), 'Desktop')
    const newScreenshotPath = path.join(desktopPath, filename)
    console.log('[RENAME_SCREENSHOT] New screenshot path:', newScreenshotPath)

    // Check if target file already exists
    const targetExists = await fs.access(newScreenshotPath).then(() => true).catch(() => false)
    if (targetExists) {
      console.log('[RENAME_SCREENSHOT] Target file already exists, will overwrite')
    }

    // Rename the file
    await fs.rename(currentScreenshotPath, newScreenshotPath)
    console.log(
      '[RENAME_SCREENSHOT] Successfully renamed screenshot from:',
      currentScreenshotPath,
      'to:',
      newScreenshotPath
    )

    // Update the current path
    currentScreenshotPath = newScreenshotPath

    return true
  } catch (error) {
    console.error('[RENAME_SCREENSHOT] Failed to rename screenshot:', error)
    console.error('[RENAME_SCREENSHOT] Error details:', error instanceof Error ? error.message : String(error))
    return false
  }
}
