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

// Get current schema version
const getCurrentVersion = (): number => {
  try {
    const result = db.pragma('user_version', { simple: true }) as number
    return result || 0
  } catch {
    return 0
  }
}

// Set user version for potential future migrations
const currentVersion = getCurrentVersion()
console.log(`Database version: ${currentVersion}`)

// Create table
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    title TEXT,
    type TEXT CHECK(type IN ('text', 'checklist', 'richtext')) NOT NULL,
    content TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    trashed INTEGER DEFAULT 0
  )
`
).run()

// Run migrations based on version
if (currentVersion < 1) {
  console.log('Running migration to version 1: Adding trashed column')
  // Safe migration for missing 'trashed' column
  try {
    db.prepare(`ALTER TABLE notes ADD COLUMN trashed INTEGER DEFAULT 0`).run()
  } catch (e: unknown) {
    if (!(e as Error).message?.includes('duplicate column')) throw e
  }
  db.pragma('user_version = 1')
}

if (currentVersion < 2) {
  console.log('Running migration to version 2: Updating type constraint to support richtext')
  // We can't alter check constraints in SQLite, but we can work around it
  // by allowing any text in the type field and handling validation in the app
  // The new CREATE TABLE statement above already includes 'richtext'
  db.pragma('user_version = 2')
}

// Safe migration for missing 'trashed' column (keep for backward compatibility)
try {
  db.prepare(`ALTER TABLE notes ADD COLUMN trashed INTEGER DEFAULT 0`).run()
} catch (e: unknown) {
  if (!(e as Error).message?.includes('duplicate column')) throw e
}

// Helper function to serialize content based on note type
const serializeContent = (note: Note): string => {
  let result: string
  if (note.type === 'checklist' && Array.isArray(note.content)) {
    // Only JSON stringify for checklist items (arrays)
    result = JSON.stringify(note.content)
  } else if (typeof note.content === 'string') {
    // For text/richtext notes, store HTML strings directly
    result = note.content
  } else {
    // Fallback - stringify anything else
    result = JSON.stringify(note.content)
  }
  
  console.log('[DB] Serializing content:', {
    noteId: note.id,
    noteType: note.type,
    contentType: typeof note.content,
    isArray: Array.isArray(note.content),
    originalLength: typeof note.content === 'string' ? note.content.length : JSON.stringify(note.content).length,
    serializedLength: result.length,
    hasImage: result.includes('<img'),
    preview: result.substring(0, 200) + (result.length > 200 ? '...' : '')
  })
  
  return result
}

// Helper function to deserialize content based on note type
const deserializeContent = (rawNote: any): Note => {
  let result: Note
  try {
    if (rawNote.type === 'checklist') {
      // For checklist notes, parse the JSON array
      result = {
        ...rawNote,
        content: JSON.parse(rawNote.content)
      }
    } else {
      // For text/richtext notes, use content as-is (HTML string)
      result = {
        ...rawNote,
        content: rawNote.content
      }
    }
    
    console.log('[DB] Deserializing content:', {
      noteId: rawNote.id,
      noteType: rawNote.type,
      rawContentLength: rawNote.content?.length || 0,
      resultContentLength: typeof result.content === 'string' ? result.content.length : JSON.stringify(result.content).length,
      hasImage: typeof result.content === 'string' && result.content.includes('<img'),
      preview: typeof result.content === 'string' ? result.content.substring(0, 200) + (result.content.length > 200 ? '...' : '') : 'Array content'
    })
    
    return result
  } catch (err) {
    console.warn(`Failed to parse content for note ${rawNote.id}, using raw content`, err)
    return {
      ...rawNote,
      content: rawNote.content // Use raw content if parsing fails
    }
  }
}

// DB Interface
export const NotesDB = {
  getAllNotes: (): Note[] => {
    return db
      .prepare(`SELECT * FROM notes WHERE trashed = 0 ORDER BY updatedAt DESC`)
      .all()
      .map(deserializeContent)
  },

  getTrashedNotes: (): Note[] => {
    return db
      .prepare(`SELECT * FROM notes WHERE trashed = 1 ORDER BY updatedAt DESC`)
      .all()
      .map(deserializeContent)
  },

  insertNote: (note: Note) => {
    db.prepare(
      `
      INSERT INTO notes (id, title, type, content, createdAt, updatedAt, trashed)
      VALUES (@id, @title, @type, @content, @createdAt, @updatedAt, @trashed)
    `
    ).run({
      ...note,
      content: serializeContent(note),
      trashed: note.trashed ? 1 : 0
    })
  },

  updateNote: (id: string, fields: Partial<Omit<Note, 'id'>>) => {
    // Get the current note to determine type for content serialization
    const currentNote = db.prepare(`SELECT type FROM notes WHERE id = ?`).get(id) as { type: string } | undefined
    
    const preparedFields = {
      ...fields,
      ...(fields.content !== undefined && {
        content: currentNote ? serializeContent({ ...fields, type: currentNote.type } as Note) : JSON.stringify(fields.content)
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
