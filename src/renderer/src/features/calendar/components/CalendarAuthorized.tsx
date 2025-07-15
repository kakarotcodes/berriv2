import { Searchbar } from '@/components/shared'
import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { CalendarEventsList, CalendarEventForm, CalendarDateSelector } from '.'

interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  description?: string
  location?: string
  htmlLink?: string
}

const CalendarAutorizedNew: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Form state
  const [eventType, setEventType] = useState<'event' | 'meeting'>('event')
  const [eventForm, setEventForm] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    description: '',
    location: '',
    attendees: ''
  })
  const [isCreating, setIsCreating] = useState(false)

  // Month navigation state

  // Fetch calendar events when authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchCalendarEvents()
    }
  }, [isAuthenticated, authLoading])

  const fetchCalendarEvents = async () => {
    setIsLoadingEvents(true)
    setError(null)

    try {
      const result = await window.electronAPI.calendar.getEvents({
        maxResults: 10,
        timeMin: new Date().toISOString(),
        timeMax: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Next 7 days
      })

      if (result.success) {
        setEvents(result.events || [])
      } else {
        setError(result.error || 'Failed to load calendar events')
      }
    } catch (err) {
      console.error('Error fetching calendar events:', err)
      setError('Failed to load calendar events')
    } finally {
      setIsLoadingEvents(false)
    }
  }

  const handleCreateEvent = async () => {
    if (!eventForm.title.trim()) return

    setIsCreating(true)
    setError(null)

    try {
      // Combine date and time for start/end
      const startDateTime = `${eventForm.date}T${eventForm.startTime}:00`
      const endDateTime = `${eventForm.date}T${eventForm.endTime}:00`

      // Prepare event data
      const eventData = {
        title: eventForm.title,
        start: startDateTime,
        end: endDateTime,
        description:
          eventType === 'meeting'
            ? `${eventForm.description ? eventForm.description + '\n\n' : ''}Meeting scheduled via Berri`
            : eventForm.description,
        location:
          eventType === 'meeting' && !eventForm.location
            ? 'Google Meet (link will be generated)'
            : eventForm.location,
        attendees: eventForm.attendees
          ? eventForm.attendees
              .split(',')
              .map((email) => email.trim())
              .filter((email) => email)
          : []
      }

      const result = await window.electronAPI.calendar.createEvent(eventData)

      if (result.success) {
        // Reset form after successful creation
        setEventForm({
          title: '',
          date: new Date().toISOString().split('T')[0],
          startTime: '09:00',
          endTime: '10:00',
          description: '',
          location: '',
          attendees: ''
        })

        // Refresh events list
        await fetchCalendarEvents()

        // Show success message
        console.log('Event created successfully:', result.event)
      } else {
        setError(result.error || 'Failed to create event')
      }
    } catch (err) {
      console.error('Error creating event:', err)
      setError('Failed to create event')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="w-full h-full flex">
      <div className="w-1/3 h-full flex flex-col">
        <div className="h-14 bg-black/40 px-4 flex items-center">
          <Searchbar />
        </div>
        <CalendarEventsList
          events={events}
          isLoadingEvents={isLoadingEvents}
          error={error}
          onRefresh={fetchCalendarEvents}
          searchQuery={searchQuery}
        />
      </div>
      <div className="w-2/3 h-full flex flex-col">
        <div className="h-14 bg-black/40 flex items-center">
          <CalendarDateSelector />
        </div>
        <div className="flex-1 p-4">
          <CalendarEventForm
            eventType={eventType}
            eventForm={eventForm}
            isCreating={isCreating}
            error={error}
            onEventTypeChange={setEventType}
            onFormChange={setEventForm}
            onCreateEvent={handleCreateEvent}
          />
        </div>
      </div>
    </div>
  )
}

export default CalendarAutorizedNew
