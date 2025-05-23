// dependencies
import React from 'react'
import { GripHorizontal } from 'lucide-react'

// types
type PillLayoutProps = {
  children: React.ReactNode
}

const PillLayout: React.FC<PillLayoutProps> = ({ children }) => {
  return (
    <div
      id="pill-container"
      className="w-full h-full text-white animated-gradient flex flex-col hardware-accelerated rounded-lg overflow-hidden"
    >
      <div id="drag-handle" className="flex items-center justify-center pt-1">
        <GripHorizontal size={12} />
      </div>
      {children}
    </div>
  )
}

export default PillLayout
