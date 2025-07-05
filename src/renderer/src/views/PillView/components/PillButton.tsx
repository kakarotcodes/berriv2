// components/pill/PillButton.tsx
import React from 'react'
import { useViewController } from '@/controller/viewController' // Adjust import as needed
import { useViewStore } from '@/globalStore'

interface PillButtonProps {
  onClick?: () => void
  icon: React.ReactNode
  draggable?: boolean
  featureKey?: string // optional key to check if active
}

const PillButton: React.FC<PillButtonProps> = ({
  onClick,
  icon,
  draggable = false,
  featureKey
}) => {
  const { activeFeature } = useViewController()
  const { currentView } = useViewStore()

  const isActive = currentView === 'hover' && featureKey && activeFeature === featureKey

  return (
    <button
      onClick={onClick}
      className={`w-full px-1 flex items-center justify-center border-gray-700 transition-colors duration-75 pill-button-hover ${
        isActive ? 'bg-gray-600' : ''
      }`}
      id={draggable ? 'drag-handle' : undefined}
      style={{ willChange: 'transform, background-color' }}
    >
      <div className="pill-icon-hover">{icon}</div>
    </button>
  )
}

export default PillButton
