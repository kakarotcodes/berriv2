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
  stiffness: 300,
  damping: 30
}

const viewVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 }
}

/**
 * OverlayContainer - Optimized container with smooth transitions between views
 * using GPU-accelerated animations and code splitting.
 */
const OverlayContainer: React.FC = memo(() => {
  const { currentView, targetView } = useViewStore()

  return (
    <div className="w-screen h-screen bg-transparent flex items-center justify-center transform-gpu will-change-transform">
      <AnimatePresence mode="wait">
        <Suspense fallback={<div className="text-white">Loading...</div>}>
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
            {currentView === 'default' && <DefaultView />}
            {currentView === 'pill' && <PillView />}
            {currentView === 'hover' && <HoverView />}
            {currentView === 'expanded' && <ExpandedView />}
            <p>{currentView}</p>
          </motion.div>

          {/* Transition Overlay */}
          {targetView && targetView !== currentView && (
            <motion.div
              key={`transition-${targetView}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40"
              transition={{ duration: 0.15 }}
            />
          )}
        </Suspense>
      </AnimatePresence>
    </div>
  )
})

export default OverlayContainer
