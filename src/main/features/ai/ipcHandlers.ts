import { ipcMain } from 'electron'
import { GoogleGenAI } from '@google/genai'
import { AI_CONFIG, type SummarizationOptions, type OCROptions, type OCRResult } from '../../../config/ai'
import fs from 'fs'
import path from 'path'

const genAI = new GoogleGenAI({
  apiKey: AI_CONFIG.GEMINI_API_KEY
})

function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim()
}

function createSummarizationPrompt(
  content: string,
  title: string,
  options: SummarizationOptions
): string {
  const lengthInstruction = {
    short: 'in 1-2 sentences',
    medium: 'in 2-4 sentences',
    long: 'in 1-2 paragraphs'
  }[options.length || 'medium']

  const keyPointsInstruction = options.includeKeyPoints
    ? ' Include the most important key points.'
    : ''

  return `Summarize the following note ${lengthInstruction}.${keyPointsInstruction}

Title: ${title}
Content: ${content}

Provide a clear, concise summary that captures the essence of the note:`
}

function createOCRPrompt(options: OCROptions = {}): string {
  const basePrompt = `Extract all text content from this image. Please:
1. Read all visible text accurately
2. Maintain the original structure and formatting where possible
3. Include any numbers, symbols, or special characters
4. Preserve line breaks and spacing when meaningful`

  if (options.includeStructure) {
    return basePrompt + `
5. Describe the text layout (headers, columns, lists, etc.)
6. Note any tables, forms, or structured content`
  }

  return basePrompt + `

Return only the extracted text content without any additional commentary or descriptions.`
}

async function summarizeContent(
  content: string,
  title: string,
  options: SummarizationOptions = {}
): Promise<string> {
  try {
    const cleanContent = stripHtmlTags(content)

    if (cleanContent.length < 50) {
      throw new Error('Content too short to summarize')
    }

    if (cleanContent.length > AI_CONFIG.SUMMARIZATION.MAX_INPUT_LENGTH) {
      throw new Error('Content too long for summarization')
    }

    const prompt = createSummarizationPrompt(cleanContent, title, options)

    const response = await genAI.models.generateContent({
      model: AI_CONFIG.MODEL,
      contents: prompt
    })

    const summary = response.text

    if (!summary || summary.trim().length === 0) {
      throw new Error('Empty response from AI service')
    }

    return summary.trim()
  } catch (error) {
    console.error('AI Summarization Error:', error)
    throw new Error(
      `Failed to generate summary: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

async function extractTextFromImage(
  imagePath: string,
  options: OCROptions = {}
): Promise<OCRResult> {
  try {
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      throw new Error('Image file does not exist')
    }

    // Check file size
    const stats = fs.statSync(imagePath)
    if (stats.size > AI_CONFIG.OCR.MAX_IMAGE_SIZE) {
      throw new Error('Image file too large for processing')
    }

    // Check file format
    const ext = path.extname(imagePath).toLowerCase().slice(1)
    if (!AI_CONFIG.OCR.SUPPORTED_FORMATS.includes(ext)) {
      throw new Error(`Unsupported image format: ${ext}`)
    }

    // Read image file
    const imageBuffer = fs.readFileSync(imagePath)
    const base64Image = imageBuffer.toString('base64')
    const mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`

    // Create OCR prompt
    const prompt = createOCRPrompt(options)

    // Call Gemini API with image
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

    if (!extractedText || extractedText.length < AI_CONFIG.OCR.MIN_TEXT_LENGTH) {
      return {
        success: false,
        error: 'No significant text found in image'
      }
    }

    return {
      success: true,
      text: extractedText,
      confidence: 0.95 // Gemini doesn't provide confidence scores, using high default
    }
  } catch (error) {
    console.error('OCR Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown OCR error'
    }
  }
}

async function extractTextFromBuffer(
  imageBuffer: Buffer,
  mimeType: string,
  options: OCROptions = {}
): Promise<OCRResult> {
  try {
    // Check buffer size
    if (imageBuffer.length > AI_CONFIG.OCR.MAX_IMAGE_SIZE) {
      throw new Error('Image buffer too large for processing')
    }

    // Convert buffer to base64
    const base64Image = imageBuffer.toString('base64')

    // Create OCR prompt
    const prompt = createOCRPrompt(options)

    // Call Gemini API with image
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

    if (!extractedText || extractedText.length < AI_CONFIG.OCR.MIN_TEXT_LENGTH) {
      return {
        success: false,
        error: 'No significant text found in image'
      }
    }

    return {
      success: true,
      text: extractedText,
      confidence: 0.95
    }
  } catch (error) {
    console.error('OCR Buffer Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown OCR error'
    }
  }
}

export function registerAIHandlers(): void {
  // Existing summarization handlers
  ipcMain.handle(
    'ai:summarize-note',
    async (_, content: string, title: string, options?: SummarizationOptions) => {
      try {
        const summary = await summarizeContent(content, title, options)
        return { success: true, summary }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      }
    }
  )

  ipcMain.handle(
    'ai:batch-summarize',
    async (
      _,
      notes: Array<{ id: string; content: string; title: string }>,
      options?: SummarizationOptions
    ) => {
      try {
        const results: Array<{ id: string; success: boolean; summary?: string; error?: string }> = []

        for (const note of notes) {
          try {
            const summary = await summarizeContent(note.content, note.title, options)
            results.push({ id: note.id, success: true, summary })
          } catch (error) {
            results.push({
              id: note.id,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }

          // Add small delay to respect rate limits
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }

        return { success: true, results }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Batch processing failed'
        }
      }
    }
  )

  // New OCR handlers
  ipcMain.handle(
    'ai:extract-text-from-image',
    async (_, imagePath: string, options?: OCROptions) => {
      return await extractTextFromImage(imagePath, options)
    }
  )

  ipcMain.handle(
    'ai:extract-text-from-buffer',
    async (_, imageBuffer: Buffer, mimeType: string, options?: OCROptions) => {
      return await extractTextFromBuffer(imageBuffer, mimeType, options)
    }
  )

  ipcMain.handle('ai:check-health', async () => {
    try {
      await genAI.models.generateContent({
        model: AI_CONFIG.MODEL,
        contents: 'Test'
      })
      return { success: true, status: 'healthy' }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Health check failed'
      }
    }
  })
}