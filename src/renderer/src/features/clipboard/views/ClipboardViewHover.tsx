// dependencies
import React, { useState } from 'react'

// components
import { ClipboardHistory } from '../components'
import { Searchbar } from '@/components/shared'

const ClipBoardHoverView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('')

  return (
    <div className="h-full w-full overflow-hidden">
      <div className="h-14 bg-black/40 px-4 flex items-center">
        <Searchbar
          placeholder="Search clipboard"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <p className="absolute m-auto left-0 right-0 text-center font-bold">Clipboard History</p>
      </div>
      <ClipboardHistory />
    </div>
  )
}

export default ClipBoardHoverView
