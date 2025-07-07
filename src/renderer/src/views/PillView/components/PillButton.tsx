// components/pill/PillButton.tsx
import React from 'react'

interface PillButtonProps {
  onClick?: () => void
  icon: React.ReactNode
  draggable?: boolean
  featureKey?: string // optional key to check if active
}

const PillButton: React.FC<PillButtonProps> = ({ onClick, icon, draggable = false }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-center pill-button-hover`}
      id={draggable ? 'drag-handle' : undefined}
      style={{ willChange: 'transform, background-color' }}
    >
      <div>{icon}</div>
    </button>
  )
}

export default PillButton
