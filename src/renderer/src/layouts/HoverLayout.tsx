// components
import React, { useCallback, useEffect, useRef } from 'react'
import { Calendar, ClipboardPen, History } from 'lucide-react'

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

// Futuristic gradient style for icons
const futuristicGradientStyle = {
  stroke: 'url(#futuristicGradient)',
  filter: 'drop-shadow(0 0 2px rgba(168, 85, 247, 0.4))'
}

// components
import { HeaderHover } from '@/components/layout'

// store
import { useViewStore } from '@/globalStore'
import ActionButton from '@/components/layout/ActionButton'
import { SimpleIconComponent } from '@/components/ui'
import { useViewController } from '@/controller'

type Props = {
  children: React.ReactNode
}

const HoverLayout: React.FC<Props> = ({ children }) => {
  const { setView, isPinned } = useViewStore()
  const leaveTimerRef = useRef<number | null>(null)
  const isMouseInsideRef = useRef<boolean>(true)
  const { setActiveFeature } = useViewController()

  // Constant for leave delay
  const LEAVE_DELAY = 3000

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (leaveTimerRef.current !== null) {
        clearTimeout(leaveTimerRef.current)
      }
    }
  }, [])

  // Handle mouse leave - start timer to go back to pill view if not pinned
  const handleMouseLeave = useCallback(() => {
    isMouseInsideRef.current = false

    if (isPinned) return

    // Start timer to transition back to pill view
    leaveTimerRef.current = window.setTimeout(() => {
      setView('pill').catch(console.error)
    }, LEAVE_DELAY)
  }, [setView, isPinned])

  // Cancel leave timer when mouse enters again
  const handleMouseEnter = useCallback(() => {
    isMouseInsideRef.current = true

    if (leaveTimerRef.current !== null) {
      clearTimeout(leaveTimerRef.current)
      leaveTimerRef.current = null
    }
  }, [])

  // If we're already in hover view, we only need to set the feature, not change views
  const handleFeatureClick = (feature) => {
    setActiveFeature(feature)
  }

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden frosted-glass-base frosted-glass-hover"
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
    >
      <FuturisticGradientDef />
      <HeaderHover LEAVE_DELAY={LEAVE_DELAY} />

      <div className="px-4 py-2 flex flex-col flex-grow overflow-hidden">
        <div className="flex items-center justify-center gap-4 flex-shrink-0">
          <ActionButton
            featureKey="googleMeet"
            icon={<SimpleIconComponent slug="siGooglemeet" size={14} />}
            onClick={() => handleFeatureClick('googleMeet')}
          />
          <ActionButton
            featureKey="calendar"
            icon={<Calendar size={14} strokeWidth={2.5} style={futuristicGradientStyle} />}
            onClick={() => handleFeatureClick('calendar')}
          />
          <ActionButton
            featureKey="clipboard"
            icon={<History size={15} strokeWidth={2.5} style={futuristicGradientStyle} />}
            onClick={() => handleFeatureClick('clipboard')}
          />
          <ActionButton
            featureKey="notes"
            icon={<ClipboardPen size={15} strokeWidth={2.5} style={futuristicGradientStyle} />}
            onClick={() => handleFeatureClick('notes')}
          />
        </div>
        {/* Ensure children grow within constrained layout */}
        <div className="flex-1 min-h-0 w-full overflow-hidden py-3">{children}</div>
      </div>
    </div>
  )
}

export default HoverLayout
