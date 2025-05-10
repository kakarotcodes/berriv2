// views/PillView.tsx
import { memo, useEffect, useRef, useCallback } from 'react'
import { useElectron } from '@/hooks/useElectron'
import { useViewStore } from '@/globalStore'

const PillView = memo(() => {
  const { resizeWindow } = useElectron()
  const { dimensions, setView } = useViewStore()
  const rafIdRef = useRef<number | null>(null)
  
  // Refs for hover timers
  const hoverTimerRef = useRef<number | null>(null)
  const leaveTimerRef = useRef<number | null>(null)
  const isDraggingRef = useRef(false)

  // Hover delay in milliseconds
  const HOVER_DELAY = 500
  const LEAVE_DELAY = 500

  useEffect(() => {
    try {
      resizeWindow(dimensions)
    } catch (error) {
      console.error('Error resizing window:', error)
    }
  }, [dimensions, resizeWindow])

  // Hover handlers
  const handleMouseEnter = useCallback((e) => {
    // Don't trigger hover if we're over the drag handle
    if (e.target.id === 'drag-handle' || e.target.closest('#drag-handle')) {
      return
    }

    // Clear any existing leave timer
    if (leaveTimerRef.current !== null) {
      clearTimeout(leaveTimerRef.current)
      leaveTimerRef.current = null
    }

    // Only start hover timer if we're not already dragging
    if (!isDraggingRef.current) {
      // Set timer to switch to hover view
      hoverTimerRef.current = window.setTimeout(() => {
        setView('hover').catch(console.error)
      }, HOVER_DELAY)
    }
  }, [setView])

  const handleMouseLeave = useCallback(() => {
    // Clear any existing hover timer
    if (hoverTimerRef.current !== null) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
  }, [])

  // Effect to clean up timers on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current !== null) {
        clearTimeout(hoverTimerRef.current)
      }
      if (leaveTimerRef.current !== null) {
        clearTimeout(leaveTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const handle = document.getElementById('drag-handle');
    if (!handle) return;
    
    // Simple drag handler with mouse events only
    let isDragging = false;
    let lastY = 0;
    
    const onMouseDown = (e) => {
      // Start the drag
      isDragging = true;
      isDraggingRef.current = true;
      lastY = e.clientY;
      
      // Clear any hover timers when dragging starts
      if (hoverTimerRef.current !== null) {
        clearTimeout(hoverTimerRef.current)
        hoverTimerRef.current = null
      }
      
      // Prevent default behaviors
      e.preventDefault();
      
      // Tell the main process we're starting a drag
      window.electronAPI.startVerticalDrag(e.clientY);
      
      // Add visual feedback
      handle.classList.add('active');
      document.body.classList.add('dragging');
    };
    
    const onMouseMove = (e) => {
      if (!isDragging) return;
      
      // Store the current Y position
      lastY = e.clientY;
      
      // If we already have an animation frame pending, don't request another
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(() => {
          // Send the position to the main process
          window.electronAPI.updateVerticalDrag(lastY);
          rafIdRef.current = null;
        });
      }
    };
    
    const onMouseUp = () => {
      if (!isDragging) return;
      
      // End the drag
      isDragging = false;
      isDraggingRef.current = false;
      
      // Cancel any pending animation frame
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      
      // Tell the main process we're done
      window.electronAPI.endVerticalDrag();
      
      // Remove visual feedback
      handle.classList.remove('active');
      document.body.classList.remove('dragging');
    };
    
    // Add the event listeners
    handle.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    
    // Clean up
    return () => {
      handle.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      
      // Make sure to cancel any pending animation frame
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return (
    <div 
      className="w-full h-full bg-red-400 text-white flex justify-start items-center pl-2 gap-x-3"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={() => {
          useViewStore.setState({ currentView: 'default' })
          setView('default').catch(console.error)
        }}
        className="bg-green-500 rounded-full w-10 h-10 cursor-pointer"
      />
      <div 
        className="w-8 h-full bg-blue-500 cursor-grab hover:bg-blue-600 flex items-center justify-center" 
        id="drag-handle" 
      >
        <span className="text-white select-none">⋮</span>
      </div>
    </div>
  )
})

export default PillView
