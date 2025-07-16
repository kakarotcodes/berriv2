// dependencies
import React, { useState } from 'react'

// stores
import { useAuthStore } from '../../../globalStore/useAuthStore'

// components
import { CalendarRestricted, CalendarAuthorized } from '../components'

const CalendarViewHover: React.FC = () => {
  const { isAuthenticated } = useAuthStore()
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
