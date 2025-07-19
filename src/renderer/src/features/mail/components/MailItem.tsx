// dependencies
import React from 'react'
import { StarIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'

// types
import { MailItem as MailItemType } from '../types'

// store
import { useMailStore } from '../store'

interface MailItemProps {
  mail: MailItemType
}

const MailItem: React.FC<MailItemProps> = ({ mail }) => {
  const { updateMail } = useMailStore()

  // Debug attachment data - check both old and new structure
  const hasAttachments = mail.attachments && Array.isArray(mail.attachments) && mail.attachments.length > 0
  if (hasAttachments) {
    console.log(`[MAILITEM] 📎 Email "${mail.subject}" has ${mail.attachments.length} attachments:`, 
      mail.attachments.map((a: any) => a.filename || a))
  }

  const handleToggleRead = () => {
    updateMail(mail.id, { isRead: !mail.isRead })
  }

  const handleToggleStar = () => {
    updateMail(mail.id, { isStarred: !mail.isStarred })
  }

  const formatTime = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) {
      return `${minutes}m ago`
    } else if (hours < 24) {
      return `${hours}h ago`
    } else {
      return `${days}d ago`
    }
  }

  return (
    <div
      className={`p-3 rounded-lg border-[0.5px] border-white/20 cursor-pointer transition-colors ${
        mail.isRead ? 'bg-black' : ''
      }`}
    >
      <div className="flex items-start space-x-3">
        {/* Mail content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <span
                className={`text-sm ${mail.isRead ? 'text-gray-300' : 'text-white font-medium'}`}
              >
                {mail.sender}
              </span>
              {mail.labels.includes('important') && (
                <span className="bg-red-500 text-white px-1.5 py-0.5 rounded text-xs">
                  Important
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400">{formatTime(mail.timestamp)}</span>
              <div className="flex flex-col items-center space-y-1">
                <button
                  onClick={handleToggleStar}
                  className="text-gray-400 hover:text-yellow-400 transition-colors"
                >
                  {mail.isStarred ? (
                    <StarIconSolid className="size-4 text-yellow-400" />
                  ) : (
                    <StarIcon className="size-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div
            className={`text-sm mb-1 ${mail.isRead ? 'text-gray-300' : 'text-white font-medium'}`}
          >
            {mail.subject}
          </div>

          <div className="text-xs text-gray-400 truncate">
            {mail.body.length > 100 ? `${mail.body.substring(0, 100)}...` : mail.body}
          </div>

          {hasAttachments && (
            <div className="flex items-center text-xs text-gray-400 space-x-1 mt-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 shrink-0" fill="none"
                   viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15.172 7l-6.586 6.586a2 2 0 002.828 2.828l6.586-6.586M8 16V8a4 4 0 014-4h6"/>
              </svg>
              <span className="truncate">
                {(mail.attachments?.[0] as any)?.filename || mail.attachments?.[0]}
                {mail.attachments && mail.attachments.length > 1 && ` (+${mail.attachments.length - 1})`}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MailItem
