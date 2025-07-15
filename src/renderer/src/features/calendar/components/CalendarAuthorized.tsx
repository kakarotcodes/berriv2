import { Searchbar } from '@/components/shared'
import React, { useEffect } from 'react'
import { DateTime } from 'luxon'
import { useAuthStore } from '../../../globalStore/useAuthStore'
import { CalendarEventsList, CalendarMonthSelector, CalendarGrid } from '.'
import { useCalendarStore } from '../store/calendarStore'

const CalendarAuthorizedNew: React.FC = () => {
  const { isAuthenticated } = useAuthStore()

  // Use calendar store
  const {
    gridEvents,
    listEvents,
    isLoadingListEvents,
    error,
    searchQuery,
    currentMonth,
    setSearchQuery,
    setIsCreating,
    setError,
    refreshEvents,
    initializeCalendar
  } = useCalendarStore()

  // Initialize calendar when authenticated (handles caching automatically)
  useEffect(() => {
    if (isAuthenticated) {
      initializeCalendar()
    }
  }, [isAuthenticated, initializeCalendar])

  return (
    <div className="w-full h-full flex overflow-hidden">
      <div className="w-1/3 h-full flex flex-col min-h-0">
        <div className="h-14 bg-black/40 px-4 flex items-center">
          <Searchbar
            placeholder="Search events"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <CalendarEventsList
          events={listEvents.filter((event) => new Date(event.end) >= new Date())} // Only upcoming events
          isLoadingEvents={isLoadingListEvents}
          error={error}
          onRefresh={() => useCalendarStore.getState().fetchListEvents(true)}
          searchQuery={searchQuery}
        />
      </div>
      <div className="w-2/3 h-full flex flex-col min-h-0">
        <div className="h-14 bg-black/40 flex items-center">
          <CalendarMonthSelector />
        </div>
        <div id="calendar-grid-container" className="h-[500px] overflow-hidden p-4 box-border">
          <CalendarGrid
            events={gridEvents.map((event) => ({
              // Events for the selected month
              ...event,
              start: new Date(event.start),
              end: new Date(event.end)
            }))}
            selectedDate={DateTime.fromJSDate(currentMonth)}
            onEventCreate={async (eventData) => {
              setIsCreating(true)
              setError(null)

              try {
                const result = await window.electronAPI.calendar.createEvent(eventData)

                if (result.success) {
                  // Refresh both grid and list events
                  await refreshEvents()
                  return { success: true }
                } else {
                  return { success: false, error: result.error || 'Failed to create event' }
                }
              } catch (err) {
                console.error('Error creating event:', err)
                return { success: false, error: 'Failed to create event' }
              } finally {
                setIsCreating(false)
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default CalendarAuthorizedNew
