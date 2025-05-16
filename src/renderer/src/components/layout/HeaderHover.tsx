// dependencies
import React, { useCallback, useRef } from 'react'

// components
import ResizeControls from './ResizeControls'

// types
import { Switch } from '../ui'
import { useViewStore } from '@/globalStore'

interface HeaderHoverProps {
  LEAVE_DELAY: number
}

const Header: React.FC<HeaderHoverProps> = ({ LEAVE_DELAY }) => {
  const { setView, isPinned, togglePin } = useViewStore()
  const leaveTimerRef = useRef<number | null>(null)
  const isMouseInsideRef = useRef<boolean>(true)

  // Handle toggle with additional logic for mouse leaving
  const handleTogglePin = useCallback(() => {
    // Store current pin state before toggling
    const wasPinned = isPinned

    // Toggle pin state in store
    togglePin()

    // If we're unpinning (was pinned but now it's not) AND the mouse is outside,
    // start the timer to close the hover view
    if (wasPinned && !isMouseInsideRef.current) {
      leaveTimerRef.current = window.setTimeout(() => {
        setView('pill').catch(console.error)
      }, LEAVE_DELAY)
    }
  }, [isPinned, togglePin, setView])

  return (
    <div
      className="relative flex items-center justify-center py-3 bg-white/10 cursor-grab select-none"
      id="hover-header"
    >
      <div className="absolute left-2 top-2">
        <ResizeControls />
      </div>
      {/* Top-right toggle */}
      <div className="absolute top-1.5 right-2.5 flex flex-col gap-3 flex-grow curs">
        <div className="flex items-center gap-2 text-white cursor-pointer">
          <p className="text-[8px] font-bold flex items-center">Keep open</p>
          <Switch checked={isPinned} onChange={handleTogglePin} size="small" />
        </div>
      </div>

      {/* header drag handle */}
      <div className="h-1 w-4/12 bg-white/40 rounded-full" />
    </div>
  )
}

export default Header
