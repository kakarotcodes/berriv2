import { useEffect, useMemo } from 'react'
import useViewStore from '../globalStore/viewStore'
import { debounce } from 'lodash' // Or implement your own debounce function

/**
 * Hook that synchronizes window bounds with the current view mode.
 * Maps each view mode to specific dimensions and sends IPC messages
 * to resize the Electron window accordingly.
 */
export function useWindowBoundsSync(): void {
  // Get current view mode from Zustand store
  const { viewMode } = useViewStore()

  // Calculate dimensions for the 'expanded' mode
  const expandedDimensions = useMemo(
    () => ({
      width: Math.round(window.screen.width * 0.2),
      height: Math.round(window.screen.height * 0.5)
    }),
    []
  )

  // Map view modes to their respective dimensions
  const getDimensionsForMode = (mode: string) => {
    switch (mode) {
      case 'default':
        return { width: 512, height: 512 }
      case 'pill':
        return { width: 100, height: 40 }
      case 'hover':
        return { width: 280, height: 280 }
      case 'expanded':
        return expandedDimensions
      default:
        return { width: 512, height: 512 }
    }
  }

  // Create a debounced function for sending resize IPC messages
  const debouncedResize = useMemo(
    () =>
      debounce((dimensions: { width: number; height: number }) => {
        window.electron.ipcRenderer.send('resize-window', dimensions)
      }, 150),
    []
  )

  // Effect to send resize messages when view mode changes
  useEffect(() => {
    const dimensions = getDimensionsForMode(viewMode)
    debouncedResize(dimensions)

    // Cleanup function to cancel any pending debounced calls
    return () => {
      debouncedResize.cancel()
    }
  }, [viewMode, debouncedResize, expandedDimensions])

  // This hook doesn't return anything, it just performs the side effect
}
