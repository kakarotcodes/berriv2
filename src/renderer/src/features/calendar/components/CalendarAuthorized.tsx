import { Searchbar } from '@/components/shared'
import React, { useEffect } from 'react'
import { DateTime } from 'luxon'
import { useAuth } from '../../../hooks/useAuth'
import { CalendarEventsList, CalendarMonthSelector, CalendarGrid } from '.'
import { useCalendarStore } from '../store/calendarStore'

const CalendarAuthorizedNew: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  
  // Use calendar store
  const {
    gridEvents,
    listEvents,
    isLoadingListEvents,
    error,
    searchQuery,
    currentMonth,
    isCreating,
    setSearchQuery,
    setIsCreating,
    setError,
    fetchGridEvents,
    fetchListEvents,
    refreshEvents
  } = useCalendarStore()

  // Fetch calendar events when authenticated (INITIAL LOAD ONLY)
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      // Fetch both grid events for current month and list events (upcoming)
      fetchGridEvents(currentMonth)
      fetchListEvents()
    }
  }, [isAuthenticated, authLoading]) // Removed currentMonth, fetchGridEvents, fetchListEvents from deps

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
          onRefresh={fetchListEvents}
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
