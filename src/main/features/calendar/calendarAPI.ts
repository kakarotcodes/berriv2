import { google } from 'googleapis'

interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  description?: string
  location?: string
  htmlLink?: string
}

interface CalendarAPIResponse {
  success: boolean
  events?: CalendarEvent[]
  error?: string
}

interface CreateEventResponse {
  success: boolean
  event?: {
    id: string
    title: string
    start: string
    end: string
    htmlLink?: string
  }
  error?: string
}

interface GetEventsOptions {
  timeMin?: string
  timeMax?: string
  maxResults?: number
}

interface CreateEventOptions {
  title: string
  start: string
  end: string
  description?: string
  location?: string
  attendees?: string[]
}

export class CalendarAPI {
  private oauth2Client: any

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )
  }

  private setCredentials(accessToken: string, refreshToken?: string): void {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    })
  }

  async getEvents(accessToken: string, refreshToken?: string, options: GetEventsOptions = {}): Promise<CalendarAPIResponse> {
    try {
      this.setCredentials(accessToken, refreshToken)

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })

      const {
        timeMin = new Date().toISOString(),
        timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        maxResults = 10
      } = options

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin,
        timeMax,
        maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      })

      const events: CalendarEvent[] = response.data.items?.map((event: any) => ({
        id: event.id || '',
        title: event.summary || 'No Title',
        start: event.start?.dateTime || event.start?.date || '',
        end: event.end?.dateTime || event.end?.date || '',
        description: event.description || '',
        location: event.location || '',
        htmlLink: event.htmlLink || ''
      })) || []

      return {
        success: true,
        events
      }
    } catch (error) {
      console.error('Calendar API error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch calendar events'
      }
    }
  }

  async createEvent(accessToken: string, eventData: CreateEventOptions, refreshToken?: string): Promise<CreateEventResponse> {
    try {
      this.setCredentials(accessToken, refreshToken)

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })

      const eventResource = {
        summary: eventData.title,
        start: {
          dateTime: eventData.start,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: eventData.end,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        description: eventData.description || '',
        location: eventData.location || '',
        attendees: eventData.attendees?.map(email => ({ email })) || [],
      }

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: eventResource,
      })

      const createdEvent = response.data

      return {
        success: true,
        event: {
          id: createdEvent.id || '',
          title: createdEvent.summary || '',
          start: createdEvent.start?.dateTime || createdEvent.start?.date || '',
          end: createdEvent.end?.dateTime || createdEvent.end?.date || '',
          htmlLink: createdEvent.htmlLink || ''
        }
      }
    } catch (error) {
      console.error('Calendar create event error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create calendar event'
      }
    }
  }
}

export const calendarAPI = new CalendarAPI() 