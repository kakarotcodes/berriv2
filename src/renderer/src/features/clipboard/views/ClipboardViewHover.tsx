// dependencies
import React from 'react'

// components
import { ClipboardHistory } from '../components'
import { Divider } from '@/components/shared'

const ClipBoardHoverView: React.FC = () => {
  return (
    <div>
      <section>
        <ClipboardHistory />
      </section>
      <Divider height={16} />
    </div>
  )
}

export default ClipBoardHoverView
