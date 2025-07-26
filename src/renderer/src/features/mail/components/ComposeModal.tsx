import React, { useState, useEffect, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { useModalStore } from '../../../globalStore/useModalStore'
import { useMailStore } from '../store'
import { toast } from 'react-toastify'
import {
  XMarkIcon,
  ArrowsPointingOutIcon,
  PaperClipIcon,
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
  draft?: {
    to: string[]
    cc?: string[]
    bcc?: string[]
    subject: string
    body: string
  }
}

const ComposeModal: React.FC<ComposeModalProps> = ({ replyTo, forward, draft }) => {
  const { closeModal } = useModalStore()
  const { addDraft } = useMailStore()
  const [isExpanded, setIsExpanded] = useState(false)
  const [showCc, setShowCc] = useState(false)
  const [showBcc, setShowBcc] = useState(false)

  // Form fields
  const [to, setTo] = useState('')
  const [cc, setCc] = useState('')
  const [bcc, setBcc] = useState('')
  const [subject, setSubject] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])

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
        class: 'focus:outline-none min-h-[200px] p-3 text-white'
      }
    }
  })

  // Initialize form for reply/forward/draft
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
    } else if (draft) {
      setTo(draft.to.join(', '))
      setCc(draft.cc?.join(', ') || '')
      setBcc(draft.bcc?.join(', ') || '')
      setSubject(draft.subject)
      if (editor) {
        editor.commands.setContent(draft.body)
      }
      // Show CC/BCC fields if they have content
      if (draft.cc && draft.cc.length > 0) setShowCc(true)
      if (draft.bcc && draft.bcc.length > 0) setShowBcc(true)
    }
  }, [replyTo, forward, draft, editor])

  const handleSaveDraft = useCallback(() => {
    // Only save if there's actual content
    const hasContent =
      to.trim() ||
      cc.trim() ||
      bcc.trim() ||
      subject.trim() ||
      (editor?.getHTML() && editor.getHTML() !== '<p></p>')

    if (!hasContent) return

    const draftData = {
      id: `draft_${Date.now()}`,
      to: to
        .split(',')
        .map((email) => email.trim())
        .filter(Boolean),
      cc: cc
        .split(',')
        .map((email) => email.trim())
        .filter(Boolean),
      bcc: bcc
        .split(',')
        .map((email) => email.trim())
        .filter(Boolean),
      subject: subject || '(no subject)',
      body: editor?.getHTML() || '',
      timestamp: Date.now(),
      isDraft: true as const
    }

    console.log('Saving draft:', draftData)
    addDraft(draftData)
  }, [to, cc, bcc, subject, editor, addDraft])

  // Handle escape key to minimize and save draft
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        handleSaveDraft()
        closeModal()
      }
    }

    document.addEventListener('keydown', handleEscape, true)
    return () => document.removeEventListener('keydown', handleEscape, true)
  }, [to, cc, bcc, subject, editor, closeModal, handleSaveDraft])

  const handleSend = async () => {
    if (!to.trim() || !editor) {
      alert('Please enter recipient and message content')
      return
    }

    setIsSending(true)
    try {
      // Process attachments
      const processedAttachments = await Promise.all(
        attachments.map(async (file) => ({
          filename: file.name,
          content: await fileToBase64(file),
          mimeType: file.type || 'application/octet-stream'
        }))
      )

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
        ...(processedAttachments.length > 0 ? { attachments: processedAttachments } : {}),
        ...(replyTo ? { replyToMessageId: replyTo.messageId } : {})
      }

      console.log('Sending email:', { ...emailData, attachments: processedAttachments.length })

      const result = await window.electronAPI.gmail.sendEmail(emailData)

      if (result.success) {
        closeModal()
        toast.success('Email sent')
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

  const handleClose = async () => {
    // Check if there's content to save
    const hasContent =
      to.trim() ||
      cc.trim() ||
      bcc.trim() ||
      subject.trim() ||
      (editor?.getHTML() && editor.getHTML() !== '<p></p>')

    if (hasContent) {
      try {
        // Prepare draft data
        const draftData = {
          to: to
            .split(',')
            .map((email) => email.trim())
            .filter(Boolean),
          cc: cc
            .split(',')
            .map((email) => email.trim())
            .filter(Boolean),
          bcc: bcc
            .split(',')
            .map((email) => email.trim())
            .filter(Boolean),
          subject: subject || '(no subject)',
          body: editor?.getHTML() || ''
        }

        // Save draft to Gmail
        const result = await window.electronAPI.gmail.saveDraft(draftData)

        if (result.success) {
          toast.success('Saved to drafts')
        } else {
          throw new Error(result.error || 'Failed to save draft to Gmail')
        }
        closeModal()
      } catch (error) {
        console.error('Failed to save draft:', error)
        toast.error('Failed to save draft')
      }
    } else {
      closeModal()
    }
  }

  const handleFileAttachment = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.accept = '*/*'
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || [])
      if (files.length > 0) {
        setAttachments((prev) => [...prev, ...files])
        // Scroll to bottom to show attached files
        setTimeout(() => {
          const editorContainer = document.querySelector('.editor-container')
          if (editorContainer) {
            editorContainer.scrollTop = editorContainer.scrollHeight
          }
        }, 100)
      }
    }
    input.click()
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const result = reader.result as string
        // Remove the data:mime/type;base64, prefix
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
    })
  }

  return (
    <div
      className={`${isExpanded ? 'w-[98vw] h-[98vh]' : 'w-[90vw] h-[85vh]'} max-w-4xl bg-zinc-900 shadow-2xl rounded-lg border border-zinc-700 flex flex-col relative mx-auto`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-t-lg border-b border-zinc-700">
        <h3 className="text-lg font-medium text-white">
          {replyTo ? 'Reply' : forward ? 'Forward' : draft ? 'Edit Draft' : 'New Message'}
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
      <div
        className="editor-container flex-1 overflow-y-auto bg-zinc-900"
        onClick={() => editor?.commands.focus()}
      >
        {editor && <EditorContent editor={editor} className="h-full bg-zinc-900" />}

        {/* Attachments Display - Gmail style */}
        {attachments.length > 0 && (
          <div className="p-3">
            <div className="flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-zinc-700 px-3 py-2 rounded-lg text-sm border border-zinc-600"
                >
                  <PaperClipIcon className="w-4 h-4 text-gray-300" />
                  <span className="text-white text-sm">{file.name}</span>
                  <button
                    onClick={() => removeAttachment(index)}
                    className="text-gray-400 hover:text-red-400 ml-1 text-lg leading-none"
                    title="Remove attachment"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
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
            <button
              onClick={handleFileAttachment}
              className="p-2 hover:bg-zinc-700 rounded"
              title="Attach files"
            >
              <PaperClipIcon className="w-4 h-4 text-gray-400" />
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
            border: none;
            width: 100%;
            box-sizing: border-box;
          }
          
          .ProseMirror:focus {
            outline: none;
            border: none;
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
            color: #ffffff;
          }
          
          .ProseMirror em {
            font-style: italic;
            color: #d1d5db;
          }
          
          .ProseMirror u {
            text-decoration: underline;
            color: #ffffff;
          }
          
          .ProseMirror ul, .ProseMirror ol {
            padding-left: 1.5rem;
            margin: 0.5em 0;
            color: #ffffff;
            list-style-position: outside;
          }
          
          .ProseMirror ul {
            list-style-type: disc;
          }
          
          .ProseMirror ul ul {
            list-style-type: circle;
          }
          
          .ProseMirror ul ul ul {
            list-style-type: square;
          }
          
          .ProseMirror ul ul ul ul {
            list-style-type: disc;
          }
          
          .ProseMirror ol {
            list-style-type: decimal;
          }
          
          .ProseMirror ol ol {
            list-style-type: lower-alpha;
          }
          
          .ProseMirror ol ol ol {
            list-style-type: lower-roman;
          }
          
          .ProseMirror ol ol ol ol {
            list-style-type: decimal;
          }
          
          .ProseMirror li {
            margin: 0.25em 0;
            color: #ffffff;
            display: list-item;
          }
          
          .ProseMirror li::marker {
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
