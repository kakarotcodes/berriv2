// views/PillView.tsx
import { useState, useEffect } from 'react'
// import { LayoutGrid, ClipboardPen, History, Video, CalendarDays } from 'lucide-react'
import {
  VideoCameraIcon,
  CalendarIcon,
  ClipboardDocumentIcon,
  ArrowsPointingOutIcon,
  PaperClipIcon,
  PencilSquareIcon,
  CameraIcon,
  ScissorsIcon,
  RectangleStackIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline'

// Hooks
import { useElectron } from '@/hooks/useElectron'
import { useIdleOpacity, useDragHandle, usePillInit } from './hooks'

// Store & Controller
import { useViewStore } from '@/globalStore'
import { useViewController } from '@/controller'

// Layouts & UI
import { PillLayout } from '@/layouts'
import { PillButton } from './components'
import { Feature } from '@/controller/viewController'

// Constants
import { WIDTH, HEIGHT } from '../../../constants/constants'

// Update gradient style to match hover view - using gradient URL instead of OKLCH
const futuristicGradientStyle = {
  stroke: 'url(#futuristicGradient)',
  fill: 'none',
  filter: 'drop-shadow(0 0 2px rgba(168, 85, 247, 0.4))',
  strokeWidth: 2.5
}

// Gradient definition component
const FuturisticGradientDef = () => (
  <svg width="0" height="0" style={{ position: 'absolute' }}>
    <defs>
      <linearGradient id="futuristicGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a855f7" />
        <stop offset="30%" stopColor="#c084fc" />
        <stop offset="60%" stopColor="#e879f9" />
        <stop offset="100%" stopColor="#f472b6" />
      </linearGradient>
    </defs>
  </svg>
)

const PillView: React.FC = () => {
  const { resizeWindow, savePillPosition, setMainWindowResizable } = useElectron()
  const { setView, targetView, isTransitioning, currentView } = useViewStore()
  const { setActiveFeature } = useViewController()
  const [isTransitioningToDefault, setIsTransitioningToDefault] = useState(false)

  useIdleOpacity()
  useDragHandle(savePillPosition)
  usePillInit()

  // Ensure proper window state when pill view mounts
  useEffect(() => {
    // Only resize to pill dimensions if we're actually in pill view
    if (currentView === 'pill') {
      setMainWindowResizable(false)
      resizeWindow({ width: WIDTH.PILL, height: HEIGHT.PILL })
    }
  }, [setMainWindowResizable, resizeWindow, currentView])

  const switchToDefaultView = async () => {
    savePillPosition()
    setIsTransitioningToDefault(true)
    setMainWindowResizable(false)
    try {
      await window.electronAPI.animateViewTransition('default')
      setTimeout(() => setView('default'), 150)
    } catch (error) {
      console.error('Transition error:', error)
      setIsTransitioningToDefault(false)
    }
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

  if (isTransitioningToDefault || (targetView === 'default' && isTransitioning)) {
    return <div className="w-full h-full bg-transparent flex items-center justify-center" />
  }

  const iconStyle = 'size-4 text-[#F4CDF1]'

  return (
    <PillLayout>
      {/* <FuturisticGradientDef /> */}
      {/* <PillNotification count={99} onClick={() => setView('hover')} /> */}

      <PillButton
        onClick={switchToDefaultView}
        featureKey="default"
        icon={<ArrowsPointingOutIcon className={iconStyle} />}
      />

      <PillButton
        onClick={() => {
          switchToHoverView('calendar')
        }}
        featureKey="calendar"
        icon={<CalendarIcon className={iconStyle} />}
      />

      <PillButton
        onClick={() => {
          switchToHoverView('clipboard')
        }}
        featureKey="clipboard"
        icon={<PaperClipIcon className={iconStyle} />}
        draggable
      />

      <PillButton
        onClick={() => {
          switchToHoverView('notes')
        }}
        featureKey="notes"
        icon={<PencilSquareIcon className={iconStyle} />}
        draggable
      />

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
