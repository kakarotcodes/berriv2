import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { CalendarIcon, ClockIcon, MapPinIcon, RefreshCwIcon, ExternalLinkIcon } from 'lucide-react'

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

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const isToday = date.toDateString() === today.toDateString()
    const isTomorrow = date.toDateString() === tomorrow.toDateString()
    
    if (isToday) return 'Today'
    if (isTomorrow) return 'Tomorrow'
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      weekday: 'short'
    })
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

  const isEventSoon = (startString: string) => {
    const start = new Date(startString)
    const now = new Date()
    const diffMinutes = (start.getTime() - now.getTime()) / (1000 * 60)
    return diffMinutes <= 30 && diffMinutes > 0
  }

  const openEventLink = (htmlLink?: string) => {
    if (htmlLink) {
      window.electronAPI.openExternal(htmlLink)
    }
  }

  if (authLoading) {
    return (
      <div className="calendar-hover-view p-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-[200px]">
        <div className="flex items-center justify-center h-32">
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
      <div className="calendar-hover-view p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <CalendarIcon className="w-8 h-8 text-blue-600" />
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Your Calendar</h3>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            Connect your Google Calendar to view upcoming events and get timely notifications.
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
    <div className="calendar-hover-view bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="p-4 border-b border-blue-100 bg-white/50 backdrop-blur-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
          </div>
          <button
            onClick={fetchCalendarEvents}
            disabled={isLoadingEvents}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="Refresh events"
          >
            <RefreshCwIcon className={`w-4 h-4 ${isLoadingEvents ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      <div className="p-4 max-h-80 overflow-y-auto">
        {isLoadingEvents ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-3 text-gray-600">
              <RefreshCwIcon className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Loading events...</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <CalendarIcon className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 font-medium">No upcoming events</p>
            <p className="text-xs text-gray-400 mt-1">Your schedule is clear for the next 7 days</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div 
                key={event.id} 
                className={`group relative bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
                  isEventSoon(event.start) ? 'ring-2 ring-orange-200 bg-orange-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => openEventLink(event.htmlLink)}
              >
                {isEventSoon(event.start) && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
                )}
                
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
                      <span className="font-medium">{formatEventDate(event.start)}</span>
                      <span>•</span>
                      <div className="flex items-center space-x-1">
                        <ClockIcon className="w-3 h-3" />
                        <span>{formatEventTime(event.start, event.end)}</span>
                      </div>
                    </div>
                    
                    <h4 className="font-medium text-gray-900 mb-1 truncate pr-2" title={event.title}>
                      {event.title}
                    </h4>
                    
                    {event.location && (
                      <div className="flex items-center space-x-1 text-xs text-gray-500 mb-1">
                        <MapPinIcon className="w-3 h-3" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                    
                    {event.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                        {event.description}
                      </p>
                    )}
                  </div>
                  
                  {event.htmlLink && (
                    <ExternalLinkIcon className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0 ml-2" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CalendarViewHover
