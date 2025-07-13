import React from 'react'
import { CalendarIcon, RefreshCwIcon } from 'lucide-react'

interface CalendarRestrictedProps {
  onRequestPermissions: () => void
  isRequesting?: boolean
  error?: string | null
}

const CalendarRestricted: React.FC<CalendarRestrictedProps> = ({
  onRequestPermissions,
  isRequesting = false,
  error = null
}) => {
  return (
    <div className="p-6 rounded-2xl">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <CalendarIcon className="w-8 h-8 text-blue-600" />
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Your Calendar</h3>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          Connect your Google Calendar to view upcoming events and create new ones.
        </p>

        <button
          onClick={onRequestPermissions}
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

export default CalendarRestricted
