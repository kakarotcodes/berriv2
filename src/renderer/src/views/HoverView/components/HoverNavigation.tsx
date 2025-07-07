// dependencies
import React from 'react'

// assets
import GoogleCalendar from '@/assets/pill-icons/calendar.svg?react'
import Gmail from '@/assets/pill-icons/gmail.svg?react'
import ClipBoardHistory from '@/assets/pill-icons/clipboard.svg?react'
// import GoogleMeet from '@/assets/pill-icons/meet.svg?react'
import Notes from '@/assets/pill-icons/notes.svg?react'
// import Snipping from '@/assets/pill-icons/snipping.svg?react'
// import Record from '@/assets/pill-icons/record.svg?react'
import CameraFolder from '@/assets/pill-icons/camera-folder.svg?react'

// controller
import { useViewController } from '@/controller'
import { Feature } from '@/controller/viewController'
import HoverNavigationButton from './HoverNavigationButton'

const Navigation: React.FC = () => {
  const { setActiveFeature } = useViewController()

  const handleFeatureClick = (feature: Feature) => {
    setActiveFeature(feature)
  }

  return (
    <div className="w-full flex items-center justify-center">
      <nav className="frosted-glass-navbar flex items-center gap-x-6 py-2 px-4 rounded-[100px]">
        <HoverNavigationButton
          featureKey="mail"
          onClick={() => handleFeatureClick('mail')}
          icon={<Gmail className="w-6 h-6" />}
        />

        <HoverNavigationButton
          featureKey="calendar"
          onClick={() => handleFeatureClick('calendar')}
          icon={<GoogleCalendar className="w-6 h-6" />}
        />

        <HoverNavigationButton
          featureKey="notes"
          onClick={() => handleFeatureClick('notes')}
          icon={<Notes className="w-6.5 h-6.5" />}
        />

        <HoverNavigationButton
          featureKey="clipboard"
          onClick={() => handleFeatureClick('clipboard')}
          icon={<ClipBoardHistory className="w-6.5 h-6.5" />}
        />

        <HoverNavigationButton
          featureKey="screenshots"
          onClick={() => handleFeatureClick('screenshots')}
          icon={<CameraFolder className="w-6.5 h-6.5" />}
        />
      </nav>
    </div>
  )
}

export default Navigation
