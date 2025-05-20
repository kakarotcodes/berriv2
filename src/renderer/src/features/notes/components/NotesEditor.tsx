import React, { useEffect, useRef, useState } from 'react'
import { useNotesStore } from '../store/notesStore'
import { Note, ChecklistItem } from '../types/noteTypes'
import { Plus, X } from 'lucide-react'

const NotesEditor: React.FC = () => {
  const { getSelectedNote, updateNote } = useNotesStore()
  const note = getSelectedNote()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState<string | ChecklistItem[]>('')

  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setContent(note.content)
    }
  }, [note?.id])

  const autoSave = (field: Partial<Note>) => {
    if (!note) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateNote(note.id, {
        ...field,
        updatedAt: new Date().toISOString()
      })
    }, 300)
  }

  const handleChecklistChange = (index: number, newText: string) => {
    if (typeof content === 'string') return
    const updated = [...content]
    updated[index].text = newText
    setContent(updated)
    autoSave({ content: updated })
  }

  const handleCheckboxToggle = (index: number) => {
    if (typeof content === 'string') return
    const updated = [...content]
    updated[index].checked = !updated[index].checked
    setContent(updated)
    autoSave({ content: updated })
  }

  const handleChecklistAdd = () => {
    if (typeof content === 'string') return
    const updated = [...content, { id: crypto.randomUUID(), text: '', checked: false }]
    setContent(updated)
    autoSave({ content: updated })
  }

  const handleChecklistRemove = (index: number) => {
    if (typeof content === 'string') return
    const updated = [...content]
    updated.splice(index, 1)
    setContent(updated)
    autoSave({ content: updated })
  }

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-400">No note selected</div>
    )
  }

  return (
    <div className="flex-1 h-full bg-[#121212] text-white p-6 flex flex-col gap-4">
      {/* Note type toggle */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-zinc-400">Note type:</span>
        <button
          onClick={() => {
            if (note.type === 'text') {
              const lines = (content as string).split('\n').filter((l) => l.trim() !== '')
              const checklist = lines.map((line) => ({
                id: crypto.randomUUID(),
                text: line,
                checked: false
              }))
              setContent(checklist)
              updateNote(note.id, {
                type: 'checklist',
                content: checklist,
                updatedAt: new Date().toISOString()
              })
            } else {
              const merged = (content as ChecklistItem[]).map((item) => item.text).join('\n')
              setContent(merged)
              updateNote(note.id, {
                type: 'text',
                content: merged,
                updatedAt: new Date().toISOString()
              })
            }
          }}
          className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-600"
        >
          {note.type === 'text' ? 'Switch to Checklist' : 'Switch to Plain Text'}
        </button>
      </div>

      {/* Title input */}
      <input
        value={title}
        onChange={(e) => {
          setTitle(e.target.value)
          autoSave({ title: e.target.value })
        }}
        placeholder="Title"
        className="bg-transparent text-2xl font-bold outline-none border-b border-zinc-700 pb-2"
      />

      {/* Body editor */}
      {note.type === 'text' && (
        <textarea
          className="flex-1 bg-gray-800 h-screen resize-none outline-none text-base leading-relaxed"
          placeholder="Start typing..."
          value={typeof content === 'string' ? content : ''}
          onChange={(e) => {
            setContent(e.target.value)
            autoSave({ content: e.target.value })
          }}
        />
      )}

      {note.type === 'checklist' && Array.isArray(content) && (
        <div className="flex flex-col gap-2">
          {content.map((item, index) => (
            <div key={item.id} className="flex items-center gap-2 group">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => handleCheckboxToggle(index)}
                className="w-5 h-5 rounded-full accent-yellow-500"
              />
              <input
                type="text"
                value={item.text}
                onChange={(e) => handleChecklistChange(index, e.target.value)}
                placeholder="List item"
                className={`bg-transparent flex-1 outline-none border-b border-zinc-700 py-1 ${
                  item.checked ? 'line-through text-zinc-500' : ''
                }`}
              />
              <button
                className="opacity-0 group-hover:opacity-100 transition"
                onClick={() => handleChecklistRemove(index)}
              >
                <X size={16} />
              </button>
            </div>
          ))}
          <button
            onClick={handleChecklistAdd}
            className="mt-2 text-sm text-yellow-400 hover:underline flex items-center gap-1"
          >
            <Plus size={16} />
            Add Item
          </button>
        </div>
      )}
    </div>
  )
}

export default NotesEditor
