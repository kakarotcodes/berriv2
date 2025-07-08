// dependencies
import React, { useEffect, useRef } from 'react'

// components
import NotesSplitView from '../components/NotesSplitView'

// store
import { useViewStore } from '../../../globalStore/viewStore'
import { NewNoteButton, NotesSearchbar } from '../components'

// Constants for timing
const RESIZE_END_DELAY = 500 // Wait 500ms after last resize before final save

const NotesViewHover: React.FC = () => {
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastKnownSize = useRef<{ width: number; height: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)



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

  return (
    <div className="w-full h-full flex flex-col flex-grow overflow-hidden" ref={containerRef}>
      <div className="w-full bg-black/40 px-4 h-14 flex items-center gap-x-4">
        <NotesSearchbar />
        <NewNoteButton />
      </div>

      {/* Split view layout */}
      <NotesSplitView />
    </div>
  )
}

export default NotesViewHover
