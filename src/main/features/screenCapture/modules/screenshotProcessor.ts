import { nativeImage } from 'electron'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { handlePreviewWindowManagement } from './previewWindowManager'
import { GoogleGenAI } from '@google/genai'
import { AI_CONFIG } from '../../../../config/ai'

const genAI = new GoogleGenAI({
  apiKey: AI_CONFIG.GEMINI_API_KEY
})

async function extractTextFromScreenshot(imageBuffer: Buffer): Promise<string | null> {
  try {
    console.log('[OCR] Starting text extraction from screenshot...')
    
    const base64Image = imageBuffer.toString('base64')
    const mimeType = 'image/png'

    const prompt = `Extract all text content from this screenshot. Please:
1. Read all visible text accurately
2. Maintain the original structure and formatting where possible
3. Include any numbers, symbols, or special characters
4. Preserve line breaks and spacing when meaningful

Return only the extracted text content without any additional commentary or descriptions.`

    const response = await genAI.models.generateContent({
      model: AI_CONFIG.MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: base64Image
              }
            }
          ]
        }
      ]
    })

    const extractedText = response.text?.trim()
    
    if (extractedText && extractedText.length >= AI_CONFIG.OCR.MIN_TEXT_LENGTH) {
      console.log('[OCR] Text extraction successful, length:', extractedText.length)
      return extractedText
    } else {
      console.log('[OCR] No significant text found in screenshot')
      return null
    }
  } catch (error) {
    console.error('[OCR] Error extracting text from screenshot:', error)
    return null
  }
}

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

    // Extract text from screenshot using OCR
    const extractedText = await extractTextFromScreenshot(imageBuffer)

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

    // Handle preview window management with OCR text
    handlePreviewWindowManagement(imageUrl, {
      imagePath: finalScreenshotPath,
      extractedText: extractedText
    })

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
