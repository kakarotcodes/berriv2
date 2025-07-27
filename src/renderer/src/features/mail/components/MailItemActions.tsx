import React from 'react'
import { ArrowUturnLeftIcon, ArrowUturnRightIcon } from '@heroicons/react/24/outline'
import { MailItem as MailItemType } from '../types'
import { useModalStore } from '../../../globalStore/useModalStore'
import ComposeModal from './ComposeModal'

interface MailItemActionsProps {
  mail: MailItemType
  expandedData?: {
    body: string
    fullHeaders: Record<string, string>
    date: string
    to: string[]
    cc: string[]
    bcc: string[]
  } | null
}

const MailItemActions: React.FC<MailItemActionsProps> = ({
  mail,
  expandedData
}) => {
  const { openModal } = useModalStore()

  return (
    <div className="flex gap-3 mt-6 justify-center" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          openModal(
            <ComposeModal
              replyTo={{
                messageId: mail.id,
                subject: mail.subject,
                sender: mail.sender
              }}
            />,
            {
              shouldCloseOnOverlayClick: false,
              shouldCloseOnEsc: false
            }
          )
        }}
        className="flex items-center gap-2 px-4 py-2 border border-gray-400 text-gray-300 rounded-full text-sm font-medium hover:bg-gray-700 hover:border-gray-300 transition-colors"
      >
        <ArrowUturnLeftIcon className="w-4 h-4" />
        Reply
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          openModal(
            <ComposeModal
              forward={{
                messageId: mail.id,
                subject: mail.subject,
                body: expandedData?.body || mail.snippet
              }}
            />,
            {
              shouldCloseOnOverlayClick: false,
              shouldCloseOnEsc: false
            }
          )
        }}
        className="flex items-center gap-2 px-4 py-2 border border-gray-400 text-gray-300 rounded-full text-sm font-medium hover:bg-gray-700 hover:border-gray-300 transition-colors"
      >
        <ArrowUturnRightIcon className="w-4 h-4" />
        Forward
      </button>
    </div>
  )
}

export default MailItemActions