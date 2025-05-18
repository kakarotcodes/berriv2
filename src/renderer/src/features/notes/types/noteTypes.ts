export type NoteType = 'text'

export interface Note {
  id: string
  title: string
  type: NoteType
  content: string
  createdAt: string
  updatedAt: string
  pinned?: boolean
  trashed?: boolean
}
