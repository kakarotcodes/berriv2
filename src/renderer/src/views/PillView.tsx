/* eslint-disable @typescript-eslint/explicit-function-return-type */
// views/PillView.tsx
import { useState, useEffect } from 'react'
import { LayoutGrid, ClipboardPen, History, Video, CalendarDays } from 'lucide-react'

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
  const { dimensions, setView, targetView, isTransitioning } = useViewStore()
  const { setActiveFeature } = useViewController()
  const [isTransitioningToDefault, setIsTransitioningToDefault] = useState(false)

  useIdleOpacity()
  useDragHandle(savePillPosition)
  usePillInit(savePillPosition, resizeWindow, dimensions)

  // Ensure proper window state when pill view mounts
  useEffect(() => {
    // Disable resizing and ensure pill dimensions
    setMainWindowResizable(false)
    resizeWindow({ width: WIDTH.PILL, height: HEIGHT.PILL })
  }, [setMainWindowResizable, resizeWindow])

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

  if (isTransitioningToDefault || (targetView === 'default' && isTransitioning)) {
    return <div className="w-full h-full bg-transparent flex items-center justify-center" />
  }

  return (
    <PillLayout>
      <FuturisticGradientDef />
      {/* <PillNotification count={99} onClick={() => setView('hover')} /> */}

      <PillButton
        onClick={switchToDefaultView}
        featureKey="default"
        icon={<LayoutGrid size={14} style={futuristicGradientStyle} />}
      />

      <PillButton
        onClick={() => {
          switchToHoverView('calendar')
        }}
        featureKey="calendar"
        icon={<CalendarDays size={15} style={futuristicGradientStyle} />}
      />

      <PillButton
        onClick={() => {
          switchToHoverView('clipboard')
        }}
        featureKey="clipboard"
        icon={<History size={15} style={futuristicGradientStyle} />}
        draggable
      />

      <PillButton
        onClick={() => {
          switchToHoverView('notes')
        }}
        featureKey="notes"
        icon={<ClipboardPen size={15} style={futuristicGradientStyle} />}
        draggable
      />

      <PillButton
        onClick={startGoogleMeet}
        featureKey="googleMeet"
        icon={<Video size={15} style={futuristicGradientStyle} />}
        draggable
      />
    </PillLayout>
  )
}

export default PillView
