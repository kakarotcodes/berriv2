// dependencies
import React, { useEffect, useRef } from 'react'

// components
import NotesSplitView from '../components/NotesSplitView'

// store
import { useViewStore } from '../../../globalStore/viewStore'
import { NewNoteButton, NotesSearchbar } from '../components'

// Constants for timing
const RESIZE_END_DELAY = 100 // Reduced delay for better responsiveness

const NotesViewHover: React.FC = () => {
  const resizeTimeoutRef = useRef<number | null>(null)
  const lastKnownSize = useRef<{ width: number; height: number } | null>(null)
  const syncVersionRef = useRef(0) // Prevent race conditions



  // Race-condition safe sync function
  const syncWithVersion = async (source: string = 'unknown', isLightweight: boolean = false) => {
    const currentVersion = ++syncVersionRef.current
    
    if (!isLightweight) {
      console.log(`[HOVER] Sync to store (source: ${source})`)
    }
    
    try {
      const bounds = await window.electronAPI.getWindowBounds()

      // Check if this version is still current (no newer sync started)
      if (currentVersion !== syncVersionRef.current) {
        return false // Abort if superseded
      }

      if (bounds?.width && bounds?.height) {
        if (
          !lastKnownSize.current ||
          lastKnownSize.current.width !== bounds.width ||
          lastKnownSize.current.height !== bounds.height
        ) {
          if (!isLightweight) {
            console.log('[HOVER] Detected size change:', {
              from: lastKnownSize.current,
              to: { width: bounds.width, height: bounds.height }
            })
          }

          lastKnownSize.current = { width: bounds.width, height: bounds.height }
          window.electronAPI.saveHoverSize({ width: bounds.width, height: bounds.height })

          if (!isLightweight) {
            useViewStore.setState({
              dimensions: { width: bounds.width, height: bounds.height }
            })
          }

          return true
        } else {
          if (!isLightweight) {
            console.log('[HOVER] Window size unchanged, skipping update')
          }
          return false
        }
      } else {
        if (!isLightweight) {
          console.warn('[HOVER] Could not sync window size - invalid bounds:', bounds)
        }
        return false
      }
    } catch (e) {
      if (!isLightweight) {
        console.error('[HOVER] Error syncing window size:', e)
      }
      return false
    }
  }

  // Simplified window resize handling (move events don't work in renderer)
  useEffect(() => {
    console.log('[HOVER] Setting up window resize listeners')

    const handleResize = () => {
      // Clear any existing timeout
      if (resizeTimeoutRef.current) {
        window.clearTimeout(resizeTimeoutRef.current)
      }

      // Debounced sync for resize events
      resizeTimeoutRef.current = window.setTimeout(async () => {
        await syncWithVersion('window_resize', false)
        resizeTimeoutRef.current = null
      }, RESIZE_END_DELAY)
    }

    // Only listen for resize events (move events don't work in renderer process)
    window.addEventListener('resize', handleResize)

    return () => {
      console.log('[HOVER] Cleaning up window resize listeners')
      window.removeEventListener('resize', handleResize)

      // Clear any pending timeout
      if (resizeTimeoutRef.current) {
        window.clearTimeout(resizeTimeoutRef.current)
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
      syncWithVersion('component_unmount', false)
    }
  }, [])

  // Notes loading is now handled by the store in NotesSidebar

  return (
    <div className="w-full h-full flex flex-col flex-grow min-h-0">
      <div className="w-full bg-black/40 px-4 h-14 flex items-center gap-x-4">
        <NotesSearchbar />
        <NewNoteButton />
      </div>

      {/* Split view layout */}
      <div className="flex-1 min-h-0">
        <NotesSplitView />
      </div>
    </div>
  )
}

export default NotesViewHover
