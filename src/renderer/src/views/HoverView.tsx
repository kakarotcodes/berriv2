// dependencies
import React from 'react'

// layout
import { HoverLayout } from '@/layouts'

// controller
import { useViewController } from '@/controller'

// Import components directly
import ClipboardHoverView from '@/features/clipboard/views/ClipboardHoverView'

// Static component map to avoid any registration that might cause transitions
const ComponentMap = {
  'clipboard': ClipboardHoverView,
  'calendar': () => <div>Calendar View</div>,
  'notes': () => <div>Notes View</div>
};

const HoverView: React.FC = () => {
  const { activeFeature } = useViewController()
  
  // Use the feature key to determine what component to render
  // This approach avoids any complex mounting/unmounting logic that could cause transitions
  return (
    <HoverLayout>
      {activeFeature && ComponentMap[activeFeature] 
        ? React.createElement(ComponentMap[activeFeature]) 
        : <div>No View Found</div>}
    </HoverLayout>
  )
}

export default HoverView
