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
      className="w-full h-full text-white bg-gray-800 flex flex-col hardware-accelerated"
    >
      <div id="drag-handle" className="flex items-center justify-center pt-1">
        <GripHorizontal size={12} />
      </div>
      {children}
    </div>
  )
}

export default PillLayout
