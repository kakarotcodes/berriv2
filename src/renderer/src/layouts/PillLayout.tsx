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

// Optimized gradient style for drag handle with OKLCH color - reduced glow
const futuristicGradientStyle = {
  stroke: 'oklch(90.1% 0.076 70.697)',
  fill: 'none',
  filter: 'drop-shadow(0 0 2px oklch(90.1% 0.076 70.697 / 0.6)) drop-shadow(0 0 4px oklch(55.8% 0.288 302.321 / 0.3))',
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
      className="w-full h-full text-white animated-gradient pulse-gradient flex flex-col gap-y-[15px] hardware-accelerated rounded-lg overflow-hidden animated-border animated-glow"
      style={{
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)', // Safari support
        backgroundColor: 'rgba(0, 0, 0, 0.25)' // Slightly darker for better contrast with reduced blur
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
