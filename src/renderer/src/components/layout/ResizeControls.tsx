// components/header/ResizeControls.tsx
import React, { useState } from 'react'
import { X, ChevronsUpDown } from 'lucide-react'

// store
import { useViewStore } from '@/globalStore'

// hooks
import { useElectron } from '@/hooks/useElectron'

// types
import { ViewType } from 'src/types/types'

const ResizeControls: React.FC = () => {
  const { setView } = useViewStore()
  const { setMainWindowResizable } = useElectron()

  const [hovered, setHovered] = useState<ViewType | null>(null)

  const buttons: {
    view: ViewType
    color: string
    Icon: typeof X
    rotate?: string
    targetView: ViewType
  }[] = [
    { view: 'pill', color: '#FF5F57', Icon: X, targetView: 'pill' },
    {
      view: 'default',
      color: '#28C840',
      Icon: ChevronsUpDown,
      rotate: '-rotate-45',
      targetView: 'default'
    }
  ]

  const resizeToPillView = (targetView: ViewType) => {
    setView(targetView)
    setMainWindowResizable(false)
  }

  return (
    <div id="resize-btn-grp" className="flex items-center justify-center gap-2 h-full">
      {buttons.map(({ view, color, Icon, rotate, targetView }) => (
        <button
          key={view}
          onClick={() => resizeToPillView(targetView)}
          onMouseEnter={() => setHovered(view)}
          onMouseLeave={() => setHovered(null)}
          className="w-3 h-3 rounded-full hover:brightness-90 relative flex items-center justify-center"
          style={{ backgroundColor: color }}
        >
          {hovered === view && (
            <Icon
              size={10}
              strokeWidth={2.5}
              color="black"
              className={`absolute ${rotate ?? ''}`}
            />
          )}
        </button>
      ))}
    </div>
  )
}

export default ResizeControls
