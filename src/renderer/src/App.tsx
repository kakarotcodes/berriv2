import React from 'react'
import DefaultView from './components/DefaultView'
import useViewStore from '@/globalStore/viewStore'

/**
 * OverlayContainer - A full-screen container component that properly centers and displays
 * the active view component. Provides GPU acceleration for smooth animations and transitions
 * while ensuring content remains properly contained with overflow handling.
 *
 * This component will later be enhanced to support switching between different view modes
 * such as pill, hover, etc.
 */
const OverlayContainer: React.FC = () => {
  // Get the current view mode from the Zustand store
  const { viewMode } = useViewStore()

  // Render the appropriate view based on the current mode
  const renderActiveView = () => {
    switch (viewMode) {
      case 'default':
        return <DefaultView />
      case 'pill':
        return (
          <div className="text-white text-xl flex items-center justify-center h-full">
            Pill View
          </div>
        )
      case 'hover':
        return (
          <div className="text-white text-xl flex items-center justify-center h-full">
            Hover View
          </div>
        )
      case 'expanded':
        return (
          <div className="text-white text-xl flex items-center justify-center h-full">
            Expanded View
          </div>
        )
      default:
        return <DefaultView />
    }
  }

  return (
    <div className="w-screen h-screen bg-transparent flex items-center justify-center transform-gpu will-change-transform">
      {renderActiveView()}
    </div>
  )
}

export default OverlayContainer
