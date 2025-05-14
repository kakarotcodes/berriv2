// dependencies
import { memo, useCallback, useEffect, useRef } from 'react'

// components
import { Switch } from '@/components/ui'
import { Header } from '@/components/layout'
import { Divider } from '@/components/shared'

// store
import { useViewStore } from '@/globalStore'
import { useViewController } from '@/controller/viewController'
import { hoverViewMap } from '@/utils/viewComponentRegistry'

const HoverView = memo(() => {
  const { setView, isPinned, togglePin } = useViewStore()
  const leaveTimerRef = useRef<number | null>(null)
  const isMouseInsideRef = useRef<boolean>(true)

  const { activeFeature } = useViewController()

  const RenderComponent = activeFeature ? hoverViewMap[activeFeature] : <div>No View Found</div>

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

  // Handle toggle with additional logic for mouse leaving
  const handleTogglePin = () => {
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
      <Divider height={14} />
      <div className="absolute top-3 right-2 flex flex-col gap-3 flex-grow">
        <div className="flex flex-col items-center gap-2 text-white">
          <Switch checked={isPinned} onChange={handleTogglePin} size="small" />
          <p className="text-[7px] flex items-center -mt-1.5">Keep open</p>
        </div>
      </div>
      <RenderComponent />

      {/* <div className="text-white">
        <p className="text-xs font-bold">Clipboard History</p>
        <Divider />
        <div className="w-full max-h-28 overflow-y-auto rounded-md border border-white/10 p-2">
          <div className="flex flex-col gap-y-2">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="w-full h-8 rounded-md flex-shrink-0 border border-white/20 flex flex-col justify-center px-2"
              >
                <p className="text-xs font-bold truncate">Clipboard {i + 1}</p>
              </div>
            ))}
          </div>
        </div>
      </div> */}
    </div>
  )
})

export default HoverView
