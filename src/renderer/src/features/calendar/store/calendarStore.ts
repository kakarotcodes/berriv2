import { create } from 'zustand'

export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  description?: string
  location?: string
  htmlLink?: string
}

interface CalendarState {
  // State
  gridEvents: CalendarEvent[] // Events for the calendar grid (specific month)
  listEvents: CalendarEvent[] // Events for the events list (upcoming only)
  isLoadingListEvents: boolean // Only for events list loading
  error: string | null
  searchQuery: string
  currentMonth: Date
  isCreating: boolean
  isInitialized: boolean // Track if calendar has been initialized
  lastListEventsFetch: number // Timestamp of last list events fetch

  // Actions
  setGridEvents: (events: CalendarEvent[]) => void
  setListEvents: (events: CalendarEvent[]) => void
  setIsLoadingListEvents: (loading: boolean) => void
  setError: (error: string | null) => void
  setSearchQuery: (query: string) => void
  setCurrentMonth: (date: Date) => void
  setIsCreating: (creating: boolean) => void
  setIsInitialized: (initialized: boolean) => void

  // Complex actions
  fetchGridEvents: (targetMonth: Date) => Promise<void>
  fetchListEvents: (force?: boolean) => Promise<void>
  changeMonth: (newDate: Date) => Promise<void>
  refreshEvents: () => Promise<void>
  initializeCalendar: () => Promise<void>
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  // Initial state
  gridEvents: [],
  listEvents: [],
  isLoadingListEvents: false,
  error: null,
  searchQuery: '',
  currentMonth: new Date(),
  isCreating: false,
  isInitialized: false,
  lastListEventsFetch: 0,

  // Simple setters
  setGridEvents: (gridEvents) => set({ gridEvents }),
  setListEvents: (listEvents) => set({ listEvents }),
  setIsLoadingListEvents: (isLoadingListEvents) => set({ isLoadingListEvents }),
  setError: (error) => set({ error }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setCurrentMonth: (currentMonth) => set({ currentMonth }),
  setIsCreating: (isCreating) => set({ isCreating }),
  setIsInitialized: (isInitialized) => set({ isInitialized }),

  // Fetch grid events for a specific month
  fetchGridEvents: async (targetMonth: Date) => {
    // Don't show loading for grid-only fetches during navigation
    set({ error: null })

    try {
      // Get first day of the month
      const startOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1)
      // Get first day of next month
      const endOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 1)

      const result = await window.electronAPI.calendar.getEvents({
        maxResults: 100,
        timeMin: startOfMonth.toISOString(),
        timeMax: endOfMonth.toISOString()
      })

      if (result.success) {
        set({ gridEvents: result.events || [] })
      } else {
        set({ error: result.error || 'Failed to load calendar events' })
      }
    } catch (err) {
      console.error('Error fetching grid events:', err)
      set({ error: 'Failed to load calendar events' })
    }
  },

  // Fetch upcoming events for the list (always from today onwards)
  fetchListEvents: async (force = false) => {
    const { lastListEventsFetch } = get()
    const now = Date.now()
    const fiveMinutes = 5 * 60 * 1000

    // Skip if we fetched recently and not forced
    if (!force && now - lastListEventsFetch < fiveMinutes) {
      return
    }

    set({ isLoadingListEvents: true, error: null })

    try {
      const currentTime = new Date()
      const threeMonthsAhead = new Date()
      threeMonthsAhead.setMonth(threeMonthsAhead.getMonth() + 3)

      const result = await window.electronAPI.calendar.getEvents({
        maxResults: 50,
        timeMin: currentTime.toISOString(),
        timeMax: threeMonthsAhead.toISOString()
      })

      if (result.success) {
        set({
          listEvents: result.events || [],
          isLoadingListEvents: false,
          lastListEventsFetch: now
        })
      } else {
        set({
          error: result.error || 'Failed to load upcoming events',
          isLoadingListEvents: false
        })
      }
    } catch (err) {
      console.error('Error fetching list events:', err)
      set({
        error: 'Failed to load upcoming events',
        isLoadingListEvents: false
      })
    }
  },

  // Change month and fetch grid events only
  changeMonth: async (newDate: Date) => {
    set({ currentMonth: newDate, gridEvents: [] }) // Clear grid events immediately
    await get().fetchGridEvents(newDate)
  },

  // Refresh both grid and list events (used after creating events)
  refreshEvents: async () => {
    const { currentMonth } = get()
    await Promise.all([get().fetchGridEvents(currentMonth), get().fetchListEvents(true)])
  },

  // Initialize calendar (called once when visiting calendar)
  initializeCalendar: async () => {
    const { isInitialized, currentMonth } = get()

    if (isInitialized) {
      // Already initialized, just refresh list events if needed
      await get().fetchListEvents()
      return
    }

    // First time initialization
    set({ isInitialized: true })
    await Promise.all([get().fetchGridEvents(currentMonth), get().fetchListEvents(true)])
  }
}))