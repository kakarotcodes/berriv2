import React, { useEffect, useRef, useState } from 'react'
import { useNotesStore } from '../store/notesStore'
import { Note } from '../types/noteTypes'

const NotesEditor: React.FC = () => {
  const { getSelectedNote, updateNote } = useNotesStore()
  const note = getSelectedNote()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize editor when note changes
  useEffect(() => {
    if (!note) return
    
    setTitle(note.title)
    setContent(typeof note.content === 'string' ? note.content : '')
  }, [note?.id])

  // Auto-resize textarea based on content
  useEffect(() => {
    if (!textareaRef.current) return
    
    // Reset height to get the correct scrollHeight
    textareaRef.current.style.height = 'auto'
    // Set new height based on scrollHeight
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
  }, [content])

  // Save changes with debounce
  const autoSave = (field: Partial<Note>) => {
    if (!note) return
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    debounceRef.current = setTimeout(() => {
      updateNote(note.id, {
        ...field,
        updatedAt: new Date().toISOString()
      })
    }, 500)
  }

  // Handle title changes
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    autoSave({ title: newTitle })
  }

  // Handle content changes
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)
    autoSave({ content: newContent })
  }

  // Show empty state if no note is selected
  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-400">
        No note selected
      </div>
    )
  }

  return (
    <div className="flex-1 bg-[#121212] text-white p-6 flex flex-col gap-4">
      {/* Title input */}
      <input
        value={title}
        onChange={handleTitleChange}
        placeholder="Title"
        className="bg-transparent text-2xl font-bold outline-none border-b border-zinc-700 pb-2"
      />

      {/* Content textarea */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleContentChange}
        placeholder="Start typing..."
        className="flex-1 bg-transparent resize-none outline-none text-base leading-relaxed min-h-[200px]"
      />
    </div>
  )
}

export default NotesEditor
