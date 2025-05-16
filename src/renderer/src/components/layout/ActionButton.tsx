// components/header/ActionButton.tsx
import React from 'react'

// controller
import { useViewController } from '@/controller/viewController'

// store
import { useViewStore } from '@/globalStore'

interface ActionButtonProps {
  featureKey: string
  icon: React.ReactNode
  onClick?: () => void
}

const ActionButton: React.FC<ActionButtonProps> = ({ featureKey, icon, onClick }) => {
  const { activeFeature } = useViewController()
  const { currentView } = useViewStore()

  const isActive = currentView === 'hover' && activeFeature === featureKey

  return (
    <button
      onClick={onClick}
      className={`rounded-full cursor-pointer border border-white/20 p-1.5 ${
        isActive ? 'bg-white/40' : 'hover:bg-white/40'
      }`}
    >
      {icon}
    </button>
  )
}

export default ActionButton
