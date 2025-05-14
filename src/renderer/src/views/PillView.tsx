import { useEffect, useRef, useState } from 'react'
import { LayoutGrid, ClipboardPen } from 'lucide-react'

// Hooks
import { useElectron } from '@/hooks/useElectron'
import { useIdleOpacity } from '@/hooks/useIdleOpacity'

// store & controller
import { useViewStore } from '@/globalStore'
import { viewController } from '@/controller'

// layouts
import { PillLayout } from '@/layouts'

// components
import { SimpleIconComponent } from '@/components/ui'
import { PillButton, PillNotification } from './components'

const PillView: React.FC = () => {
  const { resizeWindow, savePillPosition } = useElectron()
  const { dimensions, setView, targetView, isTransitioning } = useViewStore()
  const rafIdRef = useRef<number | null>(null)
  const [isTransitioningToDefault, setIsTransitioningToDefault] = useState(false)

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

    // Attach event listeners
    handle.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)

    return () => {
      // Clean up all event listeners
      handle.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)

      // Clean up animation frame
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
    }
  }, [savePillPosition])

  // Clean up function for component unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
    }
  }, [])

  const switchToDefault = async () => {
    // Save the pill position before transitioning away
    savePillPosition()

    // Set local transition state immediately to prevent hover from triggering
    setIsTransitioningToDefault(true)

    try {
      // First start electron window resize
      await window.electronAPI.animateViewTransition('default')

      // Reduce the delay to match the animation time
      setTimeout(() => {
        setView('default')
      }, 250)
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
    <PillLayout>
      <PillNotification count={99} onClick={() => setView('hover')} />

      <PillButton
        onClick={switchToDefault}
        icon={<LayoutGrid color="white" size={14} strokeWidth={2} />}
      />

      <PillButton
        onClick={() => startGoogleMeet()}
        icon={<SimpleIconComponent slug="siGooglemeet" size={14} />}
        draggable
      />

      <PillButton icon={<SimpleIconComponent slug="siGooglecalendar" size={14} />} draggable />

      <PillButton
        onClick={() => {
          setActiveFeature('clipboard')
          setView('hover')
        }}
        icon={<ClipboardPen size={15} />}
        draggable
      />
    </PillLayout>
  )
}

export default PillView
