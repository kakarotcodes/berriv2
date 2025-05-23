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
      className={`flex-1 w-full px-1 flex items-center justify-center border-gray-700 transition-colors duration-150 hover:bg-gray-500 ${
        isActive ? 'bg-gray-600' : ''
      }`}
      id={draggable ? 'drag-handle' : undefined}
    >
      {icon}
    </button>
  )
}

export default PillButton
