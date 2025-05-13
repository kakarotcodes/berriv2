import { useEffect, useRef } from 'react'

/**
 * React hook that manages window opacity based on user activity
 * 
 * @param activeAlpha - Opacity when user is active (default: 1)
 * @param idleAlpha - Opacity when user is idle (default: 0.3)
 * @param idleDelay - Time in ms before considering user idle (default: 5000)
 */
export function useIdleOpacity(activeAlpha = 1, idleAlpha = 0.5, idleDelay = 100000000) {
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Function to reset the idle timer
    const resetIdleTimer = () => {
      // Clear any existing timeout
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
        idleTimerRef.current = null
      }

      // Set to active opacity immediately if needed
      window.electronAPI.setPillOpacity(activeAlpha)

      // Start a new idle timer
      idleTimerRef.current = setTimeout(() => {
        window.electronAPI.setPillOpacity(idleAlpha)
      }, idleDelay)
    }

    // Activity events that should reset the idle timer
    const activityEvents = [
      'mousemove',
      'mousedown',
      'wheel',
      'keydown',
      'touchstart'
    ]

    // Add event listeners for all activity events
    activityEvents.forEach((eventType) => {
      document.addEventListener(eventType, resetIdleTimer)
    })

    // Special handling for mouseenter on body to ensure full opacity on return
    const handleMouseEnter = () => {
      window.electronAPI.setPillOpacity(activeAlpha)
      resetIdleTimer()
    }

    document.body.addEventListener('mouseenter', handleMouseEnter)

    // Initialize with active opacity and start the idle timer
    resetIdleTimer()

    // Clean up event listeners on unmount
    return () => {
      activityEvents.forEach((eventType) => {
        document.removeEventListener(eventType, resetIdleTimer)
      })
      document.body.removeEventListener('mouseenter', handleMouseEnter)

      // Clear any existing timeout
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
        idleTimerRef.current = null
      }
    }
  }, [activeAlpha, idleAlpha, idleDelay])
} 