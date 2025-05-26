import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'
import fs from 'fs'
import { Note } from '../types/noteTypes'

// Ensure DB file exists
const dbPath = path.join(app.getPath('userData'), 'notes.db')
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, '')
}

const db = new Database(dbPath)

// Set user version for potential future migrations
db.pragma('user_version = 1')

// Create table
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    title TEXT,
    type TEXT CHECK(type IN ('text', 'checklist')) NOT NULL,
    content TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    trashed INTEGER DEFAULT 0
  )
`
).run()

// Safe migration for missing 'trashed' column
try {
  db.prepare(`ALTER TABLE notes ADD COLUMN trashed INTEGER DEFAULT 0`).run()
} catch (e: unknown) {
  if (!(e as Error).message?.includes('duplicate column')) throw e
}

// DB Interface
export const NotesDB = {
  getAllNotes: (): Note[] => {
    return db
      .prepare(`SELECT * FROM notes WHERE trashed = 0 ORDER BY updatedAt DESC`)
      .all()
      .map((note) => {
        try {
          return {
            ...note,
            content: JSON.parse(note.content)
          }
        } catch (err) {
          console.warn(`Failed to parse content for note ${note.id}, using raw content`, err)
          return {
            ...note,
            content: note.content // Use raw content if parsing fails
          }
        }
      })
  },

  getTrashedNotes: (): Note[] => {
    return db
      .prepare(`SELECT * FROM notes WHERE trashed = 1 ORDER BY updatedAt DESC`)
      .all()
      .map((note) => {
        try {
          return {
            ...note,
            content: JSON.parse(note.content)
          }
        } catch (err) {
          console.warn(`Failed to parse content for trashed note ${note.id}, using raw content`, err)
          return {
            ...note,
            content: note.content // Use raw content if parsing fails
          }
        }
      })
  },

  insertNote: (note: Note) => {
    db.prepare(
      `
      INSERT INTO notes (id, title, type, content, createdAt, updatedAt, trashed)
      VALUES (@id, @title, @type, @content, @createdAt, @updatedAt, @trashed)
    `
    ).run({
      ...note,
      content: JSON.stringify(note.content),
      trashed: note.trashed ? 1 : 0
    })
  },

  updateNote: (id: string, fields: Partial<Omit<Note, 'id'>>) => {
    const preparedFields = {
      ...fields,
      ...(fields.content !== undefined && {
        content: JSON.stringify(fields.content)
      })
    }

    const sets = Object.keys(preparedFields)
      .map((k) => `${k} = @${k}`)
      .join(', ')
    db.prepare(`UPDATE notes SET ${sets} WHERE id = @id`).run({ ...preparedFields, id })
  },

  trashNote: (id: string) => {
    db.prepare(`UPDATE notes SET trashed = 1 WHERE id = ?`).run(id)
  },

  restoreNote: (id: string) => {
    db.prepare(`UPDATE notes SET trashed = 0 WHERE id = ?`).run(id)
  },

  permanentlyDeleteNote: (id: string) => {
    db.prepare(`DELETE FROM notes WHERE id = ?`).run(id)
  }
}
