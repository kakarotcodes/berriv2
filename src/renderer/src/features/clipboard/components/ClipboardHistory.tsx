// dependencies
import React, { useMemo } from 'react'

// components
import ClipboardItem from './ClipboardItem'

// hooks
import { useClipboardHistory } from '../hooks/clipboardHooks'

interface ClipboardHistoryProps {
  searchTerm?: string
}

const ClipboardHistory: React.FC<ClipboardHistoryProps> = ({ searchTerm = '' }) => {
  const history = useClipboardHistory()

  // Filter history based on search term
  const filteredHistory = useMemo(() => {
    if (!searchTerm.trim()) {
      return history
    }
    return history.filter((entry) => entry.content.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [history, searchTerm])

  return (
    <div className="w-full h-full flex flex-col text-white overflow-hidden p-4">
      <p className="w-full text-xs italic text-white/60">
        Click anywhere on a card to copy its content. Hover on a card to expand it
      </p>
      <div className="w-full h-1" />

      {/* Scrollable container with custom scrollbar styles */}
      <div className="flex flex-col flex-1 min-h-0 overflow-y-auto rounded-md mt-2 hide-scrollbar">
        <ul className="space-y-2 text-sm w-full">
          {filteredHistory.length > 0 ? (
            filteredHistory.map((entry) => (
              <ClipboardItem key={entry.id} content={entry.content} timestamp={entry.timestamp} />
            ))
          ) : searchTerm.trim() ? (
            <li className="text-center text-zinc-400 py-4">No results found for {searchTerm}</li>
          ) : (
            <li className="text-center text-zinc-400 py-4">No clipboard history yet</li>
          )}
        </ul>
      </div>
    </div>
  )
}

export default ClipboardHistory
