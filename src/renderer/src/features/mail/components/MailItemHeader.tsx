import React from 'react'
import { StarIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { ChevronDownIcon, ChevronUpIcon, TrashIcon } from '@heroicons/react/24/outline'
import { MailItem as MailItemType } from '../types'

import Pdf from '@/assets/mail/mail-pdf.png'
import ImageIcon from '@/assets/mail/mail-img.png'
import Doc from '@/assets/mail/mail-doc.png'
import Sheet from '@/assets/mail/mail-sheet.png'

interface MailItemHeaderProps {
  mail: MailItemType
  isSelected: boolean
  isDraft: boolean
  isExpanded: boolean
  isDeletingDraft: boolean
  onCheckboxChange: () => void
  onToggleStar: () => void
  onDeleteDraft: (e: React.MouseEvent) => void
  onAttachmentClick: (att: any) => void
  formatTime: (timestamp: Date) => string
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

const MailItemHeader: React.FC<MailItemHeaderProps> = ({
  mail,
  isSelected,
  isDraft,
  isExpanded,
  isDeletingDraft,
  onCheckboxChange,
  onToggleStar,
  onDeleteDraft,
  onAttachmentClick,
  formatTime
}) => {
  return (
    <div className="grid grid-cols-[auto_auto_12rem_minmax(0,1fr)_auto] items-start gap-2">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onCheckboxChange}
        onClick={(e) => e.stopPropagation()}
        className="w-3.5 h-3.5 appearance-none rounded-xs border border-gray-600 bg-zinc-900 checked:bg-zinc-100 focus:ring-0 focus:outline-none relative
                 checked:after:content-[''] checked:after:block checked:after:absolute
                 checked:after:w-1.5 checked:after:h-2.5 checked:after:border-b-2 checked:after:border-r-2
                 checked:after:border-black checked:after:rotate-45 checked:after:left-[3px] checked:after:top-[0px]"
      />

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
                    onAttachmentClick(att)
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
        {isDraft ? (
          isDeletingDraft ? (
            <div className="ml-2 animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent" />
          ) : (
            <TrashIcon
              className="w-4 h-4 ml-2 hover:text-red-400 cursor-pointer"
              onClick={onDeleteDraft}
              title="Delete draft"
            />
          )
        ) : isExpanded ? (
          <ChevronUpIcon className="w-4 h-4 ml-2" />
        ) : (
          <ChevronDownIcon className="w-4 h-4 ml-2" />
        )}
      </div>
    </div>
  )
}

export default MailItemHeader