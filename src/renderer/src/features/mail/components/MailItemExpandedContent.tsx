import React from 'react'
import DOMPurify from 'dompurify'
import { StarIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { ChevronUpIcon, TrashIcon } from '@heroicons/react/24/outline'
import { MailItem as MailItemType } from '../types'
import { DateTime } from 'luxon'

interface ExpandedMailData {
  body: string
  fullHeaders: Record<string, string>
  date: string
  to: string[]
  cc: string[]
  bcc: string[]
}

interface MailItemExpandedContentProps {
  mail: MailItemType
  expandedData: ExpandedMailData
  isDraft: boolean
  isLoading: boolean
  onToggleStar: () => void
  onCollapse: () => void
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

const MailItemExpandedContent: React.FC<MailItemExpandedContentProps> = ({
  mail,
  expandedData,
  isDraft,
  isLoading,
  onToggleStar,
  onCollapse
}) => {
  if (isLoading && !expandedData) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-400 border-t-transparent" />
        <span className="ml-3 text-gray-400 text-sm">Loading email content...</span>
      </div>
    )
  }

  if (!expandedData) return null

  return (
    <>
      {/* Chevron/Delete icon for expanded state */}
      {!isDraft && (
        <div className="flex justify-end">
          <ChevronUpIcon className="w-4 h-4 text-gray-400" />
        </div>
      )}

      <div onClick={(e) => e.stopPropagation()}>
        {/* Headers */}
        <div className="mb-4 text-sm">
          <div
            className="flex items-center justify-between mb-2 cursor-pointer"
            onClick={onCollapse}
          >
            <div className="font-medium text-white text-lg truncate">{mail.subject}</div>
            <div className="text-gray-500 text-xs">
              {DateTime.fromJSDate(mail.timestamp).toFormat('ccc, dd LLL yyyy, HH:mm')}
            </div>
          </div>
          <div className="flex justify-end gap-3 mb-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleStar()
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
          <div className="text-white/80 text-sm mb-2">
            <span className="font-bold">{mail.senderName}</span>
            &lt;{mail.sender}&gt;
          </div>

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
            <div className="border border-gray-600 rounded-lg bg-white shadow-sm w-full max-w-[480px] max-h-[600px] overflow-y-auto hide-scrollbar">
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
    </>
  )
}

export default MailItemExpandedContent