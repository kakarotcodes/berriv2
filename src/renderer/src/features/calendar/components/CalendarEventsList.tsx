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
}

const CalendarEventsList: React.FC<CalendarEventsListProps> = ({
  events,
  isLoadingEvents,
  error,
  onRefresh
}) => {
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

  return (
    <div className="w-[200px] bg-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
        <button
          onClick={onRefresh}
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
          <div className="text-gray-500 text-sm text-center py-8">No upcoming events</div>
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
  )
}

export default CalendarEventsList