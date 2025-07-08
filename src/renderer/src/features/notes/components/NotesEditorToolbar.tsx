// dependencies
import React from 'react'
import { useNotesStore } from '../store/notesStore'
import {
  Bold,
  Italic,
  Code,
  Heading1,
  Heading2,
  Quote,
  List,
  CheckSquare,
  ImageIcon
} from 'lucide-react'

const NotesEditorToolbar: React.FC = () => {
  const { editor } = useNotesStore()

  if (!editor) return null

  const addImage = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file && editor) {
        try {
          const arrayBuffer = await file.arrayBuffer()
          const imagePath = await window.electronAPI.notesAPI.saveImage(file.name, arrayBuffer)
          if (imagePath) {
            editor.chain().focus().setImage({ src: imagePath }).run()
          }
        } catch (error) {
          console.error('[EDITOR] Image upload failed', error)
        }
      }
    }
    input.click()
  }

  return (
    <div className="inline-flex items-center w-max gap-1 p-1 bg-zinc-800 rounded-lg border border-zinc-700 overflow-x-auto whitespace-nowrap hide-scrollbar">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1 rounded hover:bg-zinc-600 transition-colors ${
          editor.isActive('bold') ? 'bg-zinc-600 text-yellow-400' : ''
        }`}
        title="Bold"
      >
        <Bold size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1 rounded hover:bg-zinc-600 transition-colors ${
          editor.isActive('italic') ? 'bg-zinc-600 text-yellow-400' : ''
        }`}
        title="Italic"
      >
        <Italic size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={`p-1 rounded hover:bg-zinc-600 transition-colors ${
          editor.isActive('code') ? 'bg-zinc-600 text-yellow-400' : ''
        }`}
        title="Code"
      >
        <Code size={16} />
      </button>
      <div className="w-px h-6 bg-zinc-600 mx-1"></div>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-1 rounded hover:bg-zinc-600 transition-colors ${
          editor.isActive('heading', { level: 1 }) ? 'bg-zinc-600 text-yellow-400' : ''
        }`}
        title="Heading 1"
      >
        <Heading1 size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-1 rounded hover:bg-zinc-600 transition-colors ${
          editor.isActive('heading', { level: 2 }) ? 'bg-zinc-600 text-yellow-400' : ''
        }`}
        title="Heading 2"
      >
        <Heading2 size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-1 rounded hover:bg-zinc-600 transition-colors ${
          editor.isActive('blockquote') ? 'bg-zinc-600 text-yellow-400' : ''
        }`}
        title="Quote"
      >
        <Quote size={16} />
      </button>
      <div className="w-px h-6 bg-zinc-600 mx-1"></div>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1 rounded hover:bg-zinc-600 transition-colors ${
          editor.isActive('bulletList') ? 'bg-zinc-600 text-yellow-400' : ''
        }`}
        title="Bullet List"
      >
        <List size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        className={`p-1 rounded hover:bg-zinc-600 transition-colors ${
          editor.isActive('taskList') ? 'bg-zinc-600 text-yellow-400' : ''
        }`}
        title="Task List"
      >
        <CheckSquare size={16} />
      </button>
      <div className="w-px h-6 bg-zinc-600 mx-1"></div>
      <button
        onClick={addImage}
        className="p-1 rounded hover:bg-zinc-600 transition-colors"
        title="Insert Image"
      >
        <ImageIcon size={16} />
      </button>
    </div>
  )
}

export default NotesEditorToolbar
