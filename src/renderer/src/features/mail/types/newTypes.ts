// New email types with attachment-first design

export interface EmailAttachment {
  filename: string
  mimeType: string
  size?: number
}

export interface NewMailItem {
  id: string
  subject: string
  sender: string
  recipient: string
  body: string
  timestamp: Date
  isRead: boolean
  isStarred: boolean
  labels: string[]
  attachments: EmailAttachment[]
}

export interface NewMailFilter {
  isRead?: boolean
  isStarred?: boolean
  hasAttachments?: boolean
  label?: string
  searchQuery?: string
}

export interface NewMailSettings {
  autoRefresh: boolean
  refreshInterval: number
  showNotifications: boolean
}