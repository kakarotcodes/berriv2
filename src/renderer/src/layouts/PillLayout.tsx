// dependencies
import React from 'react'

// types
type PillLayoutProps = {
  children: React.ReactNode
}

const PillLayout: React.FC<PillLayoutProps> = ({ children }) => {
  return (
    <div
      id="pill-container"
      className="w-full h-full text-white flex flex-col gap-y-[15px] hardware-accelerated frosted-glass-base frosted-glass-pill"
    >
      <div id="drag-handle" className="flex items-center justify-center pt-1">
        <svg width="20" height="20" viewBox="0 0 60 20" xmlns="http://www.w3.org/2000/svg">
          <g fill="#999999">
            <circle cx="5" cy="5" r="2" />
            <circle cx="15" cy="5" r="2" />
            <circle cx="25" cy="5" r="2" />
            <circle cx="35" cy="5" r="2" />
            <circle cx="45" cy="5" r="2" />
            <circle cx="55" cy="5" r="2" />

            <circle cx="5" cy="15" r="2" />
            <circle cx="15" cy="15" r="2" />
            <circle cx="25" cy="15" r="2" />
            <circle cx="35" cy="15" r="2" />
            <circle cx="45" cy="15" r="2" />
            <circle cx="55" cy="15" r="2" />
          </g>
        </svg>
      </div>
      {children}
    </div>
  )
}

export default PillLayout
