import { clipboard } from 'electron'

// Type definition for clipboard history entry
interface ClipboardEntry {
  id: string
  content: string
  timestamp: number
}

// In-memory array to store clipboard history
const history: ClipboardEntry[] = []

// Track the last clipboard content to detect changes
let lastContent: string = ''

// Polling interval ID
let pollingIntervalId: NodeJS.Timeout | null = null

// Callback function type
type OnNewCallback = (entry: ClipboardEntry) => void

/**
 * Start polling the clipboard for changes
 * @param onNew Optional callback that's called when a new entry is added
 */
export function startClipboardPolling(onNew?: OnNewCallback): void {
  // Stop any existing polling
  if (pollingIntervalId) {
    clearInterval(pollingIntervalId)
  }

  // Initialize with current clipboard content
  lastContent = clipboard.readText()

  // Add initial clipboard content to history if it's not empty
  if (lastContent && lastContent.trim() !== '') {
    const initialEntry: ClipboardEntry = {
      id: Date.now().toString(),
      content: lastContent,
      timestamp: Date.now()
    }

    history.unshift(initialEntry)

    if (onNew) {
      onNew(initialEntry)
    }
  }

  // Start polling
  pollingIntervalId = setInterval(() => {
    const currentContent = clipboard.readText()

    // Check if content changed and is not empty
    if (currentContent !== lastContent && currentContent.trim() !== '') {
      // Create new entry
      const newEntry: ClipboardEntry = {
        id: Date.now().toString(),
        content: currentContent,
        timestamp: Date.now()
      }

      // Add to the beginning of history
      history.unshift(newEntry)

      // Update last content
      lastContent = currentContent

      // Call the callback if provided
      if (onNew) {
        onNew(newEntry)
      }
    }
  }, 1000)
}

/**
 * Stop clipboard polling
 */
export function stopClipboardPolling(): void {
  if (pollingIntervalId) {
    clearInterval(pollingIntervalId)
    pollingIntervalId = null
  }
}

/**
 * Get a copy of the clipboard history
 * @returns A copy of the clipboard history array
 */
export function getClipboardHistory(): ClipboardEntry[] {
  return [...history]
}
