import React, { useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Image from '@tiptap/extension-image'
import BulletList from '@tiptap/extension-bullet-list'
import ListItem from '@tiptap/extension-list-item'

import { useNotesStore } from '../store/notesStore'
import {
  Bold,
  Italic,
  List,
  CheckSquare,
  ImageIcon,
  Heading1,
  Heading2,
  Quote,
  Code
} from 'lucide-react'

const NotesEditor: React.FC = () => {
  const { getSelectedNote, updateNote } = useNotesStore()
  const note = getSelectedNote()
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const [title, setTitle] = useState('')

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
      const content = editor.getHTML()
      autoSave({ content })
    }
  })

  const autoSave = (field: { content?: string; title?: string }) => {
    if (!note) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      console.log('[EDITOR] Auto-saving:', {
        noteId: note.id,
        field,
        contentLength: field.content?.length || 0,
        hasImage: field.content?.includes('<img') || false
      })
      updateNote(note.id, {
        ...field,
        updatedAt: new Date().toISOString()
      })
    }, 300)
  }

  useEffect(() => {
    if (note && editor) {
      // Update editor content when note changes
      const currentContent = editor.getHTML()
      const noteContent = typeof note.content === 'string' ? note.content : ''

      console.log('[EDITOR] Loading note content:', {
        noteId: note.id,
        noteType: note.type,
        currentContentLength: currentContent.length,
        noteContentLength: noteContent.length,
        currentHasImage: currentContent.includes('<img'),
        noteHasImage: noteContent.includes('<img'),
        contentPreview: noteContent.substring(0, 200) + (noteContent.length > 200 ? '...' : '')
      })

      if (currentContent !== noteContent) {
        console.log('[EDITOR] Setting new content')
        editor.commands.setContent(noteContent)
      } else {
        console.log('[EDITOR] Content unchanged, skipping setContent')
      }
    }
  }, [note?.id, editor])

  // Sync title when note changes
  useEffect(() => {
    if (note) {
      setTitle(note.title || '')
    }
  }, [note?.id])

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

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-400">No note selected</div>
    )
  }

  if (!editor) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-400">Loading editor...</div>
    )
  }

  return (
    <div className="flex-1 h-full animated-gradient text-white flex flex-col">
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

      {/* Toolbar */}
      <div className="p-6 pb-2">
        <div className="flex flex-wrap gap-1 p-2 bg-zinc-800 rounded-lg border border-zinc-700">
          {/* Text formatting */}
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-zinc-600 transition-colors ${
              editor.isActive('bold') ? 'bg-zinc-600 text-yellow-400' : ''
            }`}
            title="Bold"
          >
            <Bold size={16} />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-zinc-600 transition-colors ${
              editor.isActive('italic') ? 'bg-zinc-600 text-yellow-400' : ''
            }`}
            title="Italic"
          >
            <Italic size={16} />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-2 rounded hover:bg-zinc-600 transition-colors ${
              editor.isActive('code') ? 'bg-zinc-600 text-yellow-400' : ''
            }`}
            title="Code"
          >
            <Code size={16} />
          </button>

          <div className="w-px h-6 bg-zinc-600 mx-1"></div>

          {/* Headings */}
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-2 rounded hover:bg-zinc-600 transition-colors ${
              editor.isActive('heading', { level: 1 }) ? 'bg-zinc-600 text-yellow-400' : ''
            }`}
            title="Heading 1"
          >
            <Heading1 size={16} />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded hover:bg-zinc-600 transition-colors ${
              editor.isActive('heading', { level: 2 }) ? 'bg-zinc-600 text-yellow-400' : ''
            }`}
            title="Heading 2"
          >
            <Heading2 size={16} />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded hover:bg-zinc-600 transition-colors ${
              editor.isActive('blockquote') ? 'bg-zinc-600 text-yellow-400' : ''
            }`}
            title="Quote"
          >
            <Quote size={16} />
          </button>

          <div className="w-px h-6 bg-zinc-600 mx-1"></div>

          {/* Lists */}
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-zinc-600 transition-colors ${
              editor.isActive('bulletList') ? 'bg-zinc-600 text-yellow-400' : ''
            }`}
            title="Bullet List"
          >
            <List size={16} />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={`p-2 rounded hover:bg-zinc-600 transition-colors ${
              editor.isActive('taskList') ? 'bg-zinc-600 text-yellow-400' : ''
            }`}
            title="Task List"
          >
            <CheckSquare size={16} />
          </button>

          <div className="w-px h-6 bg-zinc-600 mx-1"></div>

          {/* Image */}
          <button
            onClick={addImage}
            className="p-2 rounded hover:bg-zinc-600 transition-colors"
            title="Insert Image"
          >
            <ImageIcon size={16} />
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
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
