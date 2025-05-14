// dependencies
import React from 'react'

// layout
import { HoverLayout } from '@/layouts'

// controller
import { viewController } from '@/controller'

// utils
import { hoverViewMap } from '@/utils/viewComponentRegistry'

const HoverView: React.FC = () => {
  const { activeFeature } = viewController()
  const DynamicComponent = activeFeature ? hoverViewMap[activeFeature] : null

  return (
    <HoverLayout>{DynamicComponent ? <DynamicComponent /> : <div>No View Found</div>}</HoverLayout>
  )
}

export default HoverView
