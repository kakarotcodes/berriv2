import { withErrorHandling, ApiResponse } from './base'

// Re-export the ClipboardEntry type from the global env types
export type ClipboardEntry = {
  id: string
  content: string
  timestamp: number
}

/**
 * Get clipboard history
 */
export async function getHistory(): Promise<ApiResponse<ClipboardEntry[]>> {
  return withErrorHandling(async () => {
    return window.electronAPI.clipboard.getHistory()
  })
}

/**
 * Listen to clipboard updates
 */
export function onUpdate(callback: (entry: ClipboardEntry) => void): () => void {
  return window.electronAPI.clipboard.onUpdate((entry: unknown) => {
    callback(entry as ClipboardEntry)
  })
}

// Namespace object for organized access
export const clipboardAPI = {
  getHistory,
  onUpdate
} as const
