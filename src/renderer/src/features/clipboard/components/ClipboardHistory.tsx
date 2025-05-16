// dependencies
import React from 'react'

// components
import { Divider } from '@/components/shared'

const ClipboardHistory: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col text-white">
      <p className="text-xs font-bold">Clipboard History</p>
      <Divider />

      {/* Scrollable container */}
      <div className="flex flex-col flex-1 min-h-0 overflow-y-auto rounded-md border border-white/10 p-2">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="w-full h-8 rounded-md border border-white/20 flex items-center px-2 flex-shrink-0"
          >
            <p className="text-xs font-bold truncate">Clipboard {i + 1}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ClipboardHistory
