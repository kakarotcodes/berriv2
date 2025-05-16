// dependencies
import React, { memo, useEffect } from 'react'

// store
import { useViewStore } from '@/globalStore'

// views
import { DefaultView, PillView, HoverView, ExpandedView } from '@/views'

/**
 * OverlayContainer - With all animations removed
 */
const App: React.FC = memo(() => {
  const { currentView, isTransitioning, setView } = useViewStore()

  // Memoized view component mapping
  const viewComponents = React.useMemo(
    () => ({
      default: DefaultView,
      pill: PillView,
      hover: HoverView,
      expanded: ExpandedView
    }),
    []
  )

  // Set up sleep/wake handlers
  useEffect(() => {
    const cleanups: Array<() => void> = []

    // Handle sleep event - respond to request for current view
    if (window.electronAPI?.requestCurrentView) {
      const cleanup = window.electronAPI.requestCurrentView(() => {
        // Return the current view for sleep/suspend state
        return currentView
      })

      cleanups.push(cleanup)
    }

    // Handle wake event - restore view after sleep
    if (window.electronAPI?.onResumeFromSleep) {
      const cleanup = window.electronAPI.onResumeFromSleep((view) => {
        console.log('Resuming from sleep, restoring view:', view)
        // Only set view if different from current
        if (view && view !== currentView) {
          setView(view)
        }
      })

      cleanups.push(cleanup)
    }

    // Return cleanup function to remove listeners when component unmounts or dependencies change
    return () => {
      cleanups.forEach((cleanup) => cleanup())
    }
  }, [currentView, setView])

  // If transitioning to or from a view, or transitioning in general,
  // show an empty window without any content
  if (isTransitioning) {
    return (
      <main className="w-screen h-screen bg-transparent flex items-center justify-center"></main>
    )
  }

  // Regular rendering without animations for all views
  return (
    <main className="w-screen h-screen bg-transparent flex items-center justify-center">
      <div className="absolute inset-0 flex items-center justify-center" style={{ opacity: 1 }}>
        {React.createElement(viewComponents[currentView])}
      </div>
    </main>
  )
})

export default App
