// dependencies
import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'
import fs from 'fs'

// path to the db file
const dbPath = path.join(app.getPath('userData'), 'notes.db')

// Ensure the DB file exists
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, '')
}

// Init connection
const db = new Database(dbPath)

// Init table
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    title TEXT,
    type TEXT CHECK(type IN ('text', 'checklist')) NOT NULL,
    content TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )
`
).run()

// API
export const NotesDB = {
  getAllNotes: () => {
    return db.prepare(`SELECT * FROM notes ORDER BY updatedAt DESC`).all()
  },

  insertNote: (note: {
    id: string
    title: string
    type: 'text' | 'checklist'
    content: string
    createdAt: string
    updatedAt: string
  }) => {
    db.prepare(
      `
      INSERT INTO notes (id, title, type, content, createdAt, updatedAt)
      VALUES (@id, @title, @type, @content, @createdAt, @updatedAt)
    `
    ).run(note)
  },

  updateNote: (
    id: string,
    fields: Partial<Omit<ReturnType<typeof NotesDB.getAllNotes>[0], 'id'>>
  ) => {
    const sets = Object.keys(fields)
      .map((k) => `${k} = @${k}`)
      .join(', ')
    db.prepare(`UPDATE notes SET ${sets} WHERE id = @id`).run({ ...fields, id })
  },

  deleteNote: (id: string) => {
    db.prepare(`DELETE FROM notes WHERE id = ?`).run(id)
  }
}
