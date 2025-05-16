// dependencies
import React from 'react'
import { ClipboardPen, History } from 'lucide-react'

// controller
import { useViewController } from '@/controller/viewController'

// components
import ResizeControls from './ResizeControls'

// types
import { SimpleIconComponent } from '../ui'
import ActionButton from './ActionButton'

const Header: React.FC = () => {
  const { setActiveFeature } = useViewController()

  // If we're already in hover view, we only need to set the feature, not change views
  const handleFeatureClick = (feature) => {
    setActiveFeature(feature)
  }

  return (
    <div className="relative flex items-center justify-center" id="header">
      <ResizeControls />
      <div className="flex items-center justify-center gap-4">
        <ActionButton
          featureKey="calendar"
          icon={<SimpleIconComponent slug="siGooglemeet" size={16} />}
          onClick={() => handleFeatureClick('calendar')}
        />
        <ActionButton
          featureKey="calendar"
          icon={<SimpleIconComponent slug="siGooglecalendar" size={16} />}
          onClick={() => handleFeatureClick('calendar')}
        />
        <ActionButton
          featureKey="clipboard"
          icon={<History size={16} color="white" />}
          onClick={() => handleFeatureClick('clipboard')}
        />
        <ActionButton
          featureKey="notes"
          icon={<ClipboardPen size={16} color="white" />}
          onClick={() => handleFeatureClick('notes')}
        />
      </div>
    </div>
  )
}

export default Header
