export type NoteType = 'text' | 'checklist' | 'richtext'

export interface ChecklistItem {
  id: string
  text: string
  checked: boolean
}

export interface Note {
  id: string
  title: string
  type: NoteType
  content: string | ChecklistItem[]
  createdAt: string
  updatedAt: string
  pinned?: boolean
  trashed?: boolean
}
