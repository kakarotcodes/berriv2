// dependencies
import React from 'react'

// layout
import { HoverLayout } from '@/layouts'

// controller
import { useViewController } from '@/controller'

// hover views
import ClipboardViewHover from '@/features/clipboard/views/ClipboardViewHover'
import NotesViewHover from '@/features/notes/views/NotesViewHover'

// Static component map to avoid any registration that might cause transitions
const ComponentMap = {
  clipboard: ClipboardViewHover,
  calendar: () => <div>Calendar View</div>,
  notes: NotesViewHover
}

const HoverView: React.FC = () => {
  const { activeFeature } = useViewController()

  // Use the feature key to determine what component to render
  // This approach avoids any complex mounting/unmounting logic that could cause transitions
  return (
    <HoverLayout>
      {activeFeature && ComponentMap[activeFeature] ? (
        React.createElement(ComponentMap[activeFeature])
      ) : (
        <div>No View Found</div>
      )}
    </HoverLayout>
  )
}

export default HoverView
