// Import types only since we use window.electronAPI for IPC calls
import type { SummarizationOptions } from '../../../config/ai'

export interface AISummaryResponse {
  success: boolean
  summary?: string
  error?: string
}

export interface AIBatchSummaryResponse {
  success: boolean
  results?: Array<{
    id: string
    success: boolean
    summary?: string
    error?: string
  }>
  error?: string
}

export interface AIHealthResponse {
  success: boolean
  status?: string
  error?: string
}

class AIApi {
  async summarizeNote(
    noteId: string,
    content: string,
    title: string,
    options?: SummarizationOptions
  ): Promise<AISummaryResponse> {
    try {
      // noteId parameter is kept for compatibility but not needed for API call
      const response = await window.electronAPI.aiAPI.summarizeNote(content, title, options)
      return response
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to summarize note'
      }
    }
  }

  async batchSummarize(
    notes: Array<{ id: string; content: string; title: string }>,
    options?: SummarizationOptions
  ): Promise<AIBatchSummaryResponse> {
    try {
      const response = await window.electronAPI.aiAPI.batchSummarize(notes, options)
      return response
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to batch summarize'
      }
    }
  }

  async checkHealth(): Promise<AIHealthResponse> {
    try {
      const response = await window.electronAPI.aiAPI.checkHealth()
      return response
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Health check failed'
      }
    }
  }
}

export const aiApi = new AIApi()
