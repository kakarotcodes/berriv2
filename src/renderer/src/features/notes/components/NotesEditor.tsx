import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Image from '@tiptap/extension-image'
import BulletList from '@tiptap/extension-bullet-list'
import ListItem from '@tiptap/extension-list-item'

import { useNotesStore } from '../store/notesStore'
import NoteSummary from './NoteSummary'

const NotesEditor: React.FC = () => {
  const { getSelectedNote, setEditor } = useNotesStore()
  const note = getSelectedNote()
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const skipNextUpdateRef = useRef(false)
  const lastNoteIdRef = useRef<string | null>(null)
  const isLoadingNoteRef = useRef(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false, // We'll use our custom one
        listItem: false // We'll use our custom one
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: 'bullet-list'
        }
      }),
      ListItem,
      TaskList.configure({
        HTMLAttributes: {
          class: 'task-list'
        }
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'task-item'
        }
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'editor-image'
        }
      })
    ],
    content: note?.content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[400px] p-4'
      }
    },
    onUpdate: ({ editor }) => {
      if (skipNextUpdateRef.current) {
        skipNextUpdateRef.current = false
        return
      }

      const html = editor.getHTML()
      setContent(html)
      autoSave({ content: html })
    }
  })

  const autoSave = useCallback(
    (field: { content?: string; title?: string }) => {
      if (!note) return
      if (isLoadingNoteRef.current) return

      clearTimeout(debounceRef.current || undefined)
      debounceRef.current = setTimeout(async () => {
        try {
          const { updateNote } = useNotesStore.getState()
          await updateNote(note.id, field)
          console.log('[EDITOR] Auto-saved field:', field)
        } catch (error) {
          console.error('[EDITOR] Auto-save failed:', error)
        }
      }, 300)
    },
    [note]
  )

  const handleSave = useCallback(() => {
    if (note) {
      autoSave({
        content: content,
        title: title
      })
    }
  }, [note, content, title, autoSave])

  useEffect(() => {
    if (note?.id && editor) {
      const noteChanged = lastNoteIdRef.current !== note.id
      lastNoteIdRef.current = note.id

      if (noteChanged) {
        isLoadingNoteRef.current = true
      }

      setTitle(note.title || '')

      const noteContent = typeof note.content === 'string' ? note.content : ''
      if (editor.getHTML() !== noteContent) {
        skipNextUpdateRef.current = true
        editor.commands.setContent(noteContent)
      }

      setContent(noteContent)

      if (noteChanged) {
        setTimeout(() => {
          isLoadingNoteRef.current = false
        }, 100)
      }
    }
  }, [note?.id, note?.title, note?.content, editor])

  // Auto-save effect
  useEffect(() => {
    if (note) {
      if (isLoadingNoteRef.current) return

      const timer = setTimeout(() => {
        const noteContent = typeof note.content === 'string' ? note.content : ''
        if (content !== noteContent && content.trim() !== '') {
          handleSave()
        }
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [content, note?.content, handleSave, note])

  // Title change effect
  useEffect(() => {
    if (note) {
      if (isLoadingNoteRef.current) return

      if (title !== note.title && title.trim() !== '') {
        handleSave()
      }
    }
  }, [title, note?.title, handleSave, note])

  const addImage = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file && editor) {
        try {
          console.log('[EDITOR] Processing image file:', {
            name: file.name,
            size: file.size,
            type: file.type
          })

          // Convert file to ArrayBuffer for IPC transfer
          const arrayBuffer = await file.arrayBuffer()

          // Save the image file and get the path
          const imagePath = await window.electronAPI.notesAPI.saveImage(file.name, arrayBuffer)

          if (imagePath) {
            console.log('[EDITOR] Image saved to:', imagePath)
            // Use the file path instead of base64
            editor.chain().focus().setImage({ src: imagePath }).run()
          } else {
            console.error('[EDITOR] Failed to save image')
            alert('Failed to save image. Please try again.')
          }
        } catch (error) {
          console.error('[EDITOR] Error processing image:', error)
          alert('Error processing image. Please try again.')
        }
      }
    }

    // Also offer URL option
    const choice = window.confirm('Upload image file? (Cancel for URL)')
    if (choice) {
      input.click()
    } else {
      const url = window.prompt('Enter image URL:')
      if (url && editor) {
        console.log('[EDITOR] Adding image from URL:', url)
        editor.chain().focus().setImage({ src: url }).run()
      }
    }
  }

  // expose editor to global store
  useEffect(() => {
    setEditor(editor)
    return () => setEditor(null)
  }, [editor, setEditor])

  if (!note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 p-8">
        <div className="text-lg font-medium mb-4">No note selected</div>
        <div className="text-center max-w-md">
          <div className="text-sm mb-2">Create a new note or select an existing one to start editing</div>
          <div className="flex items-center justify-center gap-2 text-xs bg-zinc-800/50 px-3 py-2 rounded-lg border border-zinc-700">
            <span>Pro tip: Press</span>
            <kbd className="px-2 py-1 bg-zinc-700 text-zinc-200 rounded text-xs font-mono">⌘+Shift+G</kbd>
            <span>for AI notes generation</span>
          </div>
        </div>
      </div>
    )
  }

  if (!editor) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-400">Loading editor...</div>
    )
  }

  return (
    <div className="flex-1 h-full  text-white flex flex-col">
      {/* Title input */}
      <div className="p-6 pb-0">
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            autoSave({ title: e.target.value })
          }}
          placeholder="Note title..."
          className="w-full bg-transparent text-2xl font-bold outline-none border-b border-zinc-700 pb-2 placeholder-zinc-500"
        />
      </div>

      {/* AI Summary */}
      <div className="px-6">
        <NoteSummary noteId={note.id} />
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        <EditorContent editor={editor} className="h-full text-white" />
      </div>

      {/* Custom styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .ProseMirror {
            outline: none;
            color: white;
            min-height: 500px;
            padding-bottom: 200px;
            caret-color: white;
          }

          .ProseMirror:after {
            content: '';
            display: block;
            height: 150px;
            width: 100%;
            pointer-events: auto;
          }

          .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 {
            color: #fbbf24;
            margin-top: 1.5rem;
            margin-bottom: 0.5rem;
          }

          .ProseMirror h1 {
            font-size: 1.875rem;
            font-weight: bold;
          }

          .ProseMirror h2 {
            font-size: 1.5rem;
            font-weight: bold;
          }

          .ProseMirror h3 {
            font-size: 1.25rem;
            font-weight: bold;
          }

          .ProseMirror blockquote {
            border-left: 3px solid #fbbf24;
            padding-left: 1rem;
            margin-left: 0;
            font-style: italic;
            color: #d1d5db;
          }

          .ProseMirror code {
            background-color: #374151;
            padding: 0.125rem 0.375rem;
            border-radius: 0.25rem;
            font-family: 'Courier New', monospace;
            color: #fbbf24;
          }

          .ProseMirror .bullet-list {
            list-style-type: disc;
            padding-left: 1.5rem;
          }

          .ProseMirror .task-list {
            list-style: none;
            padding-left: 0;
          }

          .ProseMirror .task-item {
            display: flex;
            align-items: flex-start;
            margin: 0.25rem 0;
          }

          .ProseMirror .task-item > label {
            margin-right: 0.5rem;
            user-select: none;
          }

          .ProseMirror .task-item > div {
            flex: 1;
          }

          .ProseMirror .task-item[data-checked="true"] > div {
            text-decoration: line-through;
            color: #9ca3af;
          }

          .ProseMirror .task-item[data-checked="true"] > div p {
            text-decoration: line-through;
            color: #9ca3af;
          }

          .ProseMirror .editor-image {
            max-width: 100%;
            height: auto;
            border-radius: 0.375rem;
            margin: 1rem 0;
          }

          .ProseMirror p {
            margin: 0.75rem 0;
          }

          .ProseMirror p:first-child {
            margin-top: 0;
          }

          .ProseMirror p:last-child {
            margin-bottom: 0;
          }

          .ProseMirror ul, .ProseMirror ol {
            margin: 0.75rem 0;
          }

          .ProseMirror li {
            margin: 0.25rem 0;
          }
        `
        }}
      />
    </div>
  )
}

export default NotesEditor
