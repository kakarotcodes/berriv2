// dependencies
import React, { useEffect, useState } from 'react'

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
  const { notes, loadNotes, selectedNoteId, setSelectedNoteId, searchQuery } = useNotesStore()

  const [grouped, setGrouped] = useState<{ label: string; notes: Note[] }[]>([])

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
                  <div className="text-xs font-medium text-white/80">
                    {formatFullDateTime(note.updatedAt)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export default NotesList
