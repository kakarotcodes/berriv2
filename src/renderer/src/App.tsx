// dependencies
import React, { memo, useEffect } from 'react'

// store
import { useViewStore } from '@/globalStore'
import { setupAuthListener, useAuthStore } from '@/globalStore/useAuthStore'

// views
import { DefaultView, PillView, HoverView } from '@/views'

// providers
import { ThemeProvider } from '@/components/providers'

// components
import { GlobalModal } from '@/components/shared'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

/**
 * OverlayContainer - With all animations removed
 */
const App = memo(() => {
  const { currentView, isTransitioning, setView } = useViewStore()
  const { initializeAuth } = useAuthStore()

  // Initialize auth store and setup listener once
  useEffect(() => {
    initializeAuth()
    const cleanup = setupAuthListener()
    return cleanup
  }, [initializeAuth])

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
        <GlobalModal />
        <ToastContainer
          toastStyle={{
            fontSize: '12px',
            padding: '8px 12px',
            minHeight: 'auto'
          }}
          icon={({ type }) => {
            if (type === 'success') {
              return (
                <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0 flex items-center justify-center mr-0.5">
                  <svg className="w-2.5 h-2.5 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )
            }
            return null
          }}
        />
      </ThemeProvider>
    )
  }

  // Regular rendering without animations for all views
  return (
    <ThemeProvider>
      <main className="w-screen h-screen frosted-glass-base frosted-glass-main">
        {React.createElement(viewComponents[currentView])}
      </main>
      <GlobalModal />
      <ToastContainer
        toastStyle={{
          fontSize: '12px',
          padding: '8px 12px',
          minHeight: 'auto'
        }}
        icon={({ type }) => {
          if (type === 'success') {
            return (
              <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0 flex items-center justify-center mr-0.5">
                <svg className="w-2.5 h-2.5 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )
          }
          return null
        }}
      />
    </ThemeProvider>
  )
})

App.displayName = 'App'

export default App
