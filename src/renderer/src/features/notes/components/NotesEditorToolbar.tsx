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
  ImageIcon,
  Sparkles,
  FileOutput,
  FileDown
} from 'lucide-react'
import { useAIStore } from '../../ai/store/aiStore'

const NotesEditorToolbar: React.FC = () => {
  const { editor, getSelectedNote } = useNotesStore()
  const { generateSummary, isGeneratingSummary, getSummary } = useAIStore()
  const selectedNote = getSelectedNote()
  const [isExporting, setIsExporting] = React.useState<'pdf' | 'docx' | null>(null)

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

  const handleSummarize = async () => {
    if (!selectedNote) return

    try {
      const content =
        typeof selectedNote.content === 'string'
          ? selectedNote.content
          : JSON.stringify(selectedNote.content)
      await generateSummary(selectedNote.id, content, selectedNote.title, {
        length: 'medium',
        includeKeyPoints: true
      })
    } catch (error) {
      console.error('Failed to generate summary:', error)
    }
  }

  const handleExport = async (format: 'pdf' | 'docx') => {
    try {
      setIsExporting(format)

      if (!selectedNote) {
        alert('Please select a note to export')
        return
      }

      const result = format === 'pdf' 
        ? await window.electronAPI.notesAPI.exportPDF([selectedNote.id])
        : await window.electronAPI.notesAPI.exportDOCX([selectedNote.id])

      if (result.success) {
        alert(`Note exported successfully!`)
      } else {
        alert(`Export failed: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Export error:', error)
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsExporting(null)
    }
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
      <div className="w-px h-6 bg-zinc-600 mx-1"></div>
      <button
        onClick={handleSummarize}
        disabled={!selectedNote || isGeneratingSummary(selectedNote?.id || '')}
        className={`p-1 rounded hover:bg-zinc-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          getSummary(selectedNote?.id || '') ? 'text-green-400' : ''
        }`}
        title={getSummary(selectedNote?.id || '') ? 'Summary available' : 'Generate AI Summary'}
      >
        <Sparkles
          size={16}
          className={isGeneratingSummary(selectedNote?.id || '') ? 'animate-pulse' : ''}
        />
      </button>
      <button
        onClick={() => handleExport('pdf')}
        disabled={!selectedNote || isExporting !== null}
        className="p-1 rounded hover:bg-zinc-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-red-400"
        title="Export as PDF"
      >
        {isExporting === 'pdf' ? (
          <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <FileOutput size={16} />
        )}
      </button>
      <button
        onClick={() => handleExport('docx')}
        disabled={!selectedNote || isExporting !== null}
        className="p-1 rounded hover:bg-zinc-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-blue-400"
        title="Export as DOCX"
      >
        {isExporting === 'docx' ? (
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <FileDown size={16} />
        )}
      </button>
    </div>
  )
}

export default NotesEditorToolbar
