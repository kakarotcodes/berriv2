import { nativeImage } from 'electron'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { handlePreviewWindowManagement } from './previewWindowManager'

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
