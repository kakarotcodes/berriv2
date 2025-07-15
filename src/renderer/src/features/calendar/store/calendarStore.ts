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
  events: CalendarEvent[]
  isLoadingEvents: boolean
  error: string | null
  searchQuery: string
  currentMonth: Date
  isCreating: boolean

  // Actions
  setEvents: (events: CalendarEvent[]) => void
  setIsLoadingEvents: (loading: boolean) => void
  setError: (error: string | null) => void
  setSearchQuery: (query: string) => void
  setCurrentMonth: (date: Date) => void
  setIsCreating: (creating: boolean) => void

  // Complex actions
  fetchCalendarEvents: (targetMonth?: Date) => Promise<void>
  changeMonth: (newDate: Date) => Promise<void>
  refreshEvents: () => Promise<void>
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  // Initial state
  events: [],
  isLoadingEvents: false,
  error: null,
  searchQuery: '',
  currentMonth: new Date(),
  isCreating: false,

  // Simple setters
  setEvents: (events) => set({ events }),
  setIsLoadingEvents: (isLoadingEvents) => set({ isLoadingEvents }),
  setError: (error) => set({ error }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setCurrentMonth: (currentMonth) => set({ currentMonth }),
  setIsCreating: (isCreating) => set({ isCreating }),

  // Fetch calendar events for a specific month
  fetchCalendarEvents: async (targetMonth?: Date) => {
    const { currentMonth } = get()
    set({ isLoadingEvents: true, error: null })

    try {
      const monthToFetch = targetMonth || currentMonth

      // Get first day of the month
      const startOfMonth = new Date(monthToFetch.getFullYear(), monthToFetch.getMonth(), 1)

      // Get first day of next month
      const endOfMonth = new Date(monthToFetch.getFullYear(), monthToFetch.getMonth() + 1, 1)

      const result = await window.electronAPI.calendar.getEvents({
        maxResults: 100,
        timeMin: startOfMonth.toISOString(),
        timeMax: endOfMonth.toISOString()
      })

      if (result.success) {
        set({ events: result.events || [], isLoadingEvents: false })
      } else {
        set({
          error: result.error || 'Failed to load calendar events',
          isLoadingEvents: false
        })
      }
    } catch (err) {
      console.error('Error fetching calendar events:', err)
      set({
        error: 'Failed to load calendar events',
        isLoadingEvents: false
      })
    }
  },

  // Change month and fetch events
  changeMonth: async (newDate: Date) => {
    set({ currentMonth: newDate })
    await get().fetchCalendarEvents(newDate)
  },

  // Refresh current month events
  refreshEvents: async () => {
    const { currentMonth } = get()
    await get().fetchCalendarEvents(currentMonth)
  }
}))