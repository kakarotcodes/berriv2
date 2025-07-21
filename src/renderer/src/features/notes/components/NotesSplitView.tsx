// dependencies
import React, { useEffect, useRef, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

// components
import NotesEditor from './NotesEditor'
import NotesList from './NotesList'

interface NotesSplitViewProps {
  aiInputComponent?: React.ReactNode
}

const NotesSplitView: React.FC<NotesSplitViewProps> = ({ aiInputComponent }) => {
  const [leftWidth, setLeftWidth] = useState(33.33) // Start at maximum allowed size (1/3rd)
  const isDraggingRef = useRef(false)
  const flexContainerRef = useRef<HTMLDivElement>(null)
  const resizerRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const pendingWidthRef = useRef<number | null>(null)

  const expandDivA = () => {
    // Restore to default width (33.33%), not the maximum allowed width
    setLeftWidth(33.33)
  }

  const collapseDivA = () => {
    setLeftWidth(0) // Collapse to 0%
  }

  const toggleNotesList = () => {
    if (isCollapsed) {
      expandDivA()
    } else {
      collapseDivA()
    }
  }

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

      // Cancel any pending animation frame when dragging stops
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }

      // Apply any final pending width update
      if (pendingWidthRef.current !== null) {
        setLeftWidth(pendingWidthRef.current)
        pendingWidthRef.current = null
      }
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

      // Store the pending width and throttle state updates with requestAnimationFrame
      pendingWidthRef.current = clampedWidth

      // Only schedule a new animation frame if one isn't already pending
      if (animationFrameRef.current === null) {
        animationFrameRef.current = requestAnimationFrame(() => {
          if (pendingWidthRef.current !== null) {
            setLeftWidth(pendingWidthRef.current)
            pendingWidthRef.current = null
          }
          animationFrameRef.current = null
        })
      }
    }

    const resizer = resizerRef.current
    if (resizer) resizer.addEventListener('mousedown', handleMouseDown)

    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mousemove', handleMouseMove)

    return () => {
      if (resizer) resizer.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mousemove', handleMouseMove)

      // Cancel any pending animation frame on cleanup
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [])

  const isCollapsed = leftWidth <= 1 // Consider collapsed if 1% or less

  return (
    <div className="w-full h-full flex" ref={flexContainerRef}>
      <div
        style={{
          width: `${leftWidth}%`
        }}
        className="h-full flex flex-col text-white font-bold overflow-hidden min-h-0"
      >
        <NotesList />
      </div>

      {/* Resizer gutter */}
      <div
        ref={resizerRef}
        className="w-0.5 flex-shrink-0 relative bg-white/10 cursor-col-resize z-40"
        title="Drag to resize"
      >
        <div className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center">
          <div className={`h-10 ${isCollapsed ? 'w-0' : 'w-1'} bg-white/10 rounded-full`}></div>
        </div>
        {/* Toggle button - always visible in center */}
        <button
          onClick={toggleNotesList}
          className={`cursor-pointer absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 ${isCollapsed ? 'bg-gray-900' : 'bg-gray-900'} hover:bg-gray-800 rounded-full flex items-center justify-center text-gray-800`}
        >
          {isCollapsed ? (
            <ChevronRightIcon className="w-8 h-8 text-white stroke-2" />
          ) : (
            <ChevronLeftIcon className="w-3 h-3 text-white stroke-2" />
          )}
        </button>
      </div>

      {/* Div B - Notes Editor with AI Input */}
      <div className="flex-1 flex flex-col min-h-0">
        {aiInputComponent}
        <NotesEditor />
      </div>
    </div>
  )
}

export default NotesSplitView
