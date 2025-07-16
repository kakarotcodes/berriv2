import React, { useState, useCallback } from 'react'
import {
  Calendar,
  Views,
  luxonLocalizer,
  DateLocalizer,
  SlotInfo,
  Event as RBCEvent
} from 'react-big-calendar'
import { DateTime } from 'luxon'
import { useModal } from '@/hooks/useModal'
import ModalEventForm from './ModalEventForm'
import 'react-big-calendar/lib/css/react-big-calendar.css'

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
  onEventCreate?: (eventData: {
    title: string
    start: string
    end: string
    description: string
    location: string
    attendees: string[]
  }) => Promise<{ success: boolean; error?: string }>
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
  const { openModal } = useModal()

  /* navigation / interactions */
  const handleNavigate = useCallback(
    (date: Date) => onDateChange?.(DateTime.fromJSDate(date)),
    [onDateChange]
  )
  const handleSelectEvent = useCallback((e: CalendarEvent) => onEventSelect?.(e), [onEventSelect])
  const handleSelectSlot = useCallback(
    ({ start }: SlotInfo) => {
      // Open modal with the selected date
      openModal(
        <ModalEventForm
          selectedDate={start}
          onCreateEvent={
            onEventCreate || (async () => ({ success: false, error: 'No create handler' }))
          }
        />,
        {
          shouldCloseOnOverlayClick: true,
          shouldCloseOnEsc: true
        }
      )
    },
    [openModal, onEventCreate]
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
  const eventPropGetter = (event: CalendarEvent) => {
    // Check if it's a meeting
    const isMeeting =
      event.description?.includes('Meeting scheduled via Berri') ||
      event.location?.includes('Google Meet') ||
      event.location?.includes('meet.google.com')

    return {
      className: isMeeting ? 'meeting-event' : ''
    }
  }

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
        style={{ height: '375px', width: '100%', background: 'transparent', color: 'white' }}
      />
    </div>
  )
}

export default CalendarGrid
