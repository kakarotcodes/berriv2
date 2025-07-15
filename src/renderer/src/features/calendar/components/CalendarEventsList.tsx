import React from 'react'
import { RefreshCwIcon } from 'lucide-react'

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
                  className={`bg-white/5 rounded-lg p-3 border border-white/10 ${
                    idx < dateEvents.length - 1 ? 'mb-3' : ''
                  }`}
                >
                  <div className="font-medium text-white text-sm mb-1">{event.title}</div>
                  <div className="text-xs text-gray-400">
                    {formatEventTime(event.start, event.end)}
                  </div>
                  {event.location && (
                    <div className="text-xs text-gray-500 mt-1">{event.location}</div>
                  )}
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
