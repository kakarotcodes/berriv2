import React, { useEffect, useRef, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

import NotesSidebar from './NotesSidebar'
import NotesEditor from './NotesEditor'

const NotesSplitView: React.FC = () => {
  const [leftWidth, setLeftWidth] = useState(33.33) // Start at maximum allowed size (1/3rd)
  const [parentWidth, setParentWidth] = useState(0) // Track parent container width
  const isDraggingRef = useRef(false)
  const flexContainerRef = useRef<HTMLDivElement>(null)
  const resizerRef = useRef<HTMLDivElement>(null)

  const expandDivA = () => {
    // Restore to default width (33.33%), not the maximum allowed width
    setLeftWidth(33.33)
  }

  const collapseDivA = () => {
    setLeftWidth(0) // Collapse to 0%
  }

  const toggleDivA = () => {
    if (isCollapsed) {
      expandDivA()
    } else {
      collapseDivA()
    }
  }

  // Function to update parent width
  const updateParentWidth = () => {
    if (flexContainerRef.current) {
      const newWidth = flexContainerRef.current.getBoundingClientRect().width
      setParentWidth(newWidth)
    }
  }

  // Use ResizeObserver to track flex container width changes
  useEffect(() => {
    if (!flexContainerRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setParentWidth(entry.contentRect.width)
      }
    })

    resizeObserver.observe(flexContainerRef.current)

    // Initial measurement
    updateParentWidth()

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault()
      isDraggingRef.current = true
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    const handleMouseUp = () => {
      isDraggingRef.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !flexContainerRef.current) return
      const containerRect = flexContainerRef.current.getBoundingClientRect()
      const mouseX = e.clientX
      const containerLeft = containerRect.left
      const containerWidth = containerRect.width

      const newWidth = ((mouseX - containerLeft) / containerWidth) * 100

      // Calculate max width percentage based on half the container width
      const maxWidthPixels = containerWidth / 2
      const maxWidthPercentage = (maxWidthPixels / containerWidth) * 100

      // Allow dragging to 0% and restrict maximum to half the container width
      const clampedWidth = Math.max(0, Math.min(maxWidthPercentage, newWidth))

      setLeftWidth(clampedWidth)
    }

    const resizer = resizerRef.current
    if (resizer) resizer.addEventListener('mousedown', handleMouseDown)

    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mousemove', handleMouseMove)

    return () => {
      if (resizer) resizer.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  const isCollapsed = leftWidth <= 1 // Consider collapsed if 1% or less

  return (
    <div className="w-full h-full flex" ref={flexContainerRef}>
      {/* Div A */}
      <div
        style={{
          width: `${leftWidth}%`
        }}
        className="h-full bg-blue-500 flex items-center justify-center text-white font-bold overflow-hidden"
      >
        DIV A (Max: {Math.round(parentWidth / 2)}px)
      </div>

      {/* Resizer gutter */}
      <div
        ref={resizerRef}
        className="w-0.5 flex-shrink-0 relative bg-gray-600 cursor-col-resize"
        title="Drag to resize"
      >
        <div className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center">
          <div className="h-8 w-1 bg-gray-700 rounded-full"></div>
        </div>
        {/* Toggle button - always visible in center */}
        <button
          onClick={toggleDivA}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-gray-900 rounded-full flex items-center justify-center text-gray-800 hover:bg-gray-800"
          title={isCollapsed ? 'Expand Div A' : 'Collapse Div A'}
        >
          {isCollapsed ? (
            <ChevronRightIcon className="w-2.5 h-2.5 text-white" />
          ) : (
            <ChevronLeftIcon className="w-2.5 h-2.5 text-white" />
          )}
        </button>
      </div>

      {/* Div B */}
      <div
        style={{ width: `calc(100% - ${leftWidth}% - 2px)` }}
        className="h-full bg-red-500 flex items-center justify-center text-white font-bold"
      >
        DIV B
      </div>
    </div>
  )
}

export default NotesSplitView
