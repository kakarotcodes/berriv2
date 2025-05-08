// components/ViewContainer.tsx
import { lazy, memo, Suspense } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useViewStore } from '@/globalStore'
import React from 'react'

const viewComponents = {
  default: lazy(() => import('@/views/DefaultView')),
  pill: lazy(() => import('@/views/PillView')),
  hover: lazy(() => import('@/views/HoverView')),
  expanded: lazy(() => import('@/views/ExpandedView'))
}

const ViewContainer = memo(() => {
  const { currentView, targetView } = useViewStore()

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<div className="loading-placeholder" />}>
        <motion.div
          key={currentView}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0"
        >
          {React.createElement(viewComponents[currentView])}
        </motion.div>

        {targetView && targetView !== currentView && (
          <motion.div
            key={`target-${targetView}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
          />
        )}
      </Suspense>
    </AnimatePresence>
  )
})

export default ViewContainer
