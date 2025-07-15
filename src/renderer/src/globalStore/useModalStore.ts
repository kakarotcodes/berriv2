import { create } from 'zustand'
import { ReactNode } from 'react'

interface ModalOptions {
  shouldCloseOnOverlayClick?: boolean
  shouldCloseOnEsc?: boolean
  className?: string
  overlayClassName?: string
}

interface ModalState {
  isOpen: boolean
  content: ReactNode | null
  options: ModalOptions
  openModal: (content: ReactNode, options?: ModalOptions) => void
  closeModal: () => void
}

export const useModalStore = create<ModalState>((set) => ({
  isOpen: false,
  content: null,
  options: {
    shouldCloseOnOverlayClick: true,
    shouldCloseOnEsc: true,
    className: '',
    overlayClassName: ''
  },

  openModal: (content: ReactNode, options: ModalOptions = {}) => {
    set({
      isOpen: true,
      content,
      options: {
        shouldCloseOnOverlayClick: true,
        shouldCloseOnEsc: true,
        className: '',
        overlayClassName: '',
        ...options
      }
    })
  },

  closeModal: () => {
    set({
      isOpen: false,
      content: null,
      options: {
        shouldCloseOnOverlayClick: true,
        shouldCloseOnEsc: true,
        className: '',
        overlayClassName: ''
      }
    })
  }
}))
