import React from 'react'
import { RefreshCwIcon, VideoIcon, EditIcon } from 'lucide-react'

interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  description?: string
  location?: string
  htmlLink?: string
}

interface CalendarEventsListProps {
  events: CalendarEvent[]
  isLoadingEvents: boolean
  error: string | null
  onRefresh: () => void
  searchQuery: string
}

const CalendarEventsList: React.FC<CalendarEventsListProps> = ({
  events,
  isLoadingEvents,
  error,
  onRefresh,
  searchQuery
}) => {
  // Use real events passed from parent component
  const realEvents = events

  // Filter events based on search query
  const filteredEvents =
    searchQuery && searchQuery.trim()
      ? realEvents.filter(
          (event) =>
            event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (event.description &&
              event.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (event.location && event.location.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      : realEvents

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

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })
    }
  }

  const isToday = (dateString: string) => {
    const eventDate = new Date(dateString).toDateString()
    const today = new Date().toDateString()
    return eventDate === today
  }

  const formatEventCardDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const isMeeting = (event: CalendarEvent) => {
    // Check if it's a meeting based on description containing "Meeting scheduled via Berri"
    // or location containing "Google Meet"
    return (
      event.description?.includes('Meeting scheduled via Berri') ||
      event.location?.includes('Google Meet') ||
      event.location?.includes('meet.google.com')
    )
  }

  const hasEventEnded = (event: CalendarEvent) => {
    const eventEndTime = new Date(event.end)
    const now = new Date()
    return eventEndTime < now
  }

  const cleanLocationText = (location?: string) => {
    if (!location) return ''
    // Remove the Google Meet default text
    return location.replace('Google Meet (link will be generated)', '').trim()
  }

  // Group events by date
  const groupedEvents = filteredEvents.reduce(
    (groups, event) => {
      const dateKey = formatEventDate(event.start)
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(event)
      return groups
    },
    {} as Record<string, CalendarEvent[]>
  )

  return (
    <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar px-4 py-5 border-r border-white/20">
      {isLoadingEvents ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCwIcon className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="text-red-400 text-sm">{error}</div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-gray-400 text-sm text-center py-8">
          {searchQuery && searchQuery.trim() ? 'No events found' : 'No upcoming events'}
        </div>
      ) : (
        Object.entries(groupedEvents).map(([dateKey, dateEvents]) => (
          <div key={dateKey} className="mb-8 last:mb-0">
            <div className="text-xs uppercase tracking-wider text-white px-1 mb-4">{dateKey}</div>
            <div className="flex flex-col">
              {dateEvents.map((event, idx) => (
                <div
                  key={event.id}
                  className={`bg-white/5 rounded-lg p-3 border border-white/10 relative ${idx < dateEvents.length - 1 ? 'mb-3' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-white text-sm mb-1">{event.title}</div>
                      <div className="text-xs text-gray-500 mb-0.5">
                        {formatEventCardDate(event.start)}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {formatEventTime(event.start, event.end)}
                      </div>
                      {cleanLocationText(event.location) && (
                        <div className="text-xs text-gray-500 mt-1">
                          {cleanLocationText(event.location)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      {isMeeting(event) && <VideoIcon className="w-4 h-4 text-gray-400" />}
                      {!hasEventEnded(event) && (
                        <EditIcon className="w-4 h-4 text-gray-400 hover:text-white cursor-pointer" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default CalendarEventsList
