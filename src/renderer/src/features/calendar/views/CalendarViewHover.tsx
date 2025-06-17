import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { CalendarIcon, ClockIcon, UserPlusIcon, RefreshCwIcon, VideoIcon, MapPinIcon } from 'lucide-react'

interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  description?: string
  location?: string
  htmlLink?: string
}

const CalendarViewHover: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [isRequesting, setIsRequesting] = useState(false)
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

  const handleRequestCalendarPermissions = async () => {
    setIsRequesting(true)
    setError(null)
    
    try {
      const result = await window.electronAPI.auth.requestCalendarPermissions()
      
      if (!result.success) {
        setError(result.error || 'Failed to request calendar permissions')
      }
    } catch (err) {
      console.error('Error requesting calendar permissions:', err)
      setError('Failed to request calendar permissions')
    } finally {
      setIsRequesting(false)
    }
  }

  const formatEventTime = (startString: string, endString: string) => {
    const start = new Date(startString)
    const end = new Date(endString)
    
    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    }
    
    return `${formatTime(start)} - ${formatTime(end)}`
  }

  const isToday = (dateString: string) => {
    const eventDate = new Date(dateString).toDateString()
    const today = new Date().toDateString()
    return eventDate === today
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
        description: eventType === 'meeting' 
          ? `${eventForm.description ? eventForm.description + '\n\n' : ''}Meeting scheduled via Berri`
          : eventForm.description,
        location: eventType === 'meeting' && !eventForm.location
          ? 'Google Meet (link will be generated)'
          : eventForm.location,
        attendees: eventForm.attendees 
          ? eventForm.attendees.split(',').map(email => email.trim()).filter(email => email)
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

  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (authLoading) {
    return (
      <div className="calendar-hover-view p-6 bg-gray-100 min-h-[400px] rounded-2xl">
        <div className="flex items-center justify-center h-full">
          <div className="flex items-center space-x-3 text-gray-600">
            <RefreshCwIcon className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="calendar-hover-view p-6 bg-gray-100 rounded-2xl">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <CalendarIcon className="w-8 h-8 text-blue-600" />
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Your Calendar</h3>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            Connect your Google Calendar to view upcoming events and create new ones.
          </p>
          
          <button
            onClick={handleRequestCalendarPermissions}
            disabled={isRequesting}
            className="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors shadow-sm disabled:cursor-not-allowed"
          >
            {isRequesting ? (
              <>
                <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <CalendarIcon className="w-4 h-4 mr-2" />
                Connect Calendar
              </>
            )}
          </button>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="calendar-hover-view w-[550px] h-[450px]">
      <div className="flex h-full space-x-4">
        {/* Left Panel - Upcoming Events */}
        <div className="w-[200px] bg-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
            <button
              onClick={fetchCalendarEvents}
              disabled={isLoadingEvents}
              className="p-1 text-gray-500 hover:text-gray-700 rounded"
            >
              <RefreshCwIcon className={`w-4 h-4 ${isLoadingEvents ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[350px]">
            {isLoadingEvents ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCwIcon className="w-5 h-5 animate-spin text-gray-500" />
              </div>
            ) : error ? (
              <div className="text-red-600 text-sm">{error}</div>
            ) : events.length === 0 ? (
              <div className="text-gray-500 text-sm text-center py-8">
                No upcoming events
              </div>
            ) : (
              <>
                {isToday(events[0]?.start) && (
                  <div className="text-sm font-medium text-gray-700 mb-2">Today</div>
                )}
                {events.map((event) => (
                  <div key={event.id} className="space-y-1">
                    <div className="font-medium text-gray-900 text-sm">{event.title}</div>
                    <div className="text-xs text-gray-600">
                      {formatEventTime(event.start, event.end)}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Right Panel - Add Event/Schedule Meeting */}
        <div className="flex-1 bg-gray-200 rounded-xl p-4">
          {/* Event Type Selector */}
          <div className="flex mb-3 bg-gray-300 rounded-lg p-1">
            <button
              onClick={() => setEventType('event')}
              className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors ${
                eventType === 'event'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarIcon className="w-4 h-4 inline-block mr-2" />
              Add Event
            </button>
            <button
              onClick={() => setEventType('meeting')}
              className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors ${
                eventType === 'meeting'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <VideoIcon className="w-4 h-4 inline-block mr-2" />
              Schedule Meeting
            </button>
          </div>

          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            {eventType === 'event' ? 'Add Event' : 'Schedule Meeting'}
          </h2>
          
          <div className="space-y-3">
            {/* Date Field */}
            <div className="relative">
              <input
                type="date"
                value={eventForm.date}
                onChange={(e) => setEventForm({...eventForm, date: e.target.value})}
                className="w-full px-3 py-1.5 bg-gray-300 border-none rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <CalendarIcon className="absolute right-3 top-2 w-4 h-4 text-gray-600 pointer-events-none" />
            </div>

            {/* Time Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="time"
                  value={eventForm.startTime}
                  onChange={(e) => setEventForm({...eventForm, startTime: e.target.value})}
                  className="w-full px-3 py-1.5 bg-gray-300 border-none rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="text-xs text-gray-600 mt-1">Start time</div>
              </div>
              <div>
                <input
                  type="time"
                  value={eventForm.endTime}
                  onChange={(e) => setEventForm({...eventForm, endTime: e.target.value})}
                  className="w-full px-3 py-1.5 bg-gray-300 border-none rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="text-xs text-gray-600 mt-1">End time</div>
              </div>
            </div>

            {/* Event Title */}
            <input
              type="text"
              placeholder={eventType === 'event' ? 'Event title' : 'Meeting title'}
              value={eventForm.title}
              onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
              className="w-full px-3 py-1.5 bg-gray-300 border-none rounded-lg text-gray-900 text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Description (for meetings) */}
            {eventType === 'meeting' && (
              <textarea
                placeholder="Meeting agenda or description"
                value={eventForm.description}
                onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                className="w-full px-3 py-1.5 bg-gray-300 border-none rounded-lg text-gray-900 text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={2}
              />
            )}

            {/* Location */}
            <div className="relative">
              <input
                type="text"
                placeholder={eventType === 'meeting' ? 'Location (optional)' : 'Location'}
                value={eventForm.location}
                onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
                className="w-full px-3 py-1.5 bg-gray-300 border-none rounded-lg text-gray-900 text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <MapPinIcon className="absolute right-3 top-2 w-4 h-4 text-gray-600 pointer-events-none" />
            </div>

            {/* Add Guests */}
            <div>
              <input
                type="text"
                placeholder="Add guests (email addresses)"
                value={eventForm.attendees}
                onChange={(e) => setEventForm({...eventForm, attendees: e.target.value})}
                className="w-full px-3 py-1.5 bg-gray-300 border-none rounded-lg text-gray-900 text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex items-center space-x-2 text-gray-600 mt-1">
                <UserPlusIcon className="w-3 h-3" />
                <span className="text-xs">Separate multiple emails with commas</span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            {/* Create Button */}
            <button
              onClick={handleCreateEvent}
              disabled={!eventForm.title.trim() || isCreating}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {isCreating ? 'Creating...' : eventType === 'event' ? 'Create Event' : 'Schedule Meeting'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CalendarViewHover
