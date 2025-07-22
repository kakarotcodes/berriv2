// dependencies
import React from 'react'

// utils
import { startGoogleMeet, openScreenCapture, openSnippingTool } from '@/utils/appActions'
import { Crop } from 'lucide-react'

// assets
import GoogleCalendar from '@/assets/pill-icons/calendar.svg?react'
import Gmail from '@/assets/pill-icons/gmail.svg?react'
import ClipBoardHistory from '@/assets/pill-icons/clipboard.svg?react'
import GoogleMeet from '@/assets/pill-icons/meet.svg?react'
import Notes from '@/assets/pill-icons/notes.svg?react'
import Snipping from '@/assets/pill-icons/snipping.svg?react'
import Record from '@/assets/pill-icons/record.svg?react'
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

  // Using imported common functions for consistency

  return (
    <div className="relative w-full flex items-center justify-center py-3">
      <div
        id="action-buttons"
        className="absolute left-3 frosted-glass-navbar flex items-center gap-x-6 py-2 px-4 rounded-[100px] max-[555px]:hidden"
      >
        <HoverNavigationButton
          featureKey="screen-capture"
          onClick={openScreenCapture}
          icon={<Record className="w-4.5 h-4.5" />}
        />
        <HoverNavigationButton
          featureKey="snipping"
          onClick={openSnippingTool}
          icon={<Snipping className="w-4.5 h-4.5 flex-shrink-0" />}
        />
        <HoverNavigationButton
          featureKey="meet"
          onClick={startGoogleMeet}
          icon={<GoogleMeet className="w-4.5 h-4.5" />}
        />
      </div>

      <div
        id="action-buttons-mobile"
        className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-gray-900 hidden items-center justify-center gap-x-4 px-3 py-2 rounded-[100px] max-[555px]:flex z-[9999]"
      >
        <HoverNavigationButton
          featureKey="screen-capture"
          onClick={openScreenCapture}
          icon={<Record className="w-4.5 h-4.5" />}
        />
        <HoverNavigationButton
          featureKey="snipping"
          onClick={openSnippingTool}
          icon={<Crop className="w-4.5 h-4.5" />}
        />
        <HoverNavigationButton
          featureKey="meet"
          onClick={startGoogleMeet}
          icon={<GoogleMeet className="w-4.5 h-4.5" />}
        />
      </div>

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

        {/* <div
          id="action-buttons"
          className="absolute left-3 frosted-glass-navbar flex items-center gap-x-6 py-2 px-4 rounded-[100px] max-[555px]:hidden"
        > 
        <div className="h-8 w-[0.5px] bg-white" />

        <HoverNavigationButton
          featureKey="screen-capture"
          onClick={openScreenCapture}
          icon={<Record className="w-6 h-6" />}
        />
        <HoverNavigationButton
          featureKey="snipping"
          onClick={openSnippingTool}
          icon={<Snipping className="w-6 h-6 flex-shrink-0" />}
        />
        <HoverNavigationButton
          featureKey="meet"
          onClick={startGoogleMeet}
          icon={<GoogleMeet className="w-6 h-6" />}
        />
        </div> */}
      </nav>
    </div>
  )
}

export default Navigation
