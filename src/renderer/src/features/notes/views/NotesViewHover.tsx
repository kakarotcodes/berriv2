// dependencies
import React, { useEffect, useRef, useState } from 'react'

// components
import NotesSidebar from '../components/NotesSidebar'
import NotesEditor from '../components/NotesEditor'

// store
import { useViewStore } from '../../../globalStore/viewStore'
import { NewNoteButton, NotesSearchbar } from '../components'

// Constants for timing
const RESIZE_END_DELAY = 500 // Wait 500ms after last resize before final save

const NotesViewHover: React.FC = () => {
  const [leftWidth, setLeftWidth] = useState(25) // 25% for sidebar (within 33.33% max)
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastKnownSize = useRef<{ width: number; height: number } | null>(null)
  const isDraggingRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const resizerRef = useRef<HTMLDivElement>(null)

  const expandDivA = () => {
    setLeftWidth(33.33) // Restore to maximum allowed 33.33%
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

  // Add a manual sync function that can be called from multiple places
  const syncWindowSizeToStore = async (source: string = 'unknown') => {
    console.log(`[HOVER] Syncing window size to store (source: ${source})`)
    try {
      const bounds = await window.electronAPI.getWindowBounds()

      if (bounds?.width && bounds?.height) {
        // Only update if the size has actually changed
        if (
          !lastKnownSize.current ||
          lastKnownSize.current.width !== bounds.width ||
          lastKnownSize.current.height !== bounds.height
        ) {
          console.log('[HOVER] Detected size change:', {
            from: lastKnownSize.current,
            to: { width: bounds.width, height: bounds.height }
          })

          // Update last known size
          lastKnownSize.current = { width: bounds.width, height: bounds.height }

          // Save to electron-store via IPC
          console.log('[HOVER] Saving hover dimensions:', {
            width: bounds.width,
            height: bounds.height
          })
          window.electronAPI.saveHoverSize({ width: bounds.width, height: bounds.height })

          // Also update the view store
          useViewStore.setState({
            dimensions: { width: bounds.width, height: bounds.height }
          })

          return true
        } else {
          console.log('[HOVER] Window size unchanged, skipping update')
          return false
        }
      } else {
        console.warn('[HOVER] Could not sync window size - invalid bounds:', bounds)
        return false
      }
    } catch (e) {
      console.error('[HOVER] Error syncing window size:', e)
      return false
    }
  }

  // Use proper window resize event listeners instead of constant polling
  useEffect(() => {
    console.log('[HOVER] Setting up window resize listeners')

    const handleResize = () => {
      // Clear any existing timeout
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }

      // Set a debounced timeout for final size update
      resizeTimeoutRef.current = setTimeout(async () => {
        console.log('[HOVER] Window resize detected, syncing size')
        await syncWindowSizeToStore('window_resize')
        resizeTimeoutRef.current = null
      }, RESIZE_END_DELAY)
    }

    // Listen for window resize events
    window.addEventListener('resize', handleResize)

    return () => {
      console.log('[HOVER] Cleaning up window resize listeners')
      window.removeEventListener('resize', handleResize)

      // Clear any pending resize timeout
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
        resizeTimeoutRef.current = null
      }
    }
  }, [])

  // On component mount, initialize with saved dimensions and get current size
  useEffect(() => {
    const initializeSize = async () => {
      try {
        // First, apply the saved hover dimensions directly
        window.electronAPI.fixHoverDimensions()

        // Then get current window bounds as baseline
        const bounds = await window.electronAPI.getWindowBounds()
        if (bounds?.width && bounds?.height) {
          lastKnownSize.current = { width: bounds.width, height: bounds.height }
          console.log('[HOVER] Initialized lastKnownSize:', lastKnownSize.current)
        }
      } catch (e) {
        console.error('[HOVER] Failed to initialize size reference:', e)
      }
    }

    initializeSize()

    // When component unmounts, make sure we save the final size
    return () => {
      syncWindowSizeToStore('component_unmount')
    }
  }, [])

  // Notes loading is now handled by the store in NotesSidebar

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
      if (!isDraggingRef.current || !containerRef.current) return
      const containerRect = containerRef.current.getBoundingClientRect()
      const mouseX = e.clientX
      const containerLeft = containerRect.left
      const containerWidth = containerRect.width

      const newWidth = ((mouseX - containerLeft) / containerWidth) * 100

      // Allow dragging to 0% and restrict maximum to 33.33% (1/3rd)
      const clampedWidth = Math.max(0, Math.min(33.33, newWidth))

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
    <div className="w-full h-full flex flex-col flex-grow overflow-hidden" ref={containerRef}>
      <div className="w-full bg-black/40 px-4 h-14 flex items-center gap-x-4">
        <NotesSearchbar />
        <NewNoteButton />
      </div>

      {/* Resizable layout */}
      <div className="w-full h-full flex">
        {/* Div A */}
        <div
          style={{ width: `${leftWidth}%` }}
          className="h-full bg-blue-500 flex items-center justify-center text-white font-bold"
        >
          DIV A
        </div>

        {/* Resizer gutter */}
        <div
          ref={resizerRef}
          className="w-1 flex-shrink-0 relative bg-gray-600 hover:bg-blue-500 active:bg-blue-700 cursor-col-resize"
          title="Drag to resize"
        >
          <div className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center">
            <div className="h-8 w-0.5 bg-gray-400 rounded-full"></div>
          </div>
          {/* Toggle button - always visible in center */}
          <button
            onClick={toggleDivA}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full flex items-center justify-center text-xs font-bold text-gray-800 hover:bg-gray-200"
            title={isCollapsed ? 'Expand Div A' : 'Collapse Div A'}
          >
            {isCollapsed ? '>' : '<'}
          </button>
        </div>

        {/* Div B */}
        <div
          style={{ width: `calc(100% - ${leftWidth}% - 4px)` }}
          className="h-full bg-red-500 flex items-center justify-center text-white font-bold"
        >
          DIV B
        </div>
      </div>

      {/* <div
        id="notes-sidebar"
        className="w-full h-full flex-1 flex flex-col gap-y-4 overflow-y-scroll"
      ></div> */}
      {/* Sidebar */}
      {/* <div style={{ width: `${leftWidth}%` }} className="h-full">
        <NotesSidebar />
      </div> */}

      {/* Resizer */}
      {/* <div
        ref={resizerRef}
        className="w-0.5 bg-gray-600 hover:bg-blue-500 active:bg-blue-700 cursor-col-resize flex-shrink-0 relative"
        title="Drag to resize"
      >
        <div className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center">
          <div className="h-8 w-0.5 bg-gray-400 rounded-full"></div>
        </div>
      </div> */}

      {/* Editor */}
      {/* <div
        style={{ width: `calc(100% - ${leftWidth}% - 1px)` }}
        className="h-full overflow-hidden relative"
      >
        <NotesEditor />
      </div> */}
    </div>
  )
}

export default NotesViewHover
