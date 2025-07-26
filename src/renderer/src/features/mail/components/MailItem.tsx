// MailItem.tsx — inline render, width clamped, no overflow + empty-body fallback

import React, { useState, useEffect, useRef } from 'react'
import DOMPurify from 'dompurify'
import { StarIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { ChevronDownIcon, ChevronUpIcon, TrashIcon } from '@heroicons/react/24/outline'
import { MailItem as MailItemType } from '../types'
import { useMailStore } from '../store'
import { toast } from 'react-toastify'
import { DateTime } from 'luxon'

import Pdf from '@/assets/mail/mail-pdf.png'
import ImageIcon from '@/assets/mail/mail-img.png'
import Doc from '@/assets/mail/mail-doc.png'
import Sheet from '@/assets/mail/mail-sheet.png'

interface MailItemProps {
  mail: MailItemType
}

const getFileTypeInfo = (filename: string, mimeType: string) => {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (mimeType.includes('pdf') || ext === 'pdf') return { icon: Pdf, label: 'PDF' }
  if (
    mimeType.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext || '')
  )
    return { icon: ImageIcon, label: 'Image' }
  if (
    mimeType.includes('excel') ||
    mimeType.includes('sheet') ||
    ['csv', 'xlsx', 'xls'].includes(ext || '')
  )
    return { icon: Sheet, label: 'Spreadsheet' }
  if (
    mimeType.includes('document') ||
    mimeType.includes('word') ||
    mimeType.includes('powerpoint') ||
    mimeType.includes('presentation') ||
    ['doc', 'docx', 'ppt', 'pptx', 'txt', 'rtf'].includes(ext || '')
  )
    return { icon: Doc, label: 'Document' }
  if (
    mimeType.includes('zip') ||
    mimeType.includes('rar') ||
    ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')
  )
    return { icon: Doc, label: 'Archive' }
  return { icon: Doc, label: 'File' }
}

interface ExpandedMailData {
  body: string
  fullHeaders: Record<string, string>
  date: string
  to: string[]
  cc: string[]
  bcc: string[]
}

/** Is the HTML/text effectively empty? */
const isEmptyBody = (body?: string) => {
  if (!body) return true
  const text = body
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;|\s+/gi, '')
  return text.length === 0
}

/** Inject CSS to neuter overflowing inline styles from newsletters */
const wrapEmailHtml = (raw: string) => {
  const safe = DOMPurify.sanitize(raw, {
    ADD_ATTR: ['style', 'width', 'height', 'align'],
    ALLOWED_URI_REGEXP: /^(https?:|data:|mailto:)/i
  })

  return `
<style>
  :root{--berri-email-w:420px;}
  .berri-wrap{
    max-width:var(--berri-email-w);
    margin:0 auto;
    overflow-x:hidden;
    box-sizing:border-box;
  }
  .berri-wrap *, .berri-wrap *::before, .berri-wrap *::after{box-sizing:border-box !important;}
  .berri-wrap [style*="position:absolute"],
  .berri-wrap [style*="position: absolute"],
  .berri-wrap [style*="float:right"],
  .berri-wrap [align="right"],
  .berri-wrap [align="left"]{
    position:static !important; float:none !important; text-align:inherit !important;
    left:auto !important; right:auto !important; top:auto !important; bottom:auto !important;
  }
  .berri-wrap *[width]{width:auto !important; max-width:100% !important;}
  .berri-wrap *[height]{height:auto !important; max-height:none !important;}
  .berri-wrap img{max-width:100% !important; height:auto !important; width:auto !important; display:block;}
  .berri-wrap table{width:100% !important; max-width:100% !important; border-collapse:collapse;}
  .berri-wrap td, .berri-wrap th{word-break:break-word; padding:6px;}
  .berri-wrap{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#333;line-height:1.45;font-size:13px;}
  .berri-wrap h1{font-size:1.25em !important;margin:.6em 0 .4em;}
  .berri-wrap h2{font-size:1.15em !important;margin:.6em 0 .4em;}
  .berri-wrap h3{font-size:1.05em !important;margin:.5em 0 .3em;}
  .berri-wrap a{color:#1a73e8;text-decoration:none;} .berri-wrap a:hover{text-decoration:underline;}
  .berri-wrap blockquote{border-left:3px solid #ddd;margin:12px 0;padding-left:12px;color:#666;}
  .berri-wrap p, .berri-wrap ul, .berri-wrap ol, .berri-wrap table, .berri-wrap blockquote{margin:.6em 0;}
</style>
<div class="berri-wrap">${safe}</div>`
}

