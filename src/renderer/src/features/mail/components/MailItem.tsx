import React from 'react'
import { StarIcon, PaperClipIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { MailItem as MailItemType } from '../types'
import { useMailStore } from '../store'

interface MailItemProps {
  mail: MailItemType
}

const stripEmail = (input?: string) => {
  if (!input) return ''
  const m = input.match(/^(.*?)(?:\s*<)/)
  const nameOnly = m ? m[1] : input.replace(/\s*<[^>]+>\s*/g, '')
  return nameOnly.replace(/^"(.*)"$/, '$1').trim()
}

const MailItem: React.FC<MailItemProps> = ({ mail }) => {
  const { updateMail, selectedEmailIds, toggleEmailSelection } = useMailStore()
  const isSelected = selectedEmailIds.includes(mail.id)

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

  const senderRaw = mail.fromName ?? mail.sender ?? 'Unknown'
  const sender = stripEmail(senderRaw)

  return (
    <div
      className={`
        px-3 py-5 transition-colors cursor-pointer hover:bg-[#393939]
        ${isSelected ? 'bg-blue-900' : mail.isRead ? 'bg-black/50 ' : 'bg-transparent'}
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
            checked:after:w-1.5 checked:after:h-3 checked:after:border-b-2 checked:after:border-r-2
            checked:after:border-black checked:after:rotate-45
            checked:after:left-[3px] checked:after:top-[-1px]
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
          title={senderRaw}
        >
          {sender}
        </span>

        <div className="min-w-0 truncate text-sm">
          <span className={`${mail.isRead ? 'text-gray-400' : 'text-white font-bold'}`}>
            {mail.subject}
          </span>
        </div>

        <div className="flex items-center gap-1 justify-end text-xs text-gray-400">
          {mail.hasAttachments && <PaperClipIcon className="size-3 rotate-45" />}
          <span>{formatTime(mail.timestamp)}</span>
        </div>
      </div>
    </div>
  )
}

export default MailItem
