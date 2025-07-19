// dependencies
import React from 'react'

// hooks
import { useAuth } from '../../../hooks/useAuth'

// components
import { MailAuthorized, MailList, MailRestricted } from '../components'

const MailViewHover: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  if (authLoading) {
    return (
      <div className="h-full w-full overflow-hidden ">
        <div className="flex items-center justify-center h-full">
          <div className="flex items-center space-x-3 text-white">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            <span className="text-sm font-medium">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <MailRestricted />
  }

  return (
    <div className="h-full w-full overflow-hidden ">
      <MailAuthorized />
      {/* <div className="p-4 h-full">
        <MailList />
      </div> */}
    </div>
  )
}

export default MailViewHover
