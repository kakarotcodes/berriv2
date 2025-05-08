// components/DefaultView.tsx
import React from 'react'
import { useElectron } from '@/hooks/useElectron' // Create this hook

const DefaultView = () => {
  const { resizeWindow } = useElectron()
  const [isExpanded, setIsExpanded] = React.useState(false)

  const handleWorkspaceClick = () => {
    const dimensions = isExpanded
      ? { width: 512, height: 288 } // Default size
      : { width: 200, height: 48 } // Expanded size

    resizeWindow(dimensions)
    setIsExpanded(!isExpanded)
  }

  return (
    <div
      className="w-full h-full cursor-pointer bg-gray-800/50 p-4 transition-all rounded-[1000px] transform-gpu will-change-transform"
      onClick={handleWorkspaceClick}
    >
      {/* Your existing workspace content */}
      <div className="text-white text-center">
        <p>Click anywhere in this workspace to {isExpanded ? 'collapse' : 'expand'}</p>
      </div>
    </div>
  )
}

export default DefaultView
