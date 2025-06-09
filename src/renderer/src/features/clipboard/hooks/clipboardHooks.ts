import { useEffect, useState } from 'react'

type ClipboardEntry = {
  id: string
  content: string
  timestamp: number
}

export const useClipboardHistory = () => {
  const [history, setHistory] = useState<ClipboardEntry[]>([])

  useEffect(() => {
    // Initial load of clipboard history
    window.electronAPI.clipboard.getHistory().then(setHistory)

    // Subscribe to real-time updates
    const unsubscribe = window.electronAPI.clipboard.onUpdate((newEntry) => {
      setHistory((prevHistory) => [newEntry, ...prevHistory])
    })

    // Clean up subscription on unmount
    return unsubscribe
  }, [])

  return history
}
