import React from 'react'
import ReactModal from 'react-modal'
import { useModalStore } from '@/globalStore/useModalStore'
import './GlobalModal.css'

// Set app element for accessibility
if (typeof document !== 'undefined') {
  ReactModal.setAppElement(document.body)
}

const GlobalModal: React.FC = () => {
  const { isOpen, content, options, closeModal } = useModalStore()

  const handleRequestClose = () => {
    if (options.shouldCloseOnOverlayClick) {
      closeModal()
    }
  }

  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={handleRequestClose}
      shouldCloseOnOverlayClick={options.shouldCloseOnOverlayClick}
      shouldCloseOnEsc={options.shouldCloseOnEsc}
      className={`global-modal ${options.className || ''}`}
      overlayClassName={`global-modal-overlay ${options.overlayClassName || ''}`}
      closeTimeoutMS={200}
      ariaHideApp={true}
    >
      {content}
    </ReactModal>
  )
}

export default GlobalModal