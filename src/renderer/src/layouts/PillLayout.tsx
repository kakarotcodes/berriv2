// dependencies
import React from 'react'
import { GripHorizontal } from 'lucide-react'

// Gradient definition component
const FuturisticGradientDef = () => (
  <svg width="0" height="0" style={{ position: 'absolute' }}>
    <defs>
      <linearGradient id="futuristicGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a855f7" />
        <stop offset="30%" stopColor="#c084fc" />
        <stop offset="60%" stopColor="#e879f9" />
        <stop offset="100%" stopColor="#f472b6" />
      </linearGradient>
    </defs>
  </svg>
)

// Updated gradient style for drag handle to match icons
const futuristicGradientStyle = {
  stroke: 'url(#futuristicGradient)',
  fill: 'none',
  filter: 'drop-shadow(0 0 2px rgba(168, 85, 247, 0.4))',
  strokeWidth: 2.5
}

// types
type PillLayoutProps = {
  children: React.ReactNode
}

const PillLayout: React.FC<PillLayoutProps> = ({ children }) => {
  return (
    <div
      id="pill-container"
      className="w-full h-full text-white flex flex-col gap-y-[15px] hardware-accelerated rounded-lg pill-glow"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
      }}
    >
      <FuturisticGradientDef />
      <div id="drag-handle" className="flex items-center justify-center pt-1">
        <GripHorizontal size={12} strokeWidth={2.5} style={futuristicGradientStyle} />
      </div>
      {children}
    </div>
  )
}

export default PillLayout
