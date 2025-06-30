// Mail types
export interface MailItem {
  id: string
  subject: string
  sender: string
  recipient: string
  body: string
  timestamp: Date
  isRead: boolean
  isStarred: boolean
  labels: string[]
}

export interface MailFilter {
  isRead?: boolean
  isStarred?: boolean
  label?: string
  searchQuery?: string
}

export interface MailSettings {
  autoRefresh: boolean
  refreshInterval: number
  showNotifications: boolean
} 