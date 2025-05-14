// dependencies
import { memo, useCallback, useEffect, useRef } from 'react'
import { ClipboardPen, Pin } from 'lucide-react'

// components
import { SimpleIconComponent, Switch } from '@/components/ui'
import { Header } from '@/components/layout'
import { Divider } from '@/components/shared'

// store
import { useViewStore } from '@/globalStore'

const HoverView = memo(() => {
  const { setView, isPinned, togglePin } = useViewStore()
  const leaveTimerRef = useRef<number | null>(null)
  const isMouseInsideRef = useRef<boolean>(true)

  // Constant for leave delay
  const LEAVE_DELAY = 4000

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

  // Handle toggle with additional logic for mouse leaving
  const handleTogglePin = (checked: boolean) => {
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
  }

  return (
    <div
      className="relative w-full h-full px-4 py-2"
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
    >
      <Header />
      <Divider height={10} />

      <div className="flex items-center justify-between">
        <button className="hover:bg-white/40 transition-colors text-white rounded-full p-2">
          <SimpleIconComponent slug="siGooglemeet" size={16} />
        </button>
        <button className="hover:bg-white/40 transition-colors text-white rounded-full p-2">
          <SimpleIconComponent slug="siGooglecalendar" size={16} />
        </button>
        <button className="hover:bg-white/40 transition-colors text-white rounded-full p-2">
          <ClipboardPen size={16} color="white" />
        </button>
      </div>

      <div className="absolute top-3 right-2 flex flex-col gap-3 flex-grow">
        <div className="flex flex-col items-center gap-2 text-white">
          <Switch checked={isPinned} onChange={handleTogglePin} size="small" />
          <p className="text-[7px] flex items-center -mt-1">Keep open</p>
        </div>
      </div>
    </div>
  )
})

export default HoverView
