// dependencies
import React from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

const NotesSearchbar: React.FC = () => {
  return (
    <div className="w-40 flex items-center gap-x-2 border-[0.5px] border-white/50 rounded-[8px] p-2">
      <MagnifyingGlassIcon className="h-4 w-4 text-white/50" />
      <input
        type="text"
        placeholder="Search"
        className="w-full bg-transparent outline-none text-white/50 text-xs font-semibold placeholder:text-white/50"
      />
    </div>
  )
}

export default NotesSearchbar
