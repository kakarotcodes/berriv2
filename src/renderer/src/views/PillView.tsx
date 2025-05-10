import { useEffect, useRef, useState } from 'react'
import { useElectron } from '@/hooks/useElectron'
import { useViewStore } from '@/globalStore'

const PillView = () => {
  const { resizeWindow } = useElectron()
  const { dimensions, setView } = useViewStore()
  const rafIdRef = useRef<number | null>(null)
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null)
  const [isMouseOver, setIsMouseOver] = useState(false)
  const [isOverDragHandle, setIsOverDragHandle] = useState(false)

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
      window.electronAPI.startVerticalDrag(e.clientY)

      handle.classList.add('active')
      document.body.classList.add('dragging')
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      lastY = e.clientY

      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(() => {
          window.electronAPI.updateVerticalDrag(lastY)
          rafIdRef.current = null
        })
      }
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
  }, [])

  useEffect(() => {
    const pill = document.getElementById('pill-container')
    if (!pill) return

    const onMouseEnter = () => {
      setIsMouseOver(true)

      // Only start hover timer if we're not over the drag handle
      if (!isOverDragHandle) {
        if (hoverTimeout.current) {
          clearTimeout(hoverTimeout.current)
        }
        hoverTimeout.current = setTimeout(() => {
          // Double-check we're still not over the drag handle when the timer fires
          if (!isOverDragHandle && isMouseOver) {
            setView('hover')
          }
        }, 500)
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
      // Only reset/restart the timer if we're over the pill but not over the drag handle
      if (isMouseOver && !isOverDragHandle) {
        if (hoverTimeout.current) {
          clearTimeout(hoverTimeout.current)
        }
        hoverTimeout.current = setTimeout(() => {
          // Double-check we're still not over the drag handle when the timer fires
          if (!isOverDragHandle && isMouseOver) {
            setView('hover')
          }
        }, 500)
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
  }, [setView, isMouseOver, isOverDragHandle])

  const switchToDefault = async () => {
    await window.electronAPI.animateViewTransition('default')
    setView('default')
  }

  return (
    <div
      id="pill-container"
      className="w-full h-full bg-red-400 text-white flex justify-start items-center pl-2 gap-x-3"
    >
      <button
        onClick={switchToDefault}
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
}

export default PillView
