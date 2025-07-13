import React, { useState } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { RefreshCwIcon, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { CalendarAuthorized, CalendarRestricted } from '../components'

const CalendarViewHover: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [isRequesting, setIsRequesting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentMonth, setCurrentMonth] = useState('July 2024')

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

  if (authLoading) {
    return (
      <div className="p-6 bg-gray-100 min-h-[400px] rounded-2xl">
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
      <CalendarRestricted
        onRequestPermissions={handleRequestCalendarPermissions}
        isRequesting={isRequesting}
        error={error}
      />
    )
  }

  return (
    <div className="w-full h-full flex flex-col flex-grow min-h-0">
      <div
        id="calendar-view-hover-header"
        className="w-full bg-black/40 px-4 h-14 flex items-center"
      >
        {/* Left side - Search Bar */}
        <div className="w-1/3 flex items-center">
          <div className="w-full relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Right side - Month Selector and Refresh */}
        <div className="w-2/3 flex items-center justify-between">
          <div className="flex items-center gap-x-2">
            <button
              className="p-1 text-gray-400 hover:text-white rounded transition-colors"
              title="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 py-1 text-sm font-medium text-white bg-white/10 rounded border border-white/20">
              {currentMonth}
            </div>
            <button
              className="p-1 text-gray-400 hover:text-white rounded transition-colors"
              title="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <button
            className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
            title="Refresh events"
          >
            <RefreshCwIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="flex-1 min-h-0">
        <CalendarAuthorized searchQuery={searchQuery} />
      </div>
    </div>
  )
}

export default CalendarViewHover
