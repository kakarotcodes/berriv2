// dependencies
import React from 'react'

// icons
import DragHandle from '@/assets/icons/drag-handle.svg?react'

// types
type PillLayoutProps = {
  children: React.ReactNode
}

const PillLayout: React.FC<PillLayoutProps> = ({ children }) => {
  return (
    <div
      id="pill-container"
      className="w-full h-full text-white flex flex-col items-center hardware-accelerated pt-0.5"
    >
      <div id="drag-handle" className="flex items-center justify-center">
        <DragHandle className="w-5 h-5" />
      </div>
      <div className="w-full h-full flex flex-col gap-y-[15px] overflow-y-scroll pt-2 px-1">
        {children}
      </div>
    </div>
  )
}

export default PillLayout
