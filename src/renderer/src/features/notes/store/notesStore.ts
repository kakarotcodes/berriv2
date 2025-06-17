import { create } from 'zustand'
import { Note } from '../types/noteTypes'

interface NotesState {
  notes: Note[]
  trashed: Note[]
  selectedNoteId: string | null

  setNotes: (notes: Note[]) => void
  setTrashed: (notes: Note[]) => void
  setSelectedNoteId: (id: string | null) => void

  getSelectedNote: () => Note | null
  loadNotes: () => Promise<void>

  addNote: (note: Note) => Promise<void>
  updateNote: (id: string, fields: { title?: string; content?: string; updatedAt?: string }) => Promise<void>
  trashNote: (id: string) => Promise<void>
  restoreNote: (id: string) => Promise<void>
  permanentlyDeleteNote: (id: string) => Promise<void>
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  trashed: [],
  selectedNoteId: null,

  setNotes: (notes) => set({ notes }),
  setTrashed: (notes) => set({ trashed: notes }),
  setSelectedNoteId: (id) => set({ selectedNoteId: id }),

  getSelectedNote: () => {
    const { notes, selectedNoteId } = get()
    return notes.find((n) => n.id === selectedNoteId) || null
  },

  loadNotes: async () => {
    // Clean up any duplicates first
    await window.electronAPI.notesAPI.removeDuplicates()
    
    const [notes, trashed] = await Promise.all([
      window.electronAPI.notesAPI.getAllNotes(),
      window.electronAPI.notesAPI.getTrashedNotes()
    ])
    set({ notes, trashed })
  },

  addNote: async (note) => {
    await window.electronAPI.notesAPI.insertNote(note)
    const updated = [note, ...get().notes]
    set({ notes: updated })
  },

  updateNote: async (id, fields) => {
    await window.electronAPI.notesAPI.updateNote(id, fields)
    const updatedNotes = get().notes.map((n) => (n.id === id ? { ...n, ...fields } : n))
    set({ notes: updatedNotes })
  },

  trashNote: async (id) => {
    await window.electronAPI.notesAPI.trashNote(id)
    const updatedNotes = get().notes.filter((n) => n.id !== id)
    const newSelected = get().selectedNoteId === id ? null : get().selectedNoteId
    const trashed = await window.electronAPI.notesAPI.getTrashedNotes()
    set({ notes: updatedNotes, selectedNoteId: newSelected, trashed })
  },

  restoreNote: async (id) => {
    await window.electronAPI.notesAPI.restoreNote(id)
    const [fresh, trashed] = await Promise.all([
      window.electronAPI.notesAPI.getAllNotes(),
      window.electronAPI.notesAPI.getTrashedNotes()
    ])
    set({ notes: fresh, trashed, selectedNoteId: id })
  },

  permanentlyDeleteNote: async (id) => {
    await window.electronAPI.notesAPI.permanentlyDeleteNote(id)
    const trashed = get().trashed.filter((n) => n.id !== id)
    set({ trashed })
  }
}))
