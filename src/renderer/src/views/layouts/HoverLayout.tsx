// components
import React, { useCallback, useEffect, useRef } from 'react'

// components
import { HeaderHover } from '@/components/layout'

// store
import { useViewStore } from '@/globalStore'
import HoverNavigation from '../HoverView/components/HoverNavigation'

type Props = {
  children: React.ReactNode
}

const HoverLayout: React.FC<Props> = ({ children }) => {
  const { setView, isPinned } = useViewStore()
  const leaveTimerRef = useRef<number | null>(null)
  const isMouseInsideRef = useRef<boolean>(true)

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

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden bg-yellow-900"
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
    >
      <HeaderHover LEAVE_DELAY={LEAVE_DELAY} />

      <div className="w-full h-full flex flex-col overflow-hidden flex-1">
        <HoverNavigation />
        {children}
      </div>
    </div>
  )
}

export default HoverLayout