const MailItem: React.FC<MailItemProps> = ({ mail }) => {
  const { updateMail, selectedEmailIds, toggleEmailSelection } = useMailStore()
  const isSelected = selectedEmailIds.includes(mail.id)

  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedData, setExpandedData] = useState<ExpandedMailData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const handleToggleStar = () => updateMail(mail.id, { isStarred: !mail.isStarred })
  const handleCheckboxChange = () => toggleEmailSelection(mail.id)

  useEffect(() => {
    const handleLinkClick = (e: Event) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'A') {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        const href = (target as HTMLAnchorElement).href
        if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
          window.electronAPI.openExternal(href)
        }
      }
    }

    if (ref.current && isExpanded) {
      ref.current.addEventListener('click', handleLinkClick, true)
    }

    return () => {
      if (ref.current) {
        ref.current.removeEventListener('click', handleLinkClick, true)
      }
    }
  }, [isExpanded])

  const handleMailClick = async () => {
    if (isExpanded) return setIsExpanded(false)
    if (!expandedData) {
      setIsLoading(true)
      try {
        const res = await window.electronAPI.gmail.getFullEmail(mail.id)
        if (res.success && res.email) {
          setExpandedData(res.email)
          setIsExpanded(true)
          // Mark as read when expanded
          if (!mail.isRead) {
            updateMail(mail.id, { isRead: true })
          }
          setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
        } else toast.error('Failed to load email content')
      } catch (e) {
        console.error(e)
        toast.error('Error loading email')
      } finally {
        setIsLoading(false)
      }
    } else {
      setIsExpanded(true)
      // Mark as read when expanded
      if (!mail.isRead) {
        updateMail(mail.id, { isRead: true })
      }
      setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
    }
  }

  const handleAttachmentClick = async (att: any) => {
    try {
      const res = await window.electronAPI.gmail.downloadAttachment(
        mail.id,
        att.attachmentId,
        att.filename
      )
      if (res.success) {
        const fileName = res.filePath?.split('/').pop() || att.filename
        toast.success(
          <div>
            <div>Downloaded: {fileName}</div>
            <button
              onClick={() =>
                res.filePath &&
                window.electronAPI.openExternal(
                  `file://${res.filePath.split('/').slice(0, -1).join('/')}`
                )
              }
              className="text-blue-300 underline text-xs mt-1"
            >
              Open Downloads folder
            </button>
          </div>
        )
      } else toast.error(`Failed to download attachment: ${res.error}`)
    } catch (e) {
      toast.error('Error downloading attachment')
      console.error(e)
    }
  }

  const formatTime = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const m = Math.floor(diff / 60000)
    const h = Math.floor(diff / 3600000)
    const d = Math.floor(diff / 86400000)
    if (m < 60) return `${m}m`
    if (h < 24) return `${h}h`
    return `${d}d`
  }

  return (
    <div
      ref={ref}
      className={`
        px-3 py-5 transition-colors cursor-pointer ${isExpanded ? '' : 'hover:bg-[#393939]'}
        ${isSelected ? 'bg-blue-900 hover:bg-blue-900' : mail.isRead ? 'bg-black/50 ' : 'bg-transparent'}
        ${isExpanded ? 'bg-[#2a2a2a]' : ''}
        ${!isExpanded ? 'border-b border-gray-700' : ''}
      `}
      onClick={handleMailClick}
    >
      {/* Row */}
      {!isExpanded && (
        <div className="grid grid-cols-[auto_auto_12rem_minmax(0,1fr)_auto] items-start gap-2">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleCheckboxChange}
          onClick={(e) => e.stopPropagation()}
          className="w-3.5 h-3.5 appearance-none rounded-xs border border-gray-600 bg-zinc-900 checked:bg-zinc-100 focus:ring-0 focus:outline-none relative
                     checked:after:content-[''] checked:after:block checked:after:absolute
                     checked:after:w-1.5 checked:after:h-2.5 checked:after:border-b-2 checked:after:border-r-2
                     checked:after:border-black checked:after:rotate-45 checked:after:left-[3px] checked:after:top-[0px]"
        />

        <button
          onClick={(e) => {
            e.stopPropagation()
            handleToggleStar()
          }}
          className="text-gray-400 hover:text-yellow-400 transition-colors"
        >
          {mail.isStarred ? (
            <StarIconSolid className="size-4 text-yellow-400" />
          ) : (
            <StarIcon className="size-4" />
          )}
        </button>

        <span
          className={`truncate text-sm ${mail.isRead ? 'text-gray-400' : 'text-white font-bold'}`}
          title={`${mail.senderName} <${mail.sender}>`}
        >
          {mail.senderName}
        </span>

        <div className="min-w-0 text-sm">
          <div className="truncate">
            <span className={`${mail.isRead ? 'text-gray-400' : 'text-white font-bold'}`}>
              {mail.subject}
            </span>
          </div>

          {mail.snippet && (
            <div className="text-xs text-gray-500 truncate mt-0.5">{mail.snippet}</div>
          )}

          {mail.hasAttachments && mail.attachments?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {mail.attachments.map((att, i) => {
                const info = getFileTypeInfo(att.filename, att.mimeType)
                return (
                  <div
                    key={`${att.attachmentId}-${i}`}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border-[1px] border-white/50 bg-transparent hover:bg-white/10 cursor-pointer transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAttachmentClick(att)
                    }}
                  >
                    <img src={info.icon} alt={info.label} className="size-3" />
                    <span className="truncate max-w-24">{att.filename}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 justify-end text-xs text-gray-400">
          <span>{formatTime(mail.timestamp)}</span>
          {isLoading && (
            <div className="animate-spin rounded-full h-3 w-3 border border-gray-400 border-t-transparent ml-2" />
          )}
          {isExpanded ? (
            <ChevronUpIcon className="w-4 h-4 ml-2" />
          ) : (
            <ChevronDownIcon className="w-4 h-4 ml-2" />
          )}
        </div>
        </div>
      )}

      {/* Chevron for expanded state */}
      {isExpanded && (
        <div className="flex justify-end">
          <ChevronUpIcon className="w-4 h-4 text-gray-400" />
        </div>
      )}

      {/* Expanded area */}
      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
        {expandedData && (
          <div onClick={(e) => e.stopPropagation()}>
          {/* Headers */}
          <div className="mb-4 text-sm">
            <div className="flex items-center justify-between mb-2 cursor-pointer" onClick={() => setIsExpanded(false)}>
              <div className="font-medium text-white">{mail.subject}</div>
              <div className="text-gray-500 text-xs">{DateTime.fromJSDate(mail.timestamp).toFormat('ccc, dd LLL yyyy, HH:mm')}</div>
            </div>
            <div className="flex justify-end gap-3 mb-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleStar()
                }}
                className="text-gray-400 hover:text-yellow-400 transition-colors"
              >
                {mail.isStarred ? (
                  <StarIconSolid className="size-4 text-yellow-400" />
                ) : (
                  <StarIcon className="size-4" />
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  // TODO: Add delete functionality
                }}
                className="text-gray-400 hover:text-red-400 transition-colors"
              >
                <TrashIcon className="size-4" />
              </button>
            </div>
            <div className="text-gray-400 text-sm mb-2">{mail.senderName} &lt;{mail.sender}&gt;</div>

            {expandedData.to.length > 0 && (
              <div className="flex gap-2 mb-1">
                <span className="text-gray-400 min-w-[30px]">to:</span>
                <span className="text-white">{expandedData.to.join(', ')}</span>
              </div>
            )}
            {expandedData.cc.length > 0 && (
              <div className="flex gap-2 mb-1">
                <span className="text-gray-400 min-w-[30px]">cc:</span>
                <span className="text-white">{expandedData.cc.join(', ')}</span>
              </div>
            )}
          </div>

          {/* Body */}
          {isEmptyBody(expandedData.body) ? (
            <div className="text-center text-gray-400 italic text-xs py-6 border border-dashed border-gray-600 rounded-lg">
              Email body is empty
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="border border-gray-600 rounded-lg bg-white shadow-sm w-full max-w-[480px] overflow-visible">
                {expandedData.body.includes('<') ? (
                  <div dangerouslySetInnerHTML={{ __html: wrapEmailHtml(expandedData.body) }} />
                ) : (
                  <div
                    className="text-sm text-gray-800 whitespace-pre-wrap break-words p-4"
                    style={{ lineHeight: '1.6' }}
                  >
                    {expandedData.body}
                  </div>
                )}
              </div>
            </div>
          )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MailItem
