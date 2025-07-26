import { create } from 'zustand'
import { MailItem, MailFilter, MailSettings, GmailFilterType, GMAIL_FILTERS, Draft } from '../types'

interface MailStore {
  // State
  mails: MailItem[]
  drafts: Draft[]
  filter: MailFilter
  gmailFilter: GmailFilterType
  searchQuery: string
  emailCache: Record<GmailFilterType, MailItem[]>
  cacheTimestamps: Record<GmailFilterType, number>
  filterCounts: Record<GmailFilterType, number>
  isLoadingCounts: boolean
  settings: MailSettings
  isLoading: boolean
  error: string | null
  selectedEmailIds: string[]

  // Actions
  setMails: (mails: MailItem[]) => void
  addMail: (mail: MailItem) => void
  updateMail: (id: string, updates: Partial<MailItem>) => void
  deleteMail: (id: string) => void
  setFilter: (filter: MailFilter) => void
  setGmailFilter: (filter: GmailFilterType) => void
  setSearchQuery: (query: string) => void
  updateCache: (filterType: GmailFilterType, emails: MailItem[]) => void
  getCachedEmails: (filterType: GmailFilterType) => MailItem[] | null
  clearCache: () => void
  setFilterCounts: (counts: Record<GmailFilterType, number>) => void
  setLoadingCounts: (loading: boolean) => void
  fetchFilterCounts: () => Promise<void>
  setSettings: (settings: MailSettings) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  toggleEmailSelection: (id: string) => void
  selectAllEmails: () => void
  clearSelection: () => void
  
  // Draft actions
  addDraft: (draft: Draft) => void
  updateDraft: (id: string, updates: Partial<Draft>) => void
  deleteDraft: (id: string) => void
  getDrafts: () => Draft[]
  loadDraftsFromStorage: () => void

  // Computed getters
  getFilteredMails: () => MailItem[]
  getUnreadCount: () => number
}

