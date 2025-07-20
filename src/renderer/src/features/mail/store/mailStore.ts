import { create } from 'zustand'
import { MailItem, MailFilter, MailSettings, GmailFilterType } from '../types'

interface MailStore {
  // State
  mails: MailItem[]
  filter: MailFilter
  gmailFilter: GmailFilterType
  settings: MailSettings
  isLoading: boolean
  error: string | null
  
  // Actions
  setMails: (mails: MailItem[]) => void
  addMail: (mail: MailItem) => void
  updateMail: (id: string, updates: Partial<MailItem>) => void
  deleteMail: (id: string) => void
  setFilter: (filter: MailFilter) => void
  setGmailFilter: (filter: GmailFilterType) => void
  setSettings: (settings: MailSettings) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Computed getters
  getFilteredMails: () => MailItem[]
  getUnreadCount: () => number
}

export const useMailStore = create<MailStore>((set, get) => ({
  // Initial state
  mails: [],
  filter: {},
  gmailFilter: 'PRIMARY',
  settings: {
    autoRefresh: true,
    refreshInterval: 300000, // 5 minutes
    showNotifications: true
  },
  isLoading: false,
  error: null,
  
  // Actions
  setMails: (mails) => set({ mails }),
  
  addMail: (mail) => set((state) => ({ 
    mails: [mail, ...state.mails] 
  })),
  
  updateMail: (id, updates) => set((state) => ({
    mails: state.mails.map(mail => 
      mail.id === id ? { ...mail, ...updates } : mail
    )
  })),
  
  deleteMail: (id) => set((state) => ({
    mails: state.mails.filter(mail => mail.id !== id)
  })),
  
  setFilter: (filter) => set({ filter }),
  setGmailFilter: (gmailFilter) => set({ gmailFilter }),
  setSettings: (settings) => set({ settings }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  
  // Computed getters
  getFilteredMails: () => {
    const { mails, filter } = get()
    return mails.filter(mail => {
      if (filter.isRead !== undefined && mail.isRead !== filter.isRead) return false
      if (filter.isStarred !== undefined && mail.isStarred !== filter.isStarred) return false
      if (filter.label && !mail.labels.includes(filter.label)) return false
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase()
        return mail.subject.toLowerCase().includes(query) ||
               mail.sender.toLowerCase().includes(query) ||
               mail.body.toLowerCase().includes(query)
      }
      return true
    })
  },
  
  getUnreadCount: () => {
    const { mails } = get()
    return mails.filter(mail => !mail.isRead).length
  }
})) 