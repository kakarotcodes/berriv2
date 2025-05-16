// dependencies
import React from 'react'

// components
import { Divider } from '@/components/shared'

const ClipboardHistory: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col text-white overflow-hidden">
      {/* Fixed header */}
      <div className="flex-shrink-0">
        <p className="text-xs font-bold">Clipboard History</p>
        <Divider />
      </div>

      {/* Scrollable container - will only scroll its contents */}
      <div className="flex flex-col flex-1 min-h-0 overflow-y-auto rounded-md border border-white/10 p-2 mt-2">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="w-full h-8 rounded-md border border-white/20 flex items-center px-2 flex-shrink-0 mb-2 last:mb-0"
          >
            <p className="text-xs font-bold truncate">Clipboard {i + 1}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ClipboardHistory
