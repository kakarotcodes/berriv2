// dependencies
import React, { useState, useRef, useEffect } from 'react'

// icons
import DragHandle from '@/assets/icons/drag-handle.svg?react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { Mic } from 'lucide-react'

// hooks
import { useElectron } from '@/hooks/useElectron'

// constants
import { WIDTH, HEIGHT } from '../../../../constants/constants'

// types
type PillLayoutProps = {
  children: React.ReactNode
}

const PillLayout: React.FC<PillLayoutProps> = ({ children }) => {
  const { resizeWindow } = useElectron()
  const [isExpanded, setIsExpanded] = useState(false)
  const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const expandPill = () => {
    // Clear any pending collapse timeout
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current)
      collapseTimeoutRef.current = null
    }

    if (!isExpanded) {
      setIsExpanded(true)
      resizeWindow({ width: WIDTH.PILL, height: HEIGHT.PILL_EXPANDED }, 300)
    }
  }

  const collapsePill = () => {
    // Clear any existing timeout
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current)
    }

    // Set a 3-second delay before collapsing
    collapseTimeoutRef.current = setTimeout(() => {
      if (isExpanded) {
        setIsExpanded(false)
        resizeWindow({ width: WIDTH.PILL, height: HEIGHT.PILL_COLLAPSED }, 300)
      }
      collapseTimeoutRef.current = null
    }, 2000)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div
      id="pill-container"
      className="w-full h-full text-white flex flex-col items-center hardware-accelerated pt-0.5"
      onMouseLeave={collapsePill}
    >
      <div id="drag-handle" className="flex items-center justify-center">
        <DragHandle className="w-5 h-5" />
      </div>
      <button
        id="microphone-button"
        className="w-full flex items-center justify-center py-2"
        onClick={() => {
          console.log('Microphone button clicked')
        }}
      >
        <Mic className="w-4 h-4 bg-gradient-to-br from-red-400/30 to-blue-400/30 rounded-full p-1 w-6 h-6 hover:from-red-400/50 hover:to-blue-400/50 transition-all duration-200" />
      </button>
      <div className="w-full h-full flex flex-col gap-y-5 overflow-y-scroll py-2 px-1 hide-scrollbar">
        {children}
      </div>
      <button
        id="pill-height-toggle-button"
        className="w-full flex items-center justify-center py-0.5"
        onMouseEnter={expandPill}
      >
        <ChevronDownIcon
          className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>
    </div>
  )
}

export default PillLayout
