import { ipcMain } from 'electron'
import { GoogleGenAI } from '@google/genai'
import { AI_CONFIG, type SummarizationOptions } from '../../../config/ai'

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

export function registerAIHandlers(): void {
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
        const results: Array<{ id: string; success: boolean; summary?: string; error?: string }> =
          []

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
