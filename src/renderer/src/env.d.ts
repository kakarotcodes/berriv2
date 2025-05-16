/// <reference types="vite/client" />

import { ViewType } from '../../types/types'

interface ClipboardEntry {
  id: string
  content: string
  timestamp: number
}

interface ElectronAPI {
  resizeWindow: (dimensions: { width: number; height: number }) => void
  animateViewTransition: (view: ViewType) => Promise<boolean>
  startVerticalDrag: (mouseY: number) => void
  updateVerticalDrag: (mouseY: number) => void
  endVerticalDrag: () => void
  setResizable: (resizable: boolean) => void
  savePillPosition: () => void

  // Opacity control
  setPillOpacity: (alpha: number) => void
  setCssOpacity: (alpha: number) => void

  // External links
  openExternal: (url: string) => void

  // Google Meet
  startGoogleMeet: () => Promise<string>

  // Clipboard history
  clipboard: {
    getHistory: () => Promise<ClipboardEntry[]>
    onUpdate: (callback: (entry: ClipboardEntry) => void) => () => void
  }

  // Sleep/wake handlers
  requestCurrentView: (callback: () => ViewType) => () => void
  onResumeFromSleep: (callback: (view: ViewType) => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
