/// <reference types="vite/client" />

interface ClipboardEntry {
  id: string
  content: string
  type: 'text' | 'image'
  timestamp: number
}

interface AuthTokens {
  access: string
  refresh?: string
  timestamp?: number
}

interface AuthResponse {
  success: boolean
  tokens?: AuthTokens | null
  error?: string
}

interface AuthCallbackData {
  url: string
  tokens?: AuthTokens | null
  error?: string
}

interface NoteFields {
  title?: string
  content?: string
  tags?: string[]
  isActive?: boolean
  isTrashed?: boolean
  updatedAt?: string
}

interface Note {
  id: string
  title: string
  type: 'text' | 'checklist' | 'richtext'
  content: string | Array<{ id: string; text: string; checked: boolean }>
  createdAt: string
  updatedAt: string
  pinned?: boolean
  trashed?: boolean
}

interface ElectronAPI {
  resizeWindow: (dimensions: { width: number; height: number }) => void
  animateViewTransition: (view: string) => Promise<void>
  getWindowBounds: () => Promise<{ width: number; height: number; x: number; y: number }>

  // Authentication API
  auth: {
    openGoogleLogin: () => Promise<AuthResponse>
    getTokens: () => Promise<AuthResponse>
    logout: () => Promise<AuthResponse>
    onAuthCallback: (callback: (data: AuthCallbackData) => void) => () => void
  }

  // Vertical Drag
  startVerticalDrag: (mouseY: number) => void
  updateVerticalDrag: (mouseY: number) => void
  endVerticalDrag: () => void

  // Full Drag
  startDrag: (mouseX: number, mouseY: number) => void
  updateDrag: (mouseX: number, mouseY: number) => void
  endDrag: () => void

  setResizable: (resizable: boolean) => void
  setMainWindowResizable: (resizable: boolean) => void
  savePillPosition: () => void

  // Opacity control
  setPillOpacity: (alpha: number) => void
  setCssOpacity: (alpha: number) => void

  // External links
  openExternal: (url: string) => void

  // Google Meet
  startGoogleMeet: () => Promise<void>

  // Sleep/wake handlers
  requestCurrentView: (callback: () => string) => () => void
  onResumeFromSleep: (callback: (view: string) => void) => () => void

  // Clipboard
  clipboard: {
    getHistory: () => Promise<ClipboardEntry[]>
    onUpdate: (callback: (entry: ClipboardEntry) => void) => () => void
  }

  // Notes API
  notesAPI: {
    getAllNotes: () => Promise<Note[]>
    getTrashedNotes: () => Promise<Note[]>
    insertNote: (note: Note) => Promise<Note>
    updateNote: (id: string, fields: NoteFields) => Promise<Note>
    trashNote: (id: string) => Promise<void>
    restoreNote: (id: string) => Promise<void>
    permanentlyDeleteNote: (id: string) => Promise<void>
    removeDuplicates: () => Promise<number>
    saveImage: (filename: string, arrayBuffer: ArrayBuffer) => Promise<string>
  }

  // Hover management
  fixHoverDimensions: () => void
  saveHoverSize: (dimensions: { width: number; height: number }) => void
  getSavedHoverSize: () => Promise<{ width: number; height: number } | null>

  // Window visibility for flicker-free transitions
  hideWindowTemporarily: () => Promise<{ success: boolean; error?: string }>
  showWindow: () => Promise<{ success: boolean; error?: string }>

  // Listen for real transition completion events
  onViewTransitionDone: (callback: (view: string) => void) => () => void
}

interface Window {
  electronAPI: ElectronAPI
}
