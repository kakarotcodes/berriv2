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

  // Vertical drag
  startVerticalDrag: (mouseY: number) => void
  updateVerticalDrag: (mouseY: number) => void
  endVerticalDrag: () => void

  // Full drag (horizontal + vertical)
  startDrag: (mouseX: number, mouseY: number) => void
  updateDrag: (mouseX: number, mouseY: number) => void
  endDrag: () => void

  setResizable: (resizable: boolean) => void
  savePillPosition: () => void

  // Opacity control
  setPillOpacity: (alpha: number) => void
  setCssOpacity: (alpha: number) => void

  // External links
  openExternal: (url: string) => void

  // Google Meet
  startGoogleMeet: () => Promise<string>

  // Sleep/wake handlers
  requestCurrentView: (callback: () => ViewType) => () => void
  onResumeFromSleep: (callback: (view: ViewType) => void) => () => void

  // Clipboard history
  clipboard: {
    getHistory: () => Promise<ClipboardEntry[]>
    onUpdate: (callback: (entry: ClipboardEntry) => void) => () => void
  }

  // Notes API
  notesAPI: {
    getAllNotes: () => Promise<Note[]>
    getTrashedNotes: () => Promise<Note[]>
    insertNote: (note: Note) => Promise<void>
    updateNote: (id: string, fields: Partial<Omit<Note, 'id'>>) => Promise<void>
    trashNote: (id: string) => Promise<void>
    restoreNote: (id: string) => Promise<void>
    permanentlyDeleteNote: (id: string) => Promise<void>
  }

  // Main window resizability
  setMainWindowResizable: (resizable: boolean) => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
