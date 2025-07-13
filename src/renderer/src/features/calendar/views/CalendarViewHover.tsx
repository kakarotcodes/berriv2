import React, { useState } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { RefreshCwIcon } from 'lucide-react'
import { CalendarAuthorized, CalendarRestricted } from '../components'

const CalendarViewHover: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [isRequesting, setIsRequesting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  return <CalendarAuthorized />
}

export default CalendarViewHover