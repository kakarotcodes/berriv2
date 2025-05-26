import { useEffect, useRef } from 'react'

export function useDragHandle(savePillPosition: () => void) {
  const rafIdRef = useRef<number | null>(null)
  const isDraggingRef = useRef(false)
  const lastYRef = useRef(0)
  const cleanupFnRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    // Create the event handlers with refs to ensure state persistence
    const onMouseDown = (e: MouseEvent) => {
      if (isDraggingRef.current) return // Prevent starting a new drag if already dragging
      
      isDraggingRef.current = true
      lastYRef.current = e.clientY
      e.preventDefault()
      e.stopPropagation()
      
      const handle = e.currentTarget as HTMLElement
      handle.classList.add('active')
      document.body.classList.add('dragging')
      
      window.electronAPI.startVerticalDrag(lastYRef.current)
      animateDrag()
    }

    const onMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        lastYRef.current = e.clientY
      }
    }

    const animateDrag = () => {
      if (isDraggingRef.current) {
        window.electronAPI.updateVerticalDrag(lastYRef.current)
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
      window.electronAPI.endVerticalDrag()
      
      // Find the handle element and remove active class
      const handle = document.getElementById('drag-handle')
      if (handle) {
        handle.classList.remove('active')
      }
      document.body.classList.remove('dragging')
      
      // Save position
      savePillPosition()
    }

    // Function to attach event listeners
    const attachListeners = () => {
      const handle = document.getElementById('drag-handle')
      if (!handle) return null
      
      // Clean up previous handlers if they exist
      if (cleanupFnRef.current) {
        cleanupFnRef.current()
        cleanupFnRef.current = null
      }
      
      // Reset state
      isDraggingRef.current = false
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
      
      // Attach new listeners
      handle.addEventListener('mousedown', onMouseDown)
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
      
      // Store cleanup function
      cleanupFnRef.current = () => {
        handle.removeEventListener('mousedown', onMouseDown)
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
        
        // Reset state
        isDraggingRef.current = false
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current)
          rafIdRef.current = null
        }
      }
      
      return cleanupFnRef.current
    }
    
    // Initial setup
    attachListeners()
    
    // Watch for DOM changes - if drag handle is recreated
    const observer = new MutationObserver(() => {
      // Only try to reattach if we don't already have listeners
      if (!cleanupFnRef.current) {
        attachListeners()
      }
    })
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
    
    // Cleanup on component unmount
    return () => {
      observer.disconnect()
      if (cleanupFnRef.current) {
        cleanupFnRef.current()
        cleanupFnRef.current = null
      }
    }
  }, [savePillPosition])
}
