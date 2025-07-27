import React from 'react'
import Modal from 'react-modal'

interface DeleteConfirmModalProps {
  isOpen: boolean
  onConfirm: (e?: React.MouseEvent) => void
  onCancel: (e?: React.MouseEvent) => void
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ isOpen, onConfirm, onCancel }) => {
  const handleOverlayClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Do nothing - prevent any clicks from propagating
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onCancel}
      shouldCloseOnOverlayClick={false}
      shouldCloseOnEsc={true}
      className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#2a2a2a] rounded-lg shadow-2xl border border-gray-600 min-w-[400px] max-w-[500px] outline-none"
      overlayClassName="fixed inset-0 bg-black/50 z-50"
      style={{
        content: {
          padding: 0,
          border: 'none',
          borderRadius: '8px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }
      }}
      overlayElement={(props, contentElement) => (
        <div {...props} onClick={handleOverlayClick}>
          {contentElement}
        </div>
      )}
    >
      <div className="p-6" onClick={(e) => e.stopPropagation()}>
        {/* Title Bar */}
        <div className="flex items-center mb-4">
          <h2 className="text-base font-medium text-white m-0">Delete draft?</h2>
        </div>

        {/* Message */}
        <div className="mb-6">
          <p className="text-sm text-gray-300 m-0 leading-relaxed">
            This draft will be permanently deleted and cannot be recovered.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-300 bg-transparent border border-gray-500 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default DeleteConfirmModal
