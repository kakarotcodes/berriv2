// dependencies
import React, { Suspense, memo, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

// store
import { useViewStore } from '@/globalStore'

// views
import { DefaultView, PillView, HoverView, ExpandedView } from '@/views'

// constants
import {
  componentFade,
  overlayTransition,
  viewTransition,
  viewVariants
} from '../../constants/constants'

/**
 * OverlayContainer - Optimized container with smooth transitions between views
 * using GPU-accelerated animations and code splitting.
 */
const App: React.FC = memo(() => {
  const { currentView, targetView, isTransitioning, setView } = useViewStore()

  // Track if we're transitioning specifically from default to pill
  const isDefaultToPill = React.useMemo(() => {
    return currentView === 'default' && targetView === 'pill'
  }, [currentView, targetView])

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

  return (
    <main className="w-screen h-screen bg-transparent flex items-center justify-center transform-gpu will-change-transform">
      <AnimatePresence mode="wait">
        <Suspense
          fallback={
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="bg-white/10 p-2 rounded-md">
                <span className="text-white/80 text-sm">Loading view...</span>
              </div>
            </div>
          }
        >
          {/* Current View */}
          <motion.div
            key={currentView}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={viewVariants}
            transition={viewTransition}
            className="absolute inset-0 flex items-center justify-center"
            style={{
              willChange: 'transform, opacity',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden'
            }}
          >
            <AnimatePresence mode="wait">
              {!isTransitioning && (
                <motion.div
                  key={`component-${currentView}`}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={componentFade}
                  className="w-full h-full"
                >
                  {React.createElement(viewComponents[currentView])}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Transition Overlay */}
          {isTransitioning && (
            <motion.div
              key={`transition-overlay`}
              initial={{ opacity: 0 }}
              animate={{
                opacity: isDefaultToPill ? 0.5 : 0.3,
                backgroundColor: isDefaultToPill ? '#000000' : 'rgba(0,0,0,0.3)'
              }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none"
              transition={overlayTransition}
              style={{
                willChange: 'opacity',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden'
              }}
            />
          )}
        </Suspense>
      </AnimatePresence>
    </main>
  )
})

export default App
