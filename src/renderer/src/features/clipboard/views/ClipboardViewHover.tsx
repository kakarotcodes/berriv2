// dependencies
import React, { useState } from 'react'

// components
import { ClipboardHistory } from '../components'
import { Searchbar } from '@/components/shared'

const ClipBoardHoverView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('')

  return (
    <div className="h-full w-full overflow-hidden">
      <div className="h-14 bg-black/40 px-4 flex items-center gap-x-10">
        <p className="text-center font-bold">Clipboard History</p>
        <Searchbar
          placeholder="Search clipboard"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <ClipboardHistory />
    </div>
  )
}

export default ClipBoardHoverView
