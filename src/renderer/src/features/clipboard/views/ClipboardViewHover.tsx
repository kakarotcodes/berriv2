// dependencies
import React from 'react'

// components
import { ClipboardHistory } from '../components'

const ClipBoardHoverView: React.FC = () => {
  return (
    <div className="h-full w-full overflow-hidden animated-gradient">
      <ClipboardHistory />
    </div>
  )
}

export default ClipBoardHoverView
