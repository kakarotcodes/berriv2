// components/pill/PillButton.tsx
import React from 'react'

interface PillButtonProps {
  onClick?: () => void
  icon: React.ReactNode
  draggable?: boolean
}

const PillButton: React.FC<PillButtonProps> = ({ onClick, icon, draggable = false }) => (
  <button
    onClick={onClick}
    className="flex-1 w-full px-1 flex items-center justify-center border-gray-700 hover:bg-gray-500 transition-colors"
    id={draggable ? 'drag-handle' : undefined}
  >
    {icon}
  </button>
)

export default PillButton
