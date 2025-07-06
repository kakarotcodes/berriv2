// views/PillView.tsx
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  VideoCameraIcon,
  ArrowsPointingOutIcon,
  CameraIcon,
  ScissorsIcon,
  RectangleStackIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline'

import GoogleCalendar from '@/assets/pill-icons/calendar.svg?react'
import Gmail from '@/assets/pill-icons/gmail.svg?react'
import GoogleMeet from '@/assets/pill-icons/meet.svg?react'
import Notes from '@/assets/pill-icons/notes.svg?react'

// Hooks
import { useElectron } from '@/hooks/useElectron'
import { useIdleOpacity, useDragHandle, usePillInit } from '../hooks'

// Store & Controller
import { useViewStore } from '@/globalStore'
import { useViewController } from '@/controller'

// Layouts & UI
import { PillLayout } from '../layouts'
import { PillButton } from './components'
import { Feature } from '@/controller/viewController'

// Constants
import { WIDTH, HEIGHT } from '../../../../constants/constants'

const PillView: React.FC = () => {
  const { resizeWindow, savePillPosition, setMainWindowResizable } = useElectron()
  const { setView, targetView, isTransitioning, currentView } = useViewStore()
  const { setActiveFeature } = useViewController()
  const [isPillHovered, setIsPillHovered] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  // Hover timeout ref for debouncing
  const hoverTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const expandTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined) // New timeout for expansion delay
  const animationTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  useIdleOpacity()
  useDragHandle(savePillPosition)
  usePillInit()

  // Ensure proper window state when pill view mounts
  useEffect(() => {
    // Only resize to pill dimensions if we're actually in pill view
    if (currentView === 'pill') {
      setMainWindowResizable(false)
      setIsAnimating(true)
      resizeWindow({ width: WIDTH.PILL, height: HEIGHT.PILL_COLLAPSED }, 400)

      // Clear animation state after animation completes
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }
      animationTimeoutRef.current = setTimeout(() => {
        setIsAnimating(false)
      }, 400)
    }
  }, [setMainWindowResizable, resizeWindow, currentView])

  // Handle pill height based on hover state
  useEffect(() => {
    if (currentView === 'pill' && !isTransitioning) {
      const targetHeight = isPillHovered ? HEIGHT.PILL_EXPANDED : HEIGHT.PILL_COLLAPSED
      setIsAnimating(true)
      resizeWindow({ width: WIDTH.PILL, height: targetHeight }, 450) // Slightly longer for ultra-smooth expansion

      // Clear animation state after animation completes
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }
      animationTimeoutRef.current = setTimeout(() => {
        setIsAnimating(false)
      }, 450)
    }
  }, [isPillHovered, currentView, isTransitioning, resizeWindow])

  // Handle pill content hover (excludes drag handle) with debouncing for smoother animation
  const handleContentHover = useCallback(() => {
    // Clear any existing leave timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }

    // Clear any existing expand timeout
    if (expandTimeoutRef.current) {
      clearTimeout(expandTimeoutRef.current)
    }

    // Delay expansion by 200ms
    expandTimeoutRef.current = setTimeout(() => {
      setIsPillHovered(true)
    }, 200)
  }, [])

  const handleContentLeave = useCallback(() => {
    // Clear expansion timeout if we're leaving before it triggers
    if (expandTimeoutRef.current) {
      clearTimeout(expandTimeoutRef.current)
    }

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    // Minimal delay for immediate response while preventing flicker
    hoverTimeoutRef.current = setTimeout(() => {
      setIsPillHovered(false)
    }, 50) // Reduced to 50ms for more immediate response
  }, [])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
      if (expandTimeoutRef.current) {
        clearTimeout(expandTimeoutRef.current)
      }
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }
    }
  }, [])

  const switchToDefaultView = async () => {
    savePillPosition()
    setMainWindowResizable(false)
    setView('default')
  }

  const switchToHoverView = (view: Feature) => {
    setActiveFeature(view)
    setView('hover')
    setMainWindowResizable(true)
  }

  const startGoogleMeet = async () => {
    try {
      await window.electronAPI.startGoogleMeet()
    } catch (e) {
      console.error('Google Meet failed:', e)
      alert('Failed to start meeting.')
    }
  }

  const openScreenCapture = async () => {
    console.log('[SCREEN_CAPTURE] Camera button clicked')
    try {
      console.log('[SCREEN_CAPTURE] Calling electronAPI.screenCapture.openToolbar()')
      const result = await window.electronAPI.screenCapture.openToolbar()
      console.log('[SCREEN_CAPTURE] Result:', result)
      if (!result.success) {
        console.error('Screen capture failed:', result.error)
        alert('Failed to open screen capture toolbar.')
      } else {
        console.log('[SCREEN_CAPTURE] Screen capture toolbar opened successfully')
      }
    } catch (e) {
      console.error('Screen capture failed:', e)
      alert('Failed to open screen capture toolbar.')
    }
  }

  const openSnippingTool = async () => {
    console.log('[SNIPPING_TOOL] Scissors button clicked')
    try {
      console.log('[SNIPPING_TOOL] Calling electronAPI.screenCapture.openSnippingTool()')
      const result = await window.electronAPI.screenCapture.openSnippingTool()
      console.log('[SNIPPING_TOOL] Result:', result)
      if (!result.success) {
        console.error('Snipping tool failed:', result.error)
        alert('Failed to open snipping tool.')
      } else {
        console.log('[SNIPPING_TOOL] Snipping tool opened successfully')
      }
    } catch (e) {
      console.error('Snipping tool failed:', e)
      alert('Failed to open snipping tool.')
    }
  }

  if (targetView === 'default' && isTransitioning) {
    return <div className="w-full h-full bg-transparent flex items-center justify-center" />
  }

  const iconStyle = 'size-4 text-[#F4CDF1]'

  return (
    <PillLayout onContentHover={handleContentHover} onContentLeave={handleContentLeave}>
      <PillButton
        onClick={() => {
          switchToHoverView('notes')
        }}
        featureKey="notes"
        // icon={<ArrowsPointingOutIcon className={iconStyle} />}
        icon={<Notes className="w-5 h-5 hover:-scale-z-105 transition-all duration-300" />}
      />
      {/* <button className="w-full flex justify-center cursor-pointer">
        <Notes className="w-5 h-5 hover:scale-120 transition-all duration-300" />
      </button> */}

      {/* <PillButton
        onClick={() => {
          switchToHoverView('calendar')
        }}
        featureKey="calendar"
        icon={<CalendarIcon className={iconStyle} />}
      /> */}
      <button className="w-full flex justify-center cursor-pointer">
        <GoogleCalendar className="w-4.5 h-4.5 hover:scale-125 transition-all duration-300" />
      </button>

      <button className="w-full flex justify-center cursor-pointer">
        <Gmail className="w-4.5 h-4.5 hover:scale-125 transition-all duration-300" />
      </button>

      {/* <PillButton
        onClick={() => {
          switchToHoverView('clipboard')
        }}
        featureKey="clipboard"
        icon={<PaperClipIcon className={iconStyle} />}
        draggable
      /> */}

      <button className="w-full flex justify-center cursor-pointer">
        <GoogleMeet className="w-4.5 h-4.5 hover:scale-125 transition-all duration-300" />
      </button>
      {/* <PillButton
        onClick={() => {
          switchToHoverView('notes')
        }}
        featureKey="notes"
        icon={<PencilSquareIcon className={iconStyle} />}
        draggable
      /> */}

      <PillButton
        onClick={() => {
          switchToHoverView('screenshots')
        }}
        featureKey="screenshots"
        icon={<CameraIcon className={iconStyle} />}
        draggable
      />

      <PillButton
        onClick={startGoogleMeet}
        featureKey="googleMeet"
        icon={<VideoCameraIcon className={iconStyle} />}
        draggable
      />

      <PillButton
        onClick={openScreenCapture}
        featureKey="screenCapture"
        icon={<ScissorsIcon className={iconStyle} />}
        draggable
      />

      <PillButton
        onClick={openSnippingTool}
        featureKey="snippingTool"
        icon={<RectangleStackIcon className={iconStyle} />}
        draggable
      />

      <PillButton
        onClick={() => {
          switchToHoverView('mail')
        }}
        featureKey="mail"
        icon={<EnvelopeIcon className={iconStyle} />}
        draggable
      />
    </PillLayout>
  )
}

export default PillView
