// dependencies
import React, { memo, useEffect } from 'react'

// store
import { useViewStore } from '@/globalStore'
import { setupAuthListener, useAuthStore } from '@/globalStore/useAuthStore'
import { useNotesStore } from './features/notes/store/notesStore'
import { aiApi } from './api/ai'

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
  const { addNote } = useNotesStore()

  // AI Notes Generation Function - now handles inline input
  const handleAINotesGeneration = React.useCallback(async () => {
    // Switch to notes view if not already there
    if (currentView !== 'hover') {
      setView('hover')
      // Wait a bit for view transition
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    // Trigger AI input mode in notes editor
    window.dispatchEvent(new CustomEvent('ai-notes-shortcut-triggered'))
  }, [currentView, setView])

  // Initialize auth store and setup listener once
  useEffect(() => {
    initializeAuth()
    const cleanup = setupAuthListener()
    return cleanup
  }, [initializeAuth])

  // Set up global AI notes shortcut
  useEffect(() => {
    console.log('[APP] Setting up AI notes shortcut listener...')
    const cleanup = window.electronAPI.onAINotesShortcut(() => {
      console.log('[APP] AI notes shortcut triggered!')
      handleAINotesGeneration()
    })
    return cleanup
  }, [handleAINotesGeneration])

  // Set up global collapse to pill shortcut
  useEffect(() => {
    console.log('[APP] Setting up collapse to pill shortcut listener...')
    const cleanup = window.electronAPI.onCollapseToPill(() => {
      console.log('[APP] Global Cmd+Escape triggered, collapsing to pill view')
      if (currentView !== 'pill') {
        setView('pill')
      }
    })
    return cleanup
  }, [currentView, setView])

  // Set up local keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd+Shift+G for AI notes
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.code === 'KeyG') {
        event.preventDefault()
        console.log('[APP] Local shortcut triggered: Cmd+Shift+G')
        handleAINotesGeneration()
      }
      
      // Escape key to switch to pill view (only from hover view)
      if (event.code === 'Escape' && currentView === 'hover') {
        event.preventDefault()
        console.log('[APP] Escape key pressed, switching to pill view')
        setView('pill')
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleAINotesGeneration, currentView, setView])

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
          pauseOnFocusLoss={false}
          pauseOnHover={false}
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
        pauseOnFocusLoss={false}
        pauseOnHover={false}
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
