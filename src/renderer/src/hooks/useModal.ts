import { ReactNode } from 'react'
import { useModalStore } from '@/globalStore/useModalStore'

interface ModalOptions {
  shouldCloseOnOverlayClick?: boolean
  shouldCloseOnEsc?: boolean
  className?: string
  overlayClassName?: string
}

interface UseModalReturn {
  openModal: (content: ReactNode, options?: ModalOptions) => void
  closeModal: () => void
  isOpen: boolean
}

export const useModal = (): UseModalReturn => {
  const { openModal, closeModal, isOpen } = useModalStore()

  return {
    openModal,
    closeModal,
    isOpen
  }
}