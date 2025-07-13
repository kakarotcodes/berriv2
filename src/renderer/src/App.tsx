// dependencies
import React, { memo, useEffect } from 'react'

// store
import { useViewStore } from '@/globalStore'

// views
import { DefaultView, PillView, HoverView } from '@/views'

// providers
import { ThemeProvider } from '@/components/providers'

/**
 * OverlayContainer - With all animations removed
 */
const App = memo(() => {
  const { currentView, isTransitioning, setView } = useViewStore()

  // Memoized view component mapping
  const viewComponents = React.useMemo(
    () => ({
      default: DefaultView,
      pill: PillView,
      hover: HoverView
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
          setView(view as 'default' | 'pill' | 'hover')
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
      <ThemeProvider>
        <main className="w-screen h-screen relative frosted-glass-base frosted-glass-main"></main>
      </ThemeProvider>
    )
  }

  // Regular rendering without animations for all views
  return (
    <ThemeProvider>
      <main className="w-screen h-screen frosted-glass-base frosted-glass-main">
        {React.createElement(viewComponents[currentView])}
      </main>
    </ThemeProvider>
  )
})

App.displayName = 'App'

export default App
