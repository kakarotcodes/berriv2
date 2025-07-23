import React from 'react'
import { StarIcon, PaperClipIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { MailItem as MailItemType } from '../types'
import { useMailStore } from '../store'

interface MailItemProps {
  mail: MailItemType
}

const MailItem: React.FC<MailItemProps> = ({ mail }) => {
  const { updateMail, selectedEmailIds, toggleEmailSelection } = useMailStore()
  const isSelected = selectedEmailIds.includes(mail.id)

  // Debug logging to see what data we're receiving
  React.useEffect(() => {
    console.log(`[DEBUG] MailItem ${mail.subject}:`, {
      senderName: mail.senderName,
      sender: mail.sender,
      hasAttachments: mail.hasAttachments,
      attachments: mail.attachments,
      snippet: mail.snippet
    })
  }, [mail])

  const handleToggleStar = () => updateMail(mail.id, { isStarred: !mail.isStarred })
  const handleCheckboxChange = () => toggleEmailSelection(mail.id)

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
      className={`
        px-3 py-5 transition-colors cursor-pointer hover:bg-[#393939]
        ${isSelected ? 'bg-blue-900 hover:bg-blue-900' : mail.isRead ? 'bg-black/50 ' : 'bg-transparent'}
      `}
    >
      <div className="grid grid-cols-[auto_auto_12rem_minmax(0,1fr)_auto] items-center gap-2">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleCheckboxChange}
          onClick={(e) => e.stopPropagation()}
          className="
            w-3.5 h-3.5 appearance-none rounded-xs border border-gray-600
            bg-zinc-900 checked:bg-zinc-100
            focus:ring-0 focus:outline-none relative
            checked:after:content-[''] checked:after:block checked:after:absolute
            checked:after:w-1.5 checked:after:h-2.5 checked:after:border-b-2 checked:after:border-r-2
            checked:after:border-black checked:after:rotate-45
            checked:after:left-[3px] checked:after:top-[0px]
          "
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
            <div className="text-xs text-gray-500 truncate mt-0.5">
              {mail.snippet}
            </div>
          )}
          {mail.hasAttachments && mail.attachments.length > 0 && (
            <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <PaperClipIcon className="size-3" />
              <span className="truncate">
                {mail.attachments.map(att => att.filename).join(', ')}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 justify-end text-xs text-gray-400">
          {mail.hasAttachments && (
            <div className="flex items-center gap-1">
              <PaperClipIcon className="size-3 rotate-45" />
              <span className="text-xs">{mail.attachments.length}</span>
            </div>
          )}
          <span>{formatTime(mail.timestamp)}</span>
        </div>
      </div>
    </div>
  )
}

export default MailItem