// dependencies
import React from 'react'

// layout
import { HoverLayout } from '@/layouts'

// controller
import { useViewController } from '@/controller'

// features
import { getFeatureById } from '@/features'

const HoverView: React.FC = () => {
  const { activeFeature } = useViewController()

  // Get the feature module by ID
  const feature = activeFeature ? getFeatureById(activeFeature) : null

  return (
    <HoverLayout>
      {feature ? (
        React.createElement(feature.component)
      ) : (
        <div>No View Found</div>
      )}
    </HoverLayout>
  )
}

export default HoverView
