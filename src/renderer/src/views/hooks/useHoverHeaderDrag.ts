import { useEffect, useRef } from 'react'
import { useElectron } from '@/hooks/useElectron'

export function useHoverHeaderDrag() {
  const { startVerticalDrag, updateVerticalDrag, endVerticalDrag, savePillPosition, saveHoverPosition } = useElectron()
  const rafIdRef = useRef<number | null>(null)
  const isDraggingRef = useRef(false)
  const lastYRef = useRef(0)
  const cleanupFnRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    // Create the event handlers with refs to ensure state persistence
    const onMouseDown = (e: MouseEvent) => {
      // Only handle drag if it's started from the hover-header element
      const target = e.target as HTMLElement
      const hoverHeader = document.getElementById('hover-header')
      
      // Check if the click is directly on the hover-header or one of its children
      // Exclude clicks on ResizeControls or the Pin toggle
      if (!hoverHeader?.contains(target) || 
          target.closest('#resize-btn-grp') || 
          target.closest('.cursor-pointer')) {
        return
      }
      
      if (isDraggingRef.current) return // Prevent starting a new drag if already dragging
      
      isDraggingRef.current = true
      lastYRef.current = e.clientY
      e.preventDefault()
      e.stopPropagation()
      
      hoverHeader.classList.add('dragging')
      document.body.classList.add('dragging')
      
      startVerticalDrag(lastYRef.current)
      animateDrag()
    }

    const onMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        lastYRef.current = e.clientY
      }
    }

    const animateDrag = () => {
      if (isDraggingRef.current) {
        updateVerticalDrag(lastYRef.current)
        rafIdRef.current = requestAnimationFrame(animateDrag)
      }
    }

    const onMouseUp = () => {
      if (!isDraggingRef.current) return
      
      // End drag state
      isDraggingRef.current = false
      
      // Clear animation frame
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
      
      // Clean up
      endVerticalDrag()
      
      // Find the handle element and remove active class
      const handle = document.getElementById('hover-header')
      if (handle) {
        handle.classList.remove('dragging')
      }
      document.body.classList.remove('dragging')
      
      // Save position (both hover and pill for consistency)
      saveHoverPosition()
    }

    // Attach event listeners to the document instead of just the hover-header
    // This allows us to handle the mousedown event even if it wasn't started directly on the header
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    
    // Store cleanup function
    cleanupFnRef.current = () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      
      // Reset state
      isDraggingRef.current = false
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
    }
    
    // Cleanup on component unmount
    return () => {
      if (cleanupFnRef.current) {
        cleanupFnRef.current()
        cleanupFnRef.current = null
      }
    }
  }, [startVerticalDrag, updateVerticalDrag, endVerticalDrag, savePillPosition, saveHoverPosition])
} 