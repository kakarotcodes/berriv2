// dependencies
import React from 'react'

// components
import ClipboardItem from './ClipboardItem'
import { Divider } from '@/components/shared'

// hooks
import { useClipboardHistory } from '../hooks/clipboardHooks'

const ClipboardHistory: React.FC = () => {
  const history = useClipboardHistory()

  return (
    <div className="w-full h-full flex flex-col text-white overflow-hidden">
      {/* Fixed header */}
      <div className="flex-shrink-0">
        <p className="text-xs font-bold">Clipboard History</p>
        <Divider />
      </div>

      {/* Scrollable container with custom scrollbar styles */}
      <div className="flex flex-col flex-1 min-h-0 overflow-y-auto rounded-md border border-zinc-600 p-2 mt-2 dark-scrollbar">
        <ul className="space-y-2 text-sm w-full">
          {history.length > 0 ? (
            history.map((entry) => (
              <ClipboardItem key={entry.id} content={entry.content} timestamp={entry.timestamp} />
            ))
          ) : (
            <li className="text-center text-zinc-400 py-4">No clipboard history yet</li>
          )}
        </ul>
      </div>
    </div>
  )
}

export default ClipboardHistory
