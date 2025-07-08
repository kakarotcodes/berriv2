// dependencies
import React, { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { createPortal } from 'react-dom'

// store & utils
import { useNotesStore } from '../store/notesStore'
import { groupNotesByDate } from '../utils/groupNotesByDate'
import { formatFullDateTime } from '../utils/formatting'
import { Note } from '../types/noteTypes'

// Helper: extract first word from HTML content
function getFirstWordFromHtml(html: string): string {
  if (!html) return 'Untitled'
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!text) return 'Untitled'
  return text.split(' ')[0] || 'Untitled'
}

const NotesList: React.FC = () => {
  const { notes, loadNotes, selectedNoteId, setSelectedNoteId, searchQuery, trashNote } =
    useNotesStore()

  const [grouped, setGrouped] = useState<{ label: string; notes: Note[] }[]>([])
  const [confirmId, setConfirmId] = useState<string | null>(null)

  // Load notes on mount
  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  // Update grouping when notes change
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase()
    const visible = q
      ? notes.filter((n) => {
          const title = n.title?.toLowerCase() || ''
          const contentText = typeof n.content === 'string' ? n.content.toLowerCase() : ''
          return title.includes(q) || contentText.includes(q)
        })
      : notes
    setGrouped(groupNotesByDate(visible))
  }, [notes, searchQuery])

  return (
    <div id="notes-list" className="flex-1 min-h-0 overflow-y-auto hide-scrollbar px-4 py-5">
      {grouped.map((section) => (
        <div key={section.label} className="mb-8 last:mb-0">
          <div className="text-xs uppercase tracking-wider text-white px-1">{section.label}</div>
          <div className="mt-4 flex flex-col">
            {section.notes.map((note, idx) => {
              let title = note.title?.trim()
              if (!title) {
                if (typeof note.content === 'string') {
                  title = getFirstWordFromHtml(note.content)
                } else if (Array.isArray(note.content) && note.content.length > 0) {
                  title = note.content[0].text.split(' ')[0] || 'Untitled'
                } else {
                  title = 'Untitled'
                }
              }

              const isSelected = note.id === selectedNoteId
              const isAboveSelected =
                idx < section.notes.length - 1 && section.notes[idx + 1].id === selectedNoteId
              const borderClass =
                isSelected || isAboveSelected ? 'border-b-0' : 'border-b border-white/20'

              return (
                <div
                  key={note.id}
                  onClick={() => setSelectedNoteId(note.id)}
                  className={`${borderClass} p-3 cursor-pointer flex-none ${
                    isSelected ? 'bg-black/50 rounded-[8px]' : ''
                  }`}
                >
                  <div className="font-bold truncate mb-1">{title}</div>
                  <div className="flex items-center justify-between text-xs font-medium text-white/80">
                    <span>{formatFullDateTime(note.updatedAt)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setConfirmId(note.id)
                      }}
                      title="Delete Note"
                      className="p-1 hover:text-amber-400 text-white/60 cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
      {confirmId &&
        createPortal(
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-zinc-800 rounded-lg w-80 p-6 text-center text-white">
              <div className="text-lg font-semibold mb-4">
                Are you sure you want to delete this note?
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setConfirmId(null)}
                  className="px-4 py-1 rounded bg-zinc-700 hover:bg-zinc-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    trashNote(confirmId)
                    setConfirmId(null)
                  }}
                  className="px-4 py-1 rounded bg-red-600 hover:bg-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}

export default NotesList
