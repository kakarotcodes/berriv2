import React from 'react'
import MailList from './MailList'
import MailHeader from './MailHeader'

const MailAuthorized: React.FC = () => {
  return (
    <div className="h-full w-full overflow-hidden flex flex-col">
      <MailHeader />
      <div className="flex-1 min-h-0 overflow-hidden">
        <MailList />
      </div>
    </div>
  )
}

export default MailAuthorized
