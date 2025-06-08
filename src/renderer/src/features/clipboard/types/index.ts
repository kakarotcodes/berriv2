export interface ClipboardEntry {
  id: string
  content: string
  timestamp: string
}

export interface ClipboardState {
  history: ClipboardEntry[]
  isLoading: boolean
  error: string | null
} 