import React, { lazy, Suspense, memo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useViewStore } from '@/globalStore'

// Lazy load views for better performance
const DefaultView = lazy(() => import('@/views/DefaultView'))
const PillView = lazy(() => import('@/views/PillView'))
const HoverView = lazy(() => import('@/views/HoverView'))
const ExpandedView = lazy(() => import('@/views/ExpandedView'))

// Animation configuration
const viewTransition = {
  type: 'spring',
  stiffness: 400,
  damping: 25,
  mass: 0.8
}

const viewVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.1 } }
}

// Transition overlay config
const overlayTransition = {
  enter: { duration: 0.15 },
  exit: { duration: 0.15 }
}

/**
 * OverlayContainer - Optimized container with smooth transitions between views
 * using GPU-accelerated animations and code splitting.
 */
const OverlayContainer: React.FC = memo(() => {
  const { currentView, targetView, isTransitioning } = useViewStore()

  // Track if we're transitioning specifically from default to pill
  const isDefaultToPill = React.useMemo(() => {
    return currentView === 'default' && targetView === 'pill';
  }, [currentView, targetView]);

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

  // Ensure components are pre-loaded
  React.useEffect(() => {
    // Preload all view components
    const preloadViews = async () => {
      await Promise.all([
        import('@/views/DefaultView'),
        import('@/views/PillView'),
        import('@/views/HoverView'),
        import('@/views/ExpandedView')
      ])
    }
    preloadViews().catch(console.error)
  }, [])

  return (
    <div className="w-screen h-screen bg-transparent flex items-center justify-center transform-gpu will-change-transform">
      <AnimatePresence mode="wait">
        <Suspense fallback={
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="bg-white/10 p-2 rounded-md">
              <span className="text-white/80 text-sm">Loading view...</span>
            </div>
          </div>
        }>
          {/* Current View */}
          <motion.div
            key={currentView}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={viewVariants}
            transition={viewTransition}
            className="absolute inset-0 flex items-center justify-center"
          >
            {React.createElement(viewComponents[currentView])}
          </motion.div>

          {/* Transition Overlay - with special handling for default->pill */}
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
            />
          )}
        </Suspense>
      </AnimatePresence>
    </div>
  )
})

export default OverlayContainer
