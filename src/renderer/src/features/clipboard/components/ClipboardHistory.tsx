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

      {/* Scrollable container - will only scroll its contents */}
      <div className="flex flex-col flex-1 min-h-0 overflow-y-auto rounded-md border border-zinc-600 p-2 mt-2">
        <ul className="space-y-2 text-sm">
          {history.map((entry) => (
            <ClipboardItem key={entry.id} content={entry.content} />
          ))}
        </ul>
      </div>
    </div>
  )
}

export default ClipboardHistory
