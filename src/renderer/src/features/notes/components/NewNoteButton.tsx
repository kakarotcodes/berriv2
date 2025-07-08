// dependencies
import React from 'react'
import { PencilIcon } from '@heroicons/react/24/outline'

const NewNoteButton: React.FC = () => {
  return (
    <button className="bg-zinc-800 border-[0.5px] border-zinc-700 rounded-[8px] p-1.5 cursor-pointer">
      <PencilIcon className="h-5.5 w-5.5 text-white/50 stroke-1" />
    </button>
  )
}

export default NewNoteButton
