// dependencies
import React, { useEffect, useRef, useState } from 'react'

// components
import NotesSidebar from '../components/NotesSidebar'
import NotesEditor from '../components/NotesEditor'

// store
import { useNotesStore } from '../store/notesStore'
import { useViewStore } from '../../../globalStore/viewStore'

// Constants for timing
const RESIZE_END_DELAY = 500 // Wait 500ms after last resize before final save

const NotesViewHover: React.FC = () => {
  const [leftWidth, setLeftWidth] = useState(40) // 40% for sidebar
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastKnownSize = useRef<{ width: number; height: number } | null>(null)
  const isDraggingRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const resizerRef = useRef<HTMLDivElement>(null)
  const { setNotes, setTrashed } = useNotesStore()

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

  // Load notes
  useEffect(() => {
    async function loadNotes() {
      const [all, trash] = await Promise.all([
        window.electronAPI.notesAPI.getAllNotes(),
        window.electronAPI.notesAPI.getTrashedNotes()
      ])
      setNotes(all)
      setTrashed(trash)
    }
    loadNotes()
  }, [setNotes, setTrashed])

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
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100
      if (newWidth >= 20 && newWidth <= 80) {
        setLeftWidth(newWidth)
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
    }
  }, [])

  return (
    <div className="w-full h-full flex text-white text-sm animated-gradient" ref={containerRef}>
      {/* Sidebar */}
      <div style={{ width: `${leftWidth}%` }} className="h-full">
        <NotesSidebar />
      </div>

      {/* Resizer */}
      <div
        ref={resizerRef}
        className="w-0.5 bg-gray-600 hover:bg-blue-500 active:bg-blue-700 cursor-col-resize flex-shrink-0 relative"
        title="Drag to resize"
      >
        <div className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center">
          <div className="h-8 w-0.5 bg-gray-400 rounded-full"></div>
        </div>
      </div>

      {/* Editor */}
      <div
        style={{ width: `calc(100% - ${leftWidth}% - 1px)` }}
        className="h-full overflow-hidden relative"
      >
        <NotesEditor />
      </div>
    </div>
  )
}

export default NotesViewHover
