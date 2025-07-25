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

export interface AINotesGenerationResponse {
  success: boolean
  notes?: string
  error?: string
}

export interface AIOCRResponse {
  success: boolean
  text?: string
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

  async generateNotes(prompt: string): Promise<AINotesGenerationResponse> {
    try {
      const response = await window.electronAPI.aiAPI.generateNotes(prompt)
      return response
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate notes'
      }
    }
  }

  async extractText(imageData: string): Promise<AIOCRResponse> {
    try {
      const response = await window.electronAPI.aiAPI.extractText(imageData)
      return response
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to extract text'
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
