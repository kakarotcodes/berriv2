import { ipcMain, app } from 'electron'
import path from 'path'
import fs from 'fs/promises'
import { NotesDB } from '../../../renderer/src/features/notes/db/notesDB'

export function registerNotesHandlers() {
  // Get all notes
  ipcMain.handle('notes:getAll', () => {
    return NotesDB.getAllNotes()
  })

  // Get trashed notes
  ipcMain.handle('notes:getTrashed', () => {
    return NotesDB.getTrashedNotes()
  })

  // Insert new note
  ipcMain.handle('notes:insert', (_event, note) => {
    return NotesDB.insertNote(note)
  })

  // Update existing note
  ipcMain.handle('notes:update', (_event, { id, fields }) => {
    return NotesDB.updateNote(id, fields)
  })

  // Move note to trash
  ipcMain.handle('notes:trash', (_event, id) => {
    return NotesDB.trashNote(id)
  })

  // Restore note from trash
  ipcMain.handle('notes:restore', (_event, id) => {
    return NotesDB.restoreNote(id)
  })

  // Permanently delete note
  ipcMain.handle('notes:deleteForever', (_event, id) => {
    return NotesDB.permanentlyDeleteNote(id)
  })

  // Remove duplicate notes
  ipcMain.handle('notes:removeDuplicates', () => {
    return NotesDB.removeDuplicates()
  })

  // Save image for notes
  ipcMain.handle('notes:saveImage', async (_event, { filename, file }) => {
    try {
      // Create images directory if it doesn't exist
      const imagesDir = path.join(app.getPath('userData'), 'images')
      await fs.mkdir(imagesDir, { recursive: true })

      // Generate a unique filename
      const timestamp = Date.now()
      const extension = path.extname(filename) || '.png'
      const uniqueFilename = `${timestamp}_${path.basename(filename, extension)}${extension}`
      const filePath = path.join(imagesDir, uniqueFilename)

      // Convert ArrayBuffer to Buffer
      const buffer = Buffer.from(file)

      // Save the file
      await fs.writeFile(filePath, buffer)

      console.log('[IMAGES] Saved image to:', filePath)

      // Return the file path for use in the editor
      return `file://${filePath}`
    } catch (error) {
      console.error('[IMAGES] Error saving image:', error)
      return null
    }
  })
}
