import React, { useState, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { useModalStore } from '../../../globalStore/useModalStore'
import {
  XMarkIcon,
  ArrowsPointingOutIcon,
  PaperClipIcon,
  FaceSmileIcon,
  PaintBrushIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link,
  ListOrdered,
  List,
  Palette
} from 'lucide-react'

interface ComposeModalProps {
  replyTo?: {
    messageId: string
    subject: string
    sender: string
  }
  forward?: {
    messageId: string
    subject: string
    body: string
  }
}

const ComposeModal: React.FC<ComposeModalProps> = ({ replyTo, forward }) => {
  const { closeModal } = useModalStore()
  const [isExpanded, setIsExpanded] = useState(false)
  const [showCc, setShowCc] = useState(false)
  const [showBcc, setShowBcc] = useState(false)

  // Form fields
  const [to, setTo] = useState('')
  const [cc, setCc] = useState('')
  const [bcc, setBcc] = useState('')
  const [subject, setSubject] = useState('')
  const [isSending, setIsSending] = useState(false)

  // Rich text editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph']
      })
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-3 text-white prose-invert'
      }
    }
  })

  // Initialize form for reply/forward
  useEffect(() => {
    if (replyTo) {
      setTo(replyTo.sender)
      setSubject(replyTo.subject.startsWith('Re: ') ? replyTo.subject : `Re: ${replyTo.subject}`)
    } else if (forward) {
      setSubject(forward.subject.startsWith('Fwd: ') ? forward.subject : `Fwd: ${forward.subject}`)
      if (editor) {
        editor.commands.setContent(`
          <br><br>
          ---------- Forwarded message ---------<br>
          ${forward.body}
        `)
      }
    }
  }, [replyTo, forward, editor])

  const handleSend = async () => {
    if (!to.trim() || !editor) {
      alert('Please enter recipient and message content')
      return
    }

    setIsSending(true)
    try {
      const emailData = {
        to: to.split(',').map((email) => email.trim()),
        cc: cc
          .split(',')
          .map((email) => email.trim())
          .filter(Boolean),
        bcc: bcc
          .split(',')
          .map((email) => email.trim())
          .filter(Boolean),
        subject: subject || '(no subject)',
        body: editor.getHTML(),
        ...(replyTo ? { replyToMessageId: replyTo.messageId } : {})
      }

      console.log('Sending email:', emailData)

      const result = await window.electronAPI.gmail.sendEmail(emailData)

      if (result.success) {
        closeModal()
        alert('Email sent successfully!') // Replace with toast
      } else {
        throw new Error(result.error || 'Failed to send email')
      }
    } catch (error) {
      console.error('Failed to send email:', error)
      alert(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSending(false)
    }
  }

  const handleClose = () => {
    if (confirm('Discard this message?')) {
      closeModal()
    }
  }

  return (
    <div
      className={`${isExpanded ? 'w-[95vw] h-[95vh]' : 'w-[85vw] h-[80vh]'} bg-zinc-900 shadow-2xl rounded-lg border border-zinc-700 flex flex-col relative`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-t-lg border-b border-zinc-700">
        <h3 className="text-lg font-medium text-white">
          {replyTo ? 'Reply' : forward ? 'Forward' : 'New Message'}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-zinc-700 rounded"
            title={isExpanded ? 'Default view' : 'Full screen'}
          >
            <ArrowsPointingOutIcon className="w-4 h-4 text-gray-400" />
          </button>
          <button onClick={handleClose} className="p-1 hover:bg-zinc-700 rounded" title="Close">
            <XMarkIcon className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Email Fields */}
      <div className="p-4 space-y-3 border-b border-zinc-700">
        {/* To Field */}
        <div className="flex items-center gap-2">
          <input
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="To"
            className="flex-1 px-2 py-1 border-0 border-b border-zinc-600 focus:border-blue-400 focus:outline-none text-sm bg-transparent text-white placeholder-gray-400"
            multiple
          />
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setShowCc(!showCc)}
              className={`px-2 py-1 rounded hover:bg-zinc-700 ${showCc ? 'text-blue-400' : 'text-gray-400'}`}
            >
              Cc
            </button>
            <button
              onClick={() => setShowBcc(!showBcc)}
              className={`px-2 py-1 rounded hover:bg-zinc-700 ${showBcc ? 'text-blue-400' : 'text-gray-400'}`}
            >
              Bcc
            </button>
          </div>
        </div>

        {/* CC Field */}
        {showCc && (
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-300 w-8">Cc</label>
            <input
              type="email"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              placeholder="Carbon copy recipients"
              className="flex-1 px-2 py-1 border-0 border-b border-zinc-600 focus:border-blue-400 focus:outline-none text-sm bg-transparent text-white placeholder-gray-400"
              multiple
            />
          </div>
        )}

        {/* BCC Field */}
        {showBcc && (
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-300 w-8">Bcc</label>
            <input
              type="email"
              value={bcc}
              onChange={(e) => setBcc(e.target.value)}
              placeholder="Blind carbon copy recipients"
              className="flex-1 px-2 py-1 border-0 border-b border-zinc-600 focus:border-blue-400 focus:outline-none text-sm bg-transparent text-white placeholder-gray-400"
              multiple
            />
          </div>
        )}

        {/* Subject Field */}
        <div className="flex items-center">
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="w-full px-2 py-1 border-0 border-b border-zinc-600 focus:border-blue-400 focus:outline-none text-sm bg-transparent text-white placeholder-gray-400"
          />
        </div>
      </div>

      {/* Formatting Toolbar */}
      {editor && (
        <div className="flex items-center gap-1 p-2 border-b border-zinc-700 bg-zinc-800">
          <div className="flex items-center gap-1">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-1.5 rounded hover:bg-zinc-700 text-gray-300 ${editor.isActive('bold') ? 'bg-zinc-600 text-yellow-400' : ''}`}
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-1.5 rounded hover:bg-zinc-700 text-gray-300 ${editor.isActive('italic') ? 'bg-zinc-600 text-yellow-400' : ''}`}
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`p-1.5 rounded hover:bg-zinc-700 text-gray-300 ${editor.isActive('underline') ? 'bg-zinc-600 text-yellow-400' : ''}`}
              title="Underline"
            >
              <UnderlineIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-5 bg-zinc-600 mx-1" />

          <div className="flex items-center gap-1">
            <button
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              className="p-1.5 rounded hover:bg-zinc-700 text-gray-300"
              title="Align left"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              className="p-1.5 rounded hover:bg-zinc-700 text-gray-300"
              title="Align center"
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              className="p-1.5 rounded hover:bg-zinc-700 text-gray-300"
              title="Align right"
            >
              <AlignRight className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-5 bg-zinc-600 mx-1" />

          <div className="flex items-center gap-1">
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-1.5 rounded hover:bg-zinc-700 text-gray-300 ${editor.isActive('bulletList') ? 'bg-zinc-600 text-yellow-400' : ''}`}
              title="Bullet list"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-1.5 rounded hover:bg-zinc-700 text-gray-300 ${editor.isActive('orderedList') ? 'bg-zinc-600 text-yellow-400' : ''}`}
              title="Numbered list"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-5 bg-zinc-600 mx-1" />

          <button className="p-1.5 rounded hover:bg-zinc-700 text-gray-300" title="Insert link">
            <Link className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded hover:bg-zinc-700 text-gray-300" title="Text color">
            <Palette className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto bg-zinc-900">
        {editor && <EditorContent editor={editor} className="h-full bg-zinc-900" />}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between p-4 bg-zinc-800 border-t border-zinc-700 rounded-b-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={handleSend}
            disabled={isSending}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>

          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-zinc-700 rounded" title="Attach files">
              <PaperClipIcon className="w-4 h-4 text-gray-400" />
            </button>
            <button className="p-2 hover:bg-zinc-700 rounded" title="Insert emoji">
              <FaceSmileIcon className="w-4 h-4 text-gray-400" />
            </button>
            <button className="p-2 hover:bg-zinc-700 rounded" title="Formatting options">
              <PaintBrushIcon className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        <button
          onClick={handleClose}
          className="p-2 hover:bg-zinc-700 rounded"
          title="Delete draft"
        >
          <TrashIcon className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* TipTap Editor Styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .ProseMirror {
            outline: none;
            color: #ffffff;
            background-color: #18181b;
            min-height: 200px;
            padding: 12px;
            caret-color: #ffffff;
          }
          
          .ProseMirror p {
            margin: 0.5em 0;
            color: #ffffff;
          }
          
          .ProseMirror p:first-child {
            margin-top: 0;
          }
          
          .ProseMirror p:last-child {
            margin-bottom: 0;
          }
          
          .ProseMirror strong {
            font-weight: bold;
            color: #fbbf24;
          }
          
          .ProseMirror em {
            font-style: italic;
            color: #d1d5db;
          }
          
          .ProseMirror ul, .ProseMirror ol {
            padding-left: 1.5rem;
            margin: 0.5em 0;
            color: #ffffff;
          }
          
          .ProseMirror li {
            margin: 0.25em 0;
            color: #ffffff;
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
        `
        }}
      />
    </div>
  )
}

export default ComposeModal
