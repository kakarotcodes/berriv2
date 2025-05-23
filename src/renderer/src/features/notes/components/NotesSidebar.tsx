import React, { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { groupNotesByDate } from '../utils/groupNotesByDate'
import { useNotesStore } from '../store/notesStore'
import { formatDateLabel } from '../utils/formatting'
import { Note } from '../types/noteTypes'

const NotesSidebar: React.FC = () => {
  const {
    selectedNoteId,
    setSelectedNoteId,
    setNotes,
    trashed,
    restoreNote,
    permanentlyDeleteNote
  } = useNotesStore()
  const [groupedNotes, setGroupedNotes] = useState<{ label: string; notes: Note[] }[]>([])

  const refreshNotes = async () => {
    const raw = await window.electronAPI.notesAPI.getAllNotes()
    setNotes(raw)
    setGroupedNotes(groupNotesByDate(raw))
  }

  const handleAddNote = async () => {
    const now = new Date().toISOString()
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: '',
      type: 'text',
      content: '',
      createdAt: now,
      updatedAt: now
    }
    await window.electronAPI.notesAPI.insertNote(newNote)
    await refreshNotes()
    setSelectedNoteId(newNote.id)
  }

  useEffect(() => {
    refreshNotes()
  }, [])

  return (
    <aside className="w-72 animated-gradient text-white border-r border-zinc-800 flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-zinc-800">
        <h2 className="text-lg font-semibold">Notes</h2>
        <button onClick={handleAddNote} className="p-1 hover:bg-zinc-700 rounded" title="New Note">
          <Plus size={18} />
        </button>
      </div>

      {/* Grouped Notes */}
      <div className="flex-1 overflow-y-auto">
        {groupedNotes.map((section) => (
          <div key={section.label}>
            <div className="text-sm text-zinc-400 uppercase font-semibold px-4 pt-3 pb-1">
              {section.label}
            </div>
            {section.notes.map((note) => (
              <div
                key={note.id}
                onClick={() => setSelectedNoteId(note.id)}
                className={`px-4 py-3 cursor-pointer border-b border-zinc-800 ${
                  selectedNoteId === note.id ? 'bg-zinc-700' : 'hover:bg-zinc-800'
                }`}
              >
                <div className="font-medium truncate">
                  {note.title?.trim()
                    ? note.title
                    : typeof note.content === 'string'
                      ? note.content.split('\n')[0] || 'Untitled'
                      : Array.isArray(note.content) && note.content.length > 0
                        ? note.content[0].text
                        : 'Untitled'}
                </div>
                <div className="text-xs text-zinc-400">{formatDateLabel(note.updatedAt)}</div>
              </div>
            ))}
          </div>
        ))}

        {/* Trash header */}
        {trashed.length > 0 && (
          <>
            <div className="text-sm text-red-400 uppercase font-semibold px-4 pt-4 pb-1">Trash</div>
            {trashed.map((note) => (
              <div
                key={note.id}
                className="px-4 py-3 border-b border-zinc-800 bg-zinc-900 flex flex-col gap-1"
              >
                <div className="font-medium truncate">{note.title || 'Untitled'}</div>
                <div className="text-xs text-zinc-500">{formatDateLabel(note.updatedAt)}</div>
                <div className="flex gap-2 mt-1">
                  <button
                    className="text-green-400 text-xs hover:underline"
                    onClick={() => restoreNote(note.id)}
                  >
                    Restore
                  </button>
                  <button
                    className="text-red-500 text-xs hover:underline"
                    onClick={() => permanentlyDeleteNote(note.id)}
                  >
                    Delete Forever
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </aside>
  )
}

export default NotesSidebar
