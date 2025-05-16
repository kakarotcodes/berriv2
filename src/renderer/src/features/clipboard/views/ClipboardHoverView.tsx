// dependencies
import React from 'react'

// components
import { ClipboardHistory, QuickNotes } from '../components'
import { Divider } from '@/components/shared'

const ClipBoardHoverView: React.FC = () => {
  return (
    <div>
      <section>
        <ClipboardHistory />
      </section>
      <Divider height={16} />
      <section>
        <QuickNotes />
      </section>
    </div>
  )
}

export default ClipBoardHoverView
