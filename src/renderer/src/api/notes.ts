import { withErrorHandling, ApiResponse } from './base'
import { Note } from '../features/notes/types/noteTypes'

// Helper function to invoke IPC methods
async function invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T> {
  return window.electronAPI.notesAPI[channel](...args)
}

/**
 * Get all non-trashed notes
 */
export async function getAllNotes(): Promise<ApiResponse<Note[]>> {
  return withErrorHandling(async () => {
    return invoke<Note[]>('getAllNotes')
  })
}

/**
 * Get all trashed notes
 */
export async function getTrashedNotes(): Promise<ApiResponse<Note[]>> {
  return withErrorHandling(async () => {
    return invoke<Note[]>('getTrashedNotes')
  })
}

/**
 * Insert a new note
 */
export async function insertNote(note: Note): Promise<ApiResponse<void>> {
  return withErrorHandling(async () => {
    return invoke<void>('insertNote', note)
  })
}

/**
 * Update an existing note
 */
export async function updateNote(
  id: string,
  fields: Partial<Omit<Note, 'id'>>
): Promise<ApiResponse<void>> {
  return withErrorHandling(async () => {
    return invoke<void>('updateNote', id, fields)
  })
}

/**
 * Move note to trash
 */
export async function trashNote(id: string): Promise<ApiResponse<void>> {
  return withErrorHandling(async () => {
    return invoke<void>('trashNote', id)
  })
}

/**
 * Restore note from trash
 */
export async function restoreNote(id: string): Promise<ApiResponse<void>> {
  return withErrorHandling(async () => {
    return invoke<void>('restoreNote', id)
  })
}

/**
 * Permanently delete note
 */
export async function permanentlyDeleteNote(id: string): Promise<ApiResponse<void>> {
  return withErrorHandling(async () => {
    return invoke<void>('permanentlyDeleteNote', id)
  })
}

/**
 * Save an image for notes
 */
export async function saveImage(
  filename: string,
  arrayBuffer: ArrayBuffer
): Promise<ApiResponse<string | null>> {
  return withErrorHandling(async () => {
    return invoke<string | null>('saveImage', filename, arrayBuffer)
  })
}

// Namespace object for organized access (optional)
export const notesAPI = {
  getAllNotes,
  getTrashedNotes,
  insertNote,
  updateNote,
  trashNote,
  restoreNote,
  permanentlyDeleteNote,
  saveImage
} as const
