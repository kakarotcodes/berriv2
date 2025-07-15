import React, { useState, useCallback, CSSProperties } from 'react'
import {
  Calendar,
  Views,
  luxonLocalizer,
  DateLocalizer,
  SlotInfo,
  Event as RBCEvent
} from 'react-big-calendar'
import { DateTime } from 'luxon'
import 'react-big-calendar/lib/css/react-big-calendar.css'
// import '../styles/calendar.css' // ← add this import

const localizer: DateLocalizer = luxonLocalizer(DateTime)

/* ——— types ——— */
export interface CalendarEvent extends RBCEvent {
  id: string
  title: string
  start: Date
  end: Date
  description?: string
  location?: string
  htmlLink?: string
}
export interface CalendarGridProps {
  events?: CalendarEvent[]
  selectedDate?: DateTime
  onDateChange?: (date: DateTime) => void
  onEventSelect?: (event: CalendarEvent) => void
  onEventCreate?: (event: Partial<CalendarEvent>) => void
}

/* ——— component ——— */
const CalendarGrid: React.FC<CalendarGridProps> = ({
  events = [],
  selectedDate = DateTime.local(),
  onDateChange,
  onEventSelect,
  onEventCreate
}) => {
  const [view, setView] = useState(Views.MONTH)

  /* navigation / interactions */
  const handleNavigate = useCallback(
    (date: Date) => onDateChange?.(DateTime.fromJSDate(date)),
    [onDateChange]
  )
  const handleSelectEvent = useCallback((e: CalendarEvent) => onEventSelect?.(e), [onEventSelect])
  const handleSelectSlot = useCallback(
    ({ start, end }: SlotInfo) => onEventCreate?.({ title: 'New Event', start, end }),
    [onEventCreate]
  )

  /* day styling */
  const todayKey = DateTime.local().startOf('day').toJSDate().getTime()
  const dayPropGetter = (date: Date) => {
    const classes: string[] = []
    if (date.getTime() === todayKey) classes.push('rbc-today')
    if (date.getMonth() === selectedDate.month - 1) classes.push('rbc-in-range')
    else classes.push('rbc-off-range')
    return { className: classes.join(' ') }
  }

  /* event bar styling */
  const eventPropGetter = () => ({
    style: {
      background: '#0a84ff',
      borderRadius: 6,
      border: 'none',
      paddingInline: 4,
      fontSize: 14,
      lineHeight: '20px',
      fontWeight: 500,
      color: '#fff'
    } as CSSProperties
  })

  return (
    <div className="h-full calendar-grid-container">
      <Calendar
        localizer={localizer}
        events={events}
        date={selectedDate.toJSDate()}
        view={view}
        views={{ month: true }}
        onView={setView}
        toolbar={false}
        startAccessor="start"
        endAccessor="end"
        popup
        selectable
        onNavigate={handleNavigate}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        dayPropGetter={dayPropGetter}
        eventPropGetter={eventPropGetter}
        style={{ height: '100%', background: 'transparent', color: 'white' }}
      />
    </div>
  )
}

export default CalendarGrid
