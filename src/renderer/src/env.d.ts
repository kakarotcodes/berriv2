/// <reference types="vite/client" />

import { ViewType } from '../../types/types'

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
  
  // Sleep/wake handlers
  requestCurrentView: (callback: () => ViewType) => void
  onResumeFromSleep: (callback: (view: ViewType) => void) => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
