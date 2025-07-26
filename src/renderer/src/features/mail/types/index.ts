// Mail types - Clean interface matching Gmail UI
export interface MailItem {
  id: string
  threadId: string
  subject: string
  sender: string
  senderName: string
  recipient: string
  snippet: string
  timestamp: Date
  isRead: boolean
  isStarred: boolean
  isImportant: boolean
  labels: string[]
  hasAttachments: boolean
  attachments: MailAttachment[]
}

export interface MailAttachment {
  filename: string
  mimeType: string
  size: number
  attachmentId: string
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
    'category:primary -from:noreply -from:no-reply -from:newsletter -from:donotreply -from:notifications -subject:unsubscribe',
  DRAFTS: 'in:draft'
} as const

export type GmailFilterType = keyof typeof GMAIL_FILTERS

export const FILTER_LABELS: Record<GmailFilterType, string> = {
  PRIMARY: 'Primary',
  ALL_INBOX: 'All Inbox',
  UNREAD: 'Unread',
  IMPORTANT: 'Important',
  STARRED: 'Starred',
  PERSONAL: 'Personal',
  DRAFTS: 'Drafts'
}

// Draft interface for local drafts
export interface Draft {
  id: string
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  body: string
  timestamp: number
  isDraft: true
} 