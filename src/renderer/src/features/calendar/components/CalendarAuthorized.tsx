import React, { useState, useEffect } from 'react'
import { CalendarEventsList, CalendarEventForm } from '.'

interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  description?: string
  location?: string
  htmlLink?: string
}

const CalendarAuthorized: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  // Fetch calendar events on component mount
  useEffect(() => {
    fetchCalendarEvents()
  }, [])

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
    <div className="w-[550px] h-[450px]">
      <div className="flex h-full space-x-4">
        <CalendarEventsList
          events={events}
          isLoadingEvents={isLoadingEvents}
          error={error}
          onRefresh={fetchCalendarEvents}
        />
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
  )
}

export default CalendarAuthorized
