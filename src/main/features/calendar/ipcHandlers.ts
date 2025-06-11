import { ipcMain } from 'electron'
import { calendarAPI } from './calendarAPI'

interface CalendarEventResponse {
  success: boolean
  events?: Array<{
    id: string
    title: string
    start: string
    end: string
    description?: string
    location?: string
    htmlLink?: string
  }>
  error?: string
}

export function registerCalendarHandlers(): void {
  // Handle getting calendar events
  ipcMain.handle('calendar:get-events', async (_event, options): Promise<CalendarEventResponse> => {
    console.log('[IPC] calendar:get-events handler called with options:', options)
    
    try {
      // Get the current auth tokens from global state
      const authTokens = (global as { authTokens?: { access: string; refresh?: string } }).authTokens
      
      if (!authTokens?.access) {
        return {
          success: false,
          error: 'No authentication tokens available. Please authenticate first.'
        }
      }

      console.log('[IPC] Fetching calendar events with tokens')
      const result = await calendarAPI.getEvents(authTokens.access, authTokens.refresh, options)
      
      console.log('[IPC] Calendar events fetched successfully:', result.events?.length || 0, 'events')
      return result
    } catch (error) {
      console.error('[IPC] Failed to get calendar events:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch calendar events'
      }
    }
  })

  console.log('[IPC] Calendar handlers registered')
} 