export const useMailStore = create<MailStore>((set, get) => ({
  // Initial state
  mails: [],
  drafts: [],
  filter: {},
  gmailFilter: 'PRIMARY',
  searchQuery: '',
  emailCache: {
    PRIMARY: [],
    ALL_INBOX: [],
    UNREAD: [],
    IMPORTANT: [],
    STARRED: [],
    PERSONAL: [],
    DRAFTS: []
  },
  cacheTimestamps: {
    PRIMARY: 0,
    ALL_INBOX: 0,
    UNREAD: 0,
    IMPORTANT: 0,
    STARRED: 0,
    PERSONAL: 0,
    DRAFTS: 0
  },
  filterCounts: {
    PRIMARY: 0,
    ALL_INBOX: 0,
    UNREAD: 0,
    IMPORTANT: 0,
    STARRED: 0,
    PERSONAL: 0,
    DRAFTS: 0
  },
  isLoadingCounts: false,
  settings: {
    autoRefresh: true,
    refreshInterval: 300000, // 5 minutes
    showNotifications: true
  },
  isLoading: false,
  error: null,
  selectedEmailIds: [],

  // Actions
  setMails: (mails) => set({ mails }),

  addMail: (mail) =>
    set((state) => ({
      mails: [mail, ...state.mails]
    })),

  updateMail: (id, updates) =>
    set((state) => ({
      mails: state.mails.map((mail) => (mail.id === id ? { ...mail, ...updates } : mail))
    })),

  deleteMail: (id) =>
    set((state) => ({
      mails: state.mails.filter((mail) => mail.id !== id)
    })),

  setFilter: (filter) => set({ filter }),
  setGmailFilter: (gmailFilter) => set({ gmailFilter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  
  updateCache: (filterType, emails) => set((state) => ({
    emailCache: {
      ...state.emailCache,
      [filterType]: emails
    },
    cacheTimestamps: {
      ...state.cacheTimestamps,
      [filterType]: Date.now()
    }
  })),
  
  getCachedEmails: (filterType) => {
    const { emailCache, cacheTimestamps } = get()
    const cacheAge = Date.now() - cacheTimestamps[filterType]
    const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
    
    if (cacheAge < CACHE_DURATION && emailCache[filterType].length > 0) {
      return emailCache[filterType]
    }
    return null
  },
  
  clearCache: () => set({
    emailCache: {
      PRIMARY: [],
      ALL_INBOX: [],
      UNREAD: [],
      IMPORTANT: [],
      STARRED: [],
      PERSONAL: [],
      DRAFTS: []
    },
    cacheTimestamps: {
      PRIMARY: 0,
      ALL_INBOX: 0,
      UNREAD: 0,
      IMPORTANT: 0,
      STARRED: 0,
      PERSONAL: 0,
      DRAFTS: 0
    }
  }),
  
  setFilterCounts: (filterCounts) => set({ filterCounts }),
  setLoadingCounts: (isLoadingCounts) => set({ isLoadingCounts }),

  fetchFilterCounts: async () => {
    set({ isLoadingCounts: true })

    try {
      const counts: Record<GmailFilterType, number> = {
        PRIMARY: 0,
        ALL_INBOX: 0,
        UNREAD: 0,
        IMPORTANT: 0,
        STARRED: 0,
        PERSONAL: 0,
        DRAFTS: 0
      }

      // Fetch counts for each filter
      for (const [filterType, query] of Object.entries(GMAIL_FILTERS)) {
        try {
          const result = await window.electronAPI.gmail.getEmails({
            maxResults: 1,
            query: query
          })

          if (result.success && result.emails) {
            counts[filterType as GmailFilterType] = result.emails.length
          }
        } catch (err) {
          console.error(`Failed to fetch count for ${filterType}:`, err)
        }
      }

      set({ filterCounts: counts })
    } catch (err) {
      console.error('Failed to fetch filter counts:', err)
    } finally {
      set({ isLoadingCounts: false })
    }
  },

  setSettings: (settings) => set({ settings }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  
  toggleEmailSelection: (id) =>
    set((state) => ({
      selectedEmailIds: state.selectedEmailIds.includes(id)
        ? state.selectedEmailIds.filter((emailId) => emailId !== id)
        : [...state.selectedEmailIds, id]
    })),
  
  selectAllEmails: () =>
    set((state) => ({
      selectedEmailIds: state.mails.map((mail) => mail.id)
    })),
  
  clearSelection: () => set({ selectedEmailIds: [] }),

  // Draft actions
  addDraft: (draft) =>
    set((state) => {
      const newDrafts = [draft, ...state.drafts]
      localStorage.setItem('emailDrafts', JSON.stringify(newDrafts))
      return { 
        drafts: newDrafts,
        filterCounts: {
          ...state.filterCounts,
          DRAFTS: newDrafts.length
        }
      }
    }),

  updateDraft: (id, updates) =>
    set((state) => {
      const newDrafts = state.drafts.map((draft) => 
        draft.id === id ? { ...draft, ...updates } : draft
      )
      localStorage.setItem('emailDrafts', JSON.stringify(newDrafts))
      return { drafts: newDrafts }
    }),

  deleteDraft: (id) =>
    set((state) => {
      const newDrafts = state.drafts.filter((draft) => draft.id !== id)
      localStorage.setItem('emailDrafts', JSON.stringify(newDrafts))
      return { 
        drafts: newDrafts,
        filterCounts: {
          ...state.filterCounts,
          DRAFTS: newDrafts.length
        }
      }
    }),

  getDrafts: () => {
    const { drafts } = get()
    return drafts
  },

  loadDraftsFromStorage: () => {
    try {
      const storedDrafts = localStorage.getItem('emailDrafts')
      if (storedDrafts) {
        const drafts = JSON.parse(storedDrafts)
        set((state) => ({ 
          drafts,
          filterCounts: {
            ...state.filterCounts,
            DRAFTS: drafts.length
          }
        }))
      }
    } catch (error) {
      console.error('Failed to load drafts from storage:', error)
    }
  },

  // Computed getters
  getFilteredMails: () => {
    const { mails, filter } = get()
    return mails.filter((mail) => {
      if (filter.isRead !== undefined && mail.isRead !== filter.isRead) return false
      if (filter.isStarred !== undefined && mail.isStarred !== filter.isStarred) return false
      if (filter.label && !mail.labels.includes(filter.label)) return false
      return true
    })
  },

  getUnreadCount: () => {
    const { mails } = get()
    return mails.filter((mail) => !mail.isRead).length
  }
}))
