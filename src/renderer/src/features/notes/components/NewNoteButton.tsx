// dependencies
import React from 'react'
import { PencilIcon } from '@heroicons/react/24/outline'
import { useNotesStore } from '../store/notesStore'

function createEmptyNote() {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    title: '',
    type: 'richtext' as const,
    content: '',
    createdAt: now,
    updatedAt: now,
    trashed: false
  }
}

const NewNoteButton: React.FC = () => {
  const { addNote, setSelectedNoteId } = useNotesStore()

  const handleClick = async () => {
    const note = createEmptyNote()
    await addNote(note)
    setSelectedNoteId(note.id)
  }

  return (
    <button
      onClick={handleClick}
      title="New Note"
      className="bg-zinc-800 border-[0.5px] border-zinc-700 rounded-[8px] p-1.5 cursor-pointer hover:bg-zinc-700"
    >
      <PencilIcon className="h-5.5 w-5.5 text-white/50 stroke-1" />
    </button>
  )
}

export default NewNoteButton
