import { useEffect, useRef, useState } from 'react'
import { useElectron } from '@/hooks/useElectron'
import { useViewStore } from '@/globalStore'

const PillView = () => {
  const { resizeWindow, savePillPosition } = useElectron()
  const { dimensions, setView, targetView, isTransitioning } = useViewStore()
  const rafIdRef = useRef<number | null>(null)
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null)
  const [isMouseOver, setIsMouseOver] = useState(false)
  const [isOverDragHandle, setIsOverDragHandle] = useState(false)
  const [isTransitioningToDefault, setIsTransitioningToDefault] = useState(false)
  // Faster hover delay for better UX
  const HOVER_DELAY = 250

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

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true
      lastY = e.clientY
      e.preventDefault()
      
      // Immediately add dragging classes for visual feedback
      handle.classList.add('active')
      document.body.classList.add('dragging')
      
      // Start the drag operation
      window.electronAPI.startVerticalDrag(e.clientY)
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      
      // Update the Y position immediately - remove the RAF throttling that was causing lag
      lastY = e.clientY
      window.electronAPI.updateVerticalDrag(lastY)
    }

    const onMouseUp = () => {
      if (!isDragging) return
      isDragging = false

      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }

      window.electronAPI.endVerticalDrag()
      handle.classList.remove('active')
      document.body.classList.remove('dragging')
      
      // Explicitly save position after drag ends
      savePillPosition()
    }

    handle.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)

    // Add specific event handlers for the drag handle
    const handleDragHandleEnter = () => {
      setIsOverDragHandle(true)
      // Clear any existing hover timeout when entering drag handle
      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current)
        hoverTimeout.current = null
      }
    }

    const handleDragHandleLeave = () => {
      setIsOverDragHandle(false)
    }

    handle.addEventListener('mouseenter', handleDragHandleEnter)
    handle.addEventListener('mouseleave', handleDragHandleLeave)

    return () => {
      handle.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      handle.removeEventListener('mouseenter', handleDragHandleEnter)
      handle.removeEventListener('mouseleave', handleDragHandleLeave)

      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [savePillPosition])

  useEffect(() => {
    const pill = document.getElementById('pill-container')
    if (!pill) return

    const onMouseEnter = () => {
      // Don't start hover timer if we're already transitioning to default
      if (isTransitioningToDefault) return
      
      setIsMouseOver(true)

      // Only start hover timer if we're not over the drag handle
      if (!isOverDragHandle) {
        if (hoverTimeout.current) {
          clearTimeout(hoverTimeout.current)
        }
        hoverTimeout.current = setTimeout(() => {
          // Double-check we're still not over the drag handle when the timer fires
          // and that we're not transitioning to default
          if (!isOverDragHandle && isMouseOver && !isTransitioningToDefault) {
            // Before transitioning to hover, save the pill position
            savePillPosition()
            setView('hover')
          }
        }, HOVER_DELAY)
      }
    }

    const onMouseLeave = () => {
      setIsMouseOver(false)
      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current)
        hoverTimeout.current = null
      }
    }

    const handleMouseMove = () => {
      // Don't restart hover timer if we're already transitioning to default
      if (isTransitioningToDefault) return
      
      // Only reset/restart the timer if we're over the pill but not over the drag handle
      if (isMouseOver && !isOverDragHandle) {
        if (hoverTimeout.current) {
          clearTimeout(hoverTimeout.current)
        }
        hoverTimeout.current = setTimeout(() => {
          // Double-check we're still not over the drag handle when the timer fires
          // and that we're not transitioning to default
          if (!isOverDragHandle && isMouseOver && !isTransitioningToDefault) {
            // Before transitioning to hover, save the pill position
            savePillPosition()
            setView('hover')
          }
        }, HOVER_DELAY)
      }
    }

    pill.addEventListener('mouseenter', onMouseEnter)
    pill.addEventListener('mouseleave', onMouseLeave)
    pill.addEventListener('mousemove', handleMouseMove)

    return () => {
      pill.removeEventListener('mouseenter', onMouseEnter)
      pill.removeEventListener('mouseleave', onMouseLeave)
      pill.removeEventListener('mousemove', handleMouseMove)

      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current)
        hoverTimeout.current = null
      }
    }
  }, [setView, isMouseOver, isOverDragHandle, HOVER_DELAY, isTransitioningToDefault, savePillPosition])

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
      }, 300)
    } catch (error) {
      console.error('Failed to transition to default view:', error)
      setIsTransitioningToDefault(false)
    }
  }

  // If we're transitioning to default, show loading state instead of pill
  if (isTransitioningToDefault || (targetView === 'default' && isTransitioning)) {
    return (
      <div className="w-full h-full bg-black/30 flex items-center justify-center">
        {/* Simple loading spinner */}
        <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div
      id="pill-container"
      className="w-full h-full bg-red-400 text-white flex justify-start items-center pl-2 gap-x-3"
    >
      <button
        onClick={switchToDefault}
        className="bg-green-500 rounded-full w-8 h-8 cursor-pointer"
      />
      <div
        className="w-8 h-full bg-blue-500 cursor-grab hover:bg-blue-600 flex items-center justify-center"
        id="drag-handle"
      >
        <span className="text-white select-none">⋮</span>
      </div>
    </div>
  )
}

export default PillView
