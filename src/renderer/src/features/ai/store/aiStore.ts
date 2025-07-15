import { create } from 'zustand'
import { aiApi, type AISummaryResponse } from '../../../api/ai'
import type { SummarizationOptions } from '../../../../../config/ai'

interface SummaryState {
  [noteId: string]: {
    summary: string
    isGenerating: boolean
    lastGenerated: Date
    error?: string
  }
}

interface AIStore {
  summaries: SummaryState
  isGeneratingSummary: (noteId: string) => boolean
  getSummary: (noteId: string) => string | undefined
  generateSummary: (
    noteId: string,
    content: string,
    title: string,
    options?: SummarizationOptions
  ) => Promise<string>
  clearSummary: (noteId: string) => void
  clearAllSummaries: () => void
  getSummaryError: (noteId: string) => string | undefined
}

export const useAIStore = create<AIStore>((set, get) => ({
  summaries: {},

  isGeneratingSummary: (noteId: string) => {
    return get().summaries[noteId]?.isGenerating || false
  },

  getSummary: (noteId: string) => {
    return get().summaries[noteId]?.summary
  },

  getSummaryError: (noteId: string) => {
    return get().summaries[noteId]?.error
  },

  generateSummary: async (
    noteId: string,
    content: string,
    title: string,
    options?: SummarizationOptions
  ) => {
    const { summaries } = get()

    // Set generating state
    set({
      summaries: {
        ...summaries,
        [noteId]: {
          ...summaries[noteId],
          isGenerating: true,
          error: undefined
        }
      }
    })

    try {
      const response: AISummaryResponse = await aiApi.summarizeNote(noteId, content, title, options)

      if (response.success && response.summary) {
        // Update with successful summary
        set({
          summaries: {
            ...get().summaries,
            [noteId]: {
              summary: response.summary,
              isGenerating: false,
              lastGenerated: new Date(),
              error: undefined
            }
          }
        })
        return response.summary
      } else {
        // Handle error response
        const errorMessage = response.error || 'Failed to generate summary'
        set({
          summaries: {
            ...get().summaries,
            [noteId]: {
              ...get().summaries[noteId],
              isGenerating: false,
              error: errorMessage
            }
          }
        })
        throw new Error(errorMessage)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

      // Update with error state
      set({
        summaries: {
          ...get().summaries,
          [noteId]: {
            ...get().summaries[noteId],
            isGenerating: false,
            error: errorMessage
          }
        }
      })

      throw error
    }
  },

  clearSummary: (noteId: string) => {
    const { summaries } = get()
    const newSummaries = { ...summaries }
    delete newSummaries[noteId]
    set({ summaries: newSummaries })
  },

  clearAllSummaries: () => {
    set({ summaries: {} })
  }
}))
