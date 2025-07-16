// dependencies
import React from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

type SearchbarProps = {
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const NotesSearchbar: React.FC<SearchbarProps> = ({ value, placeholder, onChange }) => {
  return (
    <div className="bg-zinc-800 w-40 flex items-center gap-x-2 border-[0.5px] border-zinc-700 rounded-[8px] p-2">
      <MagnifyingGlassIcon className="h-4 w-4 text-white/50" />
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        className="w-full bg-transparent outline-none text-white/100 text-xs font-semibold placeholder:text-white/50"
      />
    </div>
  )
}

export default NotesSearchbar
