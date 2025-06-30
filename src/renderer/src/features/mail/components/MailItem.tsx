// dependencies
import React from 'react'
import { StarIcon, EnvelopeIcon, EnvelopeOpenIcon } from '@heroicons/react/24/outline'
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
      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
        mail.isRead 
          ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' 
          : 'bg-gray-700 border-gray-600 hover:bg-gray-650'
      }`}
    >
      <div className="flex items-start space-x-3">
        {/* Read/Unread indicator */}
        <button
          onClick={handleToggleRead}
          className="mt-1 text-gray-400 hover:text-white transition-colors"
        >
          {mail.isRead ? (
            <EnvelopeOpenIcon className="size-4" />
          ) : (
            <EnvelopeIcon className="size-4" />
          )}
        </button>

        {/* Mail content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <span className={`text-sm ${mail.isRead ? 'text-gray-300' : 'text-white font-medium'}`}>
                {mail.sender}
              </span>
              {mail.labels.includes('important') && (
                <span className="bg-red-500 text-white px-1.5 py-0.5 rounded text-xs">
                  Important
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400">
                {formatTime(mail.timestamp)}
              </span>
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
          
          <div className={`text-sm mb-1 ${mail.isRead ? 'text-gray-300' : 'text-white font-medium'}`}>
            {mail.subject}
          </div>
          
          <div className="text-xs text-gray-400 truncate">
            {mail.body.length > 100 ? `${mail.body.substring(0, 100)}...` : mail.body}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MailItem 