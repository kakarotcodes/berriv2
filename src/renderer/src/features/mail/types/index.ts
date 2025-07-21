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
  hasAttachments?: boolean
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

// Gmail filter types
export const GMAIL_FILTERS = {
  PRIMARY: 'category:primary',
  ALL_INBOX: 'in:inbox',
  UNREAD: 'in:inbox is:unread',
  IMPORTANT: 'in:inbox is:important',
  STARRED: 'in:inbox is:starred',
  PERSONAL:
    'category:primary -from:noreply -from:no-reply -from:newsletter -from:donotreply -from:notifications -subject:unsubscribe'
} as const

export type GmailFilterType = keyof typeof GMAIL_FILTERS

export const FILTER_LABELS: Record<GmailFilterType, string> = {
  PRIMARY: 'Primary',
  ALL_INBOX: 'All Inbox',
  UNREAD: 'Unread',
  IMPORTANT: 'Important',
  STARRED: 'Starred',
  PERSONAL: 'Personal'
} 