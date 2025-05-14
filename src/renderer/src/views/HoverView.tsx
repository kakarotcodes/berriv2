// dependencies
import { memo, useCallback, useEffect, useRef } from 'react'
import { ClipboardPen } from 'lucide-react'

// components
import { SimpleIconComponent } from '@/components/ui'
import { Header } from '@/components/layout'
import { Divider } from '@/components/shared'

// store
import { useViewStore } from '@/globalStore'

const HoverView = memo(() => {
  const { setView } = useViewStore()
  const leaveTimerRef = useRef<number | null>(null)

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

  // Handle mouse leave - start timer to go back to pill view
  const handleMouseLeave = useCallback(() => {
    // Start timer to transition back to pill view
    leaveTimerRef.current = window.setTimeout(() => {
      setView('pill').catch(console.error)
    }, LEAVE_DELAY)
  }, [setView])

  // Cancel leave timer when mouse enters again
  const handleMouseEnter = useCallback(() => {
    if (leaveTimerRef.current !== null) {
      clearTimeout(leaveTimerRef.current)
      leaveTimerRef.current = null
    }
  }, [])

  return (
    <div className="w-full h-full" onMouseLeave={handleMouseLeave} onMouseEnter={handleMouseEnter}>
      <div className="rounded-lg px-4 py-2 h-full flex flex-col">
        <Header />
        <Divider height={20} />
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

        <div className="flex flex-col gap-3 flex-grow">
          <button
            className="hover:bg-white/40 transition-colors text-white py-2 px-4 rounded-lg"
            onClick={() => {
              setView('default').catch(console.error)
            }}
          >
            Go to Default View
          </button>
        </div>
      </div>
    </div>
  )
})

export default HoverView
