import { useEffect, useRef, useState } from 'react'
import { LayoutGrid, GripHorizontal, ClipboardPen } from 'lucide-react'

// Hooks
import { useElectron } from '@/hooks/useElectron'
import { useIdleOpacity } from '@/hooks/useIdleOpacity'

// store
import { useViewStore } from '@/globalStore'
import { viewController } from '@/controller'

// components
import { SimpleIconComponent } from '@/components/ui'

const PillView = () => {
  const { resizeWindow, savePillPosition } = useElectron()
  const { dimensions, setView, targetView, isTransitioning } = useViewStore()
  const rafIdRef = useRef<number | null>(null)
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null)
  const [isOverHoverHandle, setIsOverHoverHandle] = useState(false)
  const [isTransitioningToDefault, setIsTransitioningToDefault] = useState(false)
  // Very short delay for hover feedback
  const HOVER_FEEDBACK_DELAY = 250

  // controller
  const { setActiveFeature } = viewController()

  // Use the idle opacity hook with default settings
  useIdleOpacity()

  // When pill view mounts, ensure we have a valid position
  useEffect(() => {
    // Save position of pill on mount to ensure we have a valid position
    // Reduced delay for faster initial positioning
    setTimeout(() => {
      savePillPosition()
    }, 100)
  }, [savePillPosition])

  useEffect(() => {
    try {
      resizeWindow(dimensions)
    } catch (error) {
      console.error('Error resizing window:', error)
    }
  }, [dimensions, resizeWindow])

  useEffect(() => {
    const handle = document.getElementById('drag-handle')
    if (!handle) return

    let isDragging = false
    let lastY = 0
    let isAnimating = false

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true
      lastY = e.clientY
      e.preventDefault()

      // Immediately add dragging classes for visual feedback
      handle.classList.add('active')
      document.body.classList.add('dragging')

      // Start the drag operation
      window.electronAPI.startVerticalDrag(e.clientY)

      // Start animation loop only if not already running
      if (!isAnimating) {
        isAnimating = true
        requestAnimationFrame(animateDrag)
      }
    }

    // Handle mouse move events by just storing the position
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      // Just update the position - don't send IPC messages directly
      lastY = e.clientY
    }

    // Animation loop runs at the display's refresh rate
    const animateDrag = () => {
      if (isDragging) {
        // Send the update through IPC only in the animation frame
        window.electronAPI.updateVerticalDrag(lastY)
        // Schedule next frame
        rafIdRef.current = requestAnimationFrame(animateDrag)
      } else {
        isAnimating = false
      }
    }

    const onMouseUp = () => {
      if (!isDragging) return
      isDragging = false

      // Clean up animation frame
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }

      // End drag operation
      window.electronAPI.endVerticalDrag()
      handle.classList.remove('active')
      document.body.classList.remove('dragging')

      // Explicitly save position after drag ends
      savePillPosition()

      // Mark animation as stopped
      isAnimating = false
    }

    // Add specific event handlers for the drag handle
    const handleDragHandleEnter = () => {
      // Clear any existing hover timeout when entering drag handle
      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current)
        hoverTimeout.current = null
      }
    }

    // Attach event listeners
    handle.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    handle.addEventListener('mouseenter', handleDragHandleEnter)

    return () => {
      // Clean up all event listeners
      handle.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      handle.removeEventListener('mouseenter', handleDragHandleEnter)

      // Clean up animation frame
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
    }
  }, [savePillPosition])

  useEffect(() => {
    // Add event listeners for the hover handle
    const hoverHandle = document.getElementById('hover-handle')
    if (!hoverHandle) return

    const handleHoverHandleEnter = () => {
      setIsOverHoverHandle(true)

      // Use the hover feedback delay for transitioning to hover view
      if (!isTransitioningToDefault) {
        // Cancel any existing timeouts
        if (hoverTimeout.current) {
          clearTimeout(hoverTimeout.current)
          hoverTimeout.current = null
        }

        // Add the hover delay before transitioning
        hoverTimeout.current = setTimeout(() => {
          // Before transitioning to hover, save the pill position
          savePillPosition()
          setView('hover')
        }, HOVER_FEEDBACK_DELAY)
      }
    }

    const handleHoverHandleLeave = () => {
      setIsOverHoverHandle(false)
      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current)
        hoverTimeout.current = null
      }
    }

    // Using mouseenter/mouseleave for reliable hover detection
    hoverHandle.addEventListener('mouseenter', handleHoverHandleEnter)
    hoverHandle.addEventListener('mouseleave', handleHoverHandleLeave)

    // Also add mouseover/mouseout as a backup detection method
    hoverHandle.addEventListener('mouseover', handleHoverHandleEnter)
    hoverHandle.addEventListener('mouseout', handleHoverHandleLeave)

    // Add click handler as well for mobile/touch devices
    const handleClick = () => {
      savePillPosition()
      setView('hover')
    }

    hoverHandle.addEventListener('click', handleClick)

    return () => {
      hoverHandle.removeEventListener('mouseenter', handleHoverHandleEnter)
      hoverHandle.removeEventListener('mouseleave', handleHoverHandleLeave)
      hoverHandle.removeEventListener('mouseover', handleHoverHandleEnter)
      hoverHandle.removeEventListener('mouseout', handleHoverHandleLeave)
      hoverHandle.removeEventListener('click', handleClick)

      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current)
        hoverTimeout.current = null
      }
    }
  }, [setView, isOverHoverHandle, HOVER_FEEDBACK_DELAY, isTransitioningToDefault, savePillPosition])

  // Clean up function for component unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current)
        hoverTimeout.current = null
      }
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
    }
  }, [])

  const switchToDefault = async () => {
    // Immediately cancel any pending hover timeout
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current)
      hoverTimeout.current = null
    }

    // Save the pill position before transitioning away
    savePillPosition()

    // Set local transition state immediately to prevent hover from triggering
    setIsTransitioningToDefault(true)

    try {
      // First start electron window resize
      await window.electronAPI.animateViewTransition('default')

      // Wait for animation to be well underway before changing view
      // Increased from 250ms to 300ms to ensure the animation is further along
      setTimeout(() => {
        setView('default')
      }, 1000)
    } catch (error) {
      console.error('Failed to transition to default view:', error)
      setIsTransitioningToDefault(false)
    }
  }

  const startGoogleMeet = async () => {
    try {
      await window.electronAPI.startGoogleMeet()
    } catch (e) {
      console.error('Failed to start meeting:', e)
      alert('Failed to start meeting.')
    }
  }

  // If we're transitioning to default, show loading state instead of pill
  if (isTransitioningToDefault || (targetView === 'default' && isTransitioning)) {
    return (
      <div className="w-full h-full bg-[#00000000] flex items-center justify-center">
        {/* Simple loading spinner */}
        {/* <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div> */}
      </div>
    )
  }

  return (
    <div
      id="pill-container"
      className="w-full h-full text-white bg-gray-800 flex flex-col hardware-accelerated"
    >
      <div id="drag-handle" className="flex items-center justify-center pt-1">
        <GripHorizontal size={12} />
      </div>
      <div className="h-1" />
      <div
        className="flex-1 w-full px-1.5 flex items-center justify-center"
        onClick={() => setView('hover')}
      >
        <span
          style={{
            WebkitTextStroke: '0.1px black',
            color: 'white',
            cursor: 'pointer',
            transform: 'scale(1)',
            transition: 'transform 0.2s ease'
          }}
          className="bg-[#D92D20] rounded-full w-5 h-5 cursor-pointer text-[10px] font-extrabold flex items-center justify-center"
        >
          99
        </span>
      </div>
      <button
        onClick={switchToDefault}
        className="flex-1 w-full px-1 border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-600 transition-colors"
      >
        <LayoutGrid color="white" size={14} strokeWidth={2} />
      </button>
      <button
        onClick={startGoogleMeet}
        className="cursor-pointer flex-1 w-full border-gray-700 -pr-1 hover:bg-gray-500 flex items-center justify-center hardware-accelerated"
        id="drag-handle"
      >
        <SimpleIconComponent slug="siGooglemeet" size={14} />
      </button>
      <div
        className="cursor-pointer flex-1 w-full border-gray-700 -pr-1 hover:bg-gray-500 flex items-center justify-center hardware-accelerated"
        id="drag-handle"
      >
        <SimpleIconComponent slug="siGooglecalendar" size={14} />
      </div>
      <div
        onClick={() => {
          setActiveFeature('clipboard')
          setView('hover')
        }}
        className="cursor-pointer flex-1 w-full border-gray-700 -pr-1 hover:bg-gray-500 flex items-center justify-center hardware-accelerated"
        id="drag-handle"
      >
        <ClipboardPen size={15} />
      </div>
    </div>
  )
}

export default PillView
