// dependencies
import React from 'react'

// components
import { Divider } from '@/components/shared'

const ClipBoardHistory: React.FC = () => {
  return (
    <div className="w-full text-white">
      <p className="text-xs font-bold">Clipboard History</p>
      <Divider />
      <div className="w-full max-h-28 overflow-y-auto rounded-md border border-white/10 p-2">
        <div className="flex flex-col gap-y-2">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="w-full h-8 rounded-md flex-shrink-0 border border-white/20 flex flex-col justify-center px-2"
            >
              <p className="text-xs font-bold truncate">Clipboard {i + 1}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ClipBoardHistory
