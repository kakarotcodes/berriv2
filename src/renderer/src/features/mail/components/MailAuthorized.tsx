import React from 'react'
import MailList from './MailList'
import MailHeader from './MailHeader'

const MailAuthorized: React.FC = () => {
  return (
    <div className="h-full w-full overflow-hidden ">
      <MailHeader />
      <MailList />
    </div>
  )
}

export default MailAuthorized
