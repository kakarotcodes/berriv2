import { ipcMain, app, dialog } from 'electron'
import path from 'path'
import fs from 'fs/promises'
import { NotesDB } from '../../../renderer/src/features/notes/db/notesDB'
import pdf from 'html-pdf-node'
import { Document, Paragraph, TextRun, HeadingLevel, Packer } from 'docx'

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

  // Export notes as PDF
  ipcMain.handle('notes:export-pdf', async (_, noteIds: string[]) => {
    try {
      // Get selected notes
      const allNotes = NotesDB.getAllNotes()
      const validNotes = allNotes.filter(note => noteIds.includes(note.id))

      if (validNotes.length === 0) {
        return { success: false, error: 'No valid notes found' }
      }

      // Show save dialog
      const result = await dialog.showSaveDialog({
        filters: [
          { name: 'PDF Files', extensions: ['pdf'] }
        ],
        defaultPath: `notes-export-${new Date().toISOString().split('T')[0]}.pdf`
      })

      if (result.canceled || !result.filePath) {
        return { success: false, error: 'Save canceled' }
      }

      // Generate HTML content
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; margin: 40px; }
            h1 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
            h2 { color: #555; margin-top: 30px; }
            .note { margin-bottom: 40px; page-break-inside: avoid; }
            .note-meta { color: #666; font-size: 0.9em; margin-bottom: 15px; }
            .note-content { color: #333; }
          </style>
        </head>
        <body>
          <h1>Notes Export</h1>
      `

      validNotes.forEach(note => {
        const createdAt = new Date(note.createdAt).toLocaleString()
        const contentHtml = typeof note.content === 'string' ? note.content : JSON.stringify(note.content)
        htmlContent += `
          <div class="note">
            <h2>${note.title}</h2>
            <div class="note-meta">Created: ${createdAt}</div>
            <div class="note-content">${contentHtml}</div>
          </div>
        `
      })

      htmlContent += '</body></html>'

      // Generate PDF
      const options = { 
        format: 'A4',
        border: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' }
      }

      const file = { content: htmlContent }
      const pdfBuffer = await pdf.generatePdf(file, options)
      
      await fs.writeFile(result.filePath, pdfBuffer)

      return { success: true, filePath: result.filePath }
    } catch (error) {
      console.error('[NOTES] Export PDF Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export PDF'
      }
    }
  })

  // Export notes as DOCX
  ipcMain.handle('notes:export-docx', async (_, noteIds: string[]) => {
    try {
      // Get selected notes
      const allNotes = NotesDB.getAllNotes()
      const validNotes = allNotes.filter(note => noteIds.includes(note.id))

      if (validNotes.length === 0) {
        return { success: false, error: 'No valid notes found' }
      }

      // Show save dialog
      const result = await dialog.showSaveDialog({
        filters: [
          { name: 'Word Documents', extensions: ['docx'] }
        ],
        defaultPath: `notes-export-${new Date().toISOString().split('T')[0]}.docx`
      })

      if (result.canceled || !result.filePath) {
        return { success: false, error: 'Save canceled' }
      }

      // Create document
      const children: Paragraph[] = []

      // Add title
      children.push(
        new Paragraph({
          text: 'Notes Export',
          heading: HeadingLevel.HEADING_1,
        })
      )

      // Add notes
      validNotes.forEach((note, index) => {
        if (index > 0) {
          children.push(new Paragraph({ text: '' })) // Add spacing
        }

        // Note title
        children.push(
          new Paragraph({
            text: note.title,
            heading: HeadingLevel.HEADING_2,
          })
        )

        // Note metadata
        const createdAt = new Date(note.createdAt).toLocaleString()
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Created: ${createdAt}`,
                italics: true,
                size: 20,
                color: '666666',
              }),
            ],
          })
        )

        // Note content - strip HTML tags for DOCX
        const contentString = typeof note.content === 'string' ? note.content : JSON.stringify(note.content)
        const plainContent = contentString.replace(/<[^>]*>/g, '\n').replace(/&nbsp;/g, ' ').trim()
        const contentLines = plainContent.split('\n').filter(line => line.trim())
        
        contentLines.forEach(line => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: line.trim(),
                }),
              ],
            })
          )
        })
      })

      const doc = new Document({
        sections: [{
          properties: {},
          children,
        }],
      })

      const buffer = await Packer.toBuffer(doc)
      await fs.writeFile(result.filePath, buffer)

      return { success: true, filePath: result.filePath }
    } catch (error) {
      console.error('[NOTES] Export DOCX Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export DOCX'
      }
    }
  })
}
