import React from 'react'
import MailList from './MailList'
import MailHeader from './MailHeader'
import ComposeModal from './ComposeModal'
import { PencilIcon } from '@heroicons/react/24/outline'
import { useModalStore } from '../../../globalStore/useModalStore'

const MailAuthorized: React.FC = () => {
  const { openModal } = useModalStore()

  const handleComposeClick = () => {
    openModal(<ComposeModal />, {
      shouldCloseOnOverlayClick: false,
      shouldCloseOnEsc: false,
      className: 'modal-compose',
      overlayClassName: 'modal-compose-overlay'
    })
  }

  return (
    <div className="h-full w-full overflow-hidden flex flex-col relative">
      <MailHeader />
      <div className="flex-1 min-h-0 overflow-hidden">
        <MailList />
      </div>

      {/* Floating Compose Button */}
      <button
        onClick={handleComposeClick}
        className="fixed bottom-10 right-10 bg-white text-black px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 font-medium text-sm hover:bg-gray-100 z-50"
      >
        <PencilIcon className="w-4 h-4" />
        Compose
      </button>
    </div>
  )
}

export default MailAuthorized
