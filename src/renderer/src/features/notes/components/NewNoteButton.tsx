// dependencies
import React from 'react'
import { PencilIcon } from '@heroicons/react/24/outline'

const NewNoteButton: React.FC = () => {
  return (
    <button className="border-[0.5px] border-white/50 rounded-[8px] p-1 cursor-pointer">
      <PencilIcon className="h-6 w-6 text-white/50 stroke-1" />
    </button>
  )
}

export default NewNoteButton
