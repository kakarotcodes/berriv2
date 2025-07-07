// dependencies
import React, { useState } from 'react'

// icons
import DragHandle from '@/assets/icons/drag-handle.svg?react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

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

  const togglePillHeight = () => {
    const newHeight = isExpanded ? HEIGHT.PILL_COLLAPSED : HEIGHT.PILL_EXPANDED
    setIsExpanded(!isExpanded)
    resizeWindow({ width: WIDTH.PILL, height: newHeight }, 300)
  }

  return (
    <div
      id="pill-container"
      className="w-full h-full text-white flex flex-col items-center hardware-accelerated pt-0.5"
    >
      <div id="drag-handle" className="flex items-center justify-center">
        <DragHandle className="w-5 h-5" />
      </div>
      <div className="w-full h-full flex flex-col gap-y-5 overflow-y-scroll py-2 px-1 hide-scrollbar">
        {children}
      </div>
      <button
        id="pill-height-toggle-button"
        className="w-full flex items-center justify-center py-0.5"
        onClick={togglePillHeight}
      >
        <ChevronDownIcon
          className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>
    </div>
  )
}

export default PillLayout
