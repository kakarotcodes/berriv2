// dependencies
import React from 'react'

// icons
import DragHandle from '@/assets/icons/drag-handle.svg?react'

// types
type PillLayoutProps = {
  children: React.ReactNode
  onContentHover?: () => void
  onContentLeave?: () => void
}

const PillLayout: React.FC<PillLayoutProps> = ({ children, onContentHover, onContentLeave }) => {
  return (
    <div
      id="pill-container"
      className="w-full h-full text-white flex flex-col items-center hardware-accelerated pt-0.5"
    >
      <div id="drag-handle" className="flex items-center justify-center">
        <DragHandle className="w-5 h-5" />
      </div>
      <div
        className="w-full h-full flex flex-col gap-y-[15px] overflow-y-scroll py-2 px-1 hide-scrollbar"
        onMouseEnter={onContentHover}
        onMouseLeave={onContentLeave}
      >
        {children}
      </div>
    </div>
  )
}

export default PillLayout
