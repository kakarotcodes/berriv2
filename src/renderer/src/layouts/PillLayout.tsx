// dependencies
import React, { useEffect, useState } from 'react'
import { GripHorizontal } from 'lucide-react'

// types
type PillLayoutProps = {
  children: React.ReactNode
}

const PillLayout: React.FC<PillLayoutProps> = ({ children }) => {
  const [isIdle, setIsIdle] = useState(false)

  useEffect(() => {
    let idleTimer: NodeJS.Timeout | null = null

    const resetIdleTimer = () => {
      setIsIdle(false)
      if (idleTimer) {
        clearTimeout(idleTimer)
      }
      idleTimer = setTimeout(() => {
        setIsIdle(true)
      }, 7000) // Match the idle delay from useIdleOpacity
    }

    // Activity events that should reset the idle timer
    const activityEvents = ['mousemove', 'mousedown', 'wheel', 'keydown', 'touchstart']

    activityEvents.forEach((eventType) => {
      document.addEventListener(eventType, resetIdleTimer)
    })

    document.body.addEventListener('mouseenter', resetIdleTimer)

    // Initialize
    resetIdleTimer()

    return () => {
      activityEvents.forEach((eventType) => {
        document.removeEventListener(eventType, resetIdleTimer)
      })
      document.body.removeEventListener('mouseenter', resetIdleTimer)
      if (idleTimer) {
        clearTimeout(idleTimer)
      }
    }
  }, [])

  return (
    <div
      id="pill-container"
      className={`w-full h-full text-white animated-gradient flex flex-col hardware-accelerated rounded-lg overflow-hidden transition-opacity duration-1000 ${
        isIdle 
          ? 'border-2 border-gray-600' 
          : 'animated-border animated-glow'
      }`}
    >
      <div id="drag-handle" className="flex items-center justify-center pt-1">
        <GripHorizontal size={12} />
      </div>
      {children}
    </div>
  )
}

export default PillLayout
