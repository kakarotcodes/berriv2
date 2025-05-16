// views/PillView.tsx
import { useState } from 'react'
import { LayoutGrid, ClipboardPen, History } from 'lucide-react'

// Hooks
import { useElectron } from '@/hooks/useElectron'
import { useIdleOpacity, useDragHandle, usePillInit } from './hooks'

// Store & Controller
import { useViewStore } from '@/globalStore'
import { useViewController } from '@/controller'

// Layouts & UI
import { PillLayout } from '@/layouts'
import { SimpleIconComponent } from '@/components/ui'
import { PillButton, PillNotification } from './components'

const PillView: React.FC = () => {
  const { resizeWindow, savePillPosition } = useElectron()
  const { dimensions, setView, targetView, isTransitioning } = useViewStore()
  const { setActiveFeature } = useViewController()
  const [isTransitioningToDefault, setIsTransitioningToDefault] = useState(false)

  useIdleOpacity()
  useDragHandle(savePillPosition)
  usePillInit(savePillPosition, resizeWindow, dimensions)

  const switchToDefault = async () => {
    savePillPosition()
    setIsTransitioningToDefault(true)
    try {
      await window.electronAPI.animateViewTransition('default')
      setTimeout(() => setView('default'), 150)
    } catch (error) {
      console.error('Transition error:', error)
      setIsTransitioningToDefault(false)
    }
  }

  const startGoogleMeet = async () => {
    try {
      await window.electronAPI.startGoogleMeet()
    } catch (e) {
      console.error('Google Meet failed:', e)
      alert('Failed to start meeting.')
    }
  }

  if (isTransitioningToDefault || (targetView === 'default' && isTransitioning)) {
    return <div className="w-full h-full bg-transparent flex items-center justify-center" />
  }

  return (
    <PillLayout>
      <PillNotification count={99} onClick={() => setView('hover')} />

      <PillButton
        onClick={switchToDefault}
        featureKey="default"
        icon={<LayoutGrid color="white" size={14} />}
      />

      <PillButton icon={<SimpleIconComponent slug="siGooglecalendar" size={14} />} draggable />

      <PillButton
        onClick={() => {
          setActiveFeature('clipboard')
          setView('hover')
        }}
        featureKey="clipboard"
        icon={<History size={15} />}
        draggable
      />

      <PillButton
        onClick={() => {
          setActiveFeature('notes')
          setView('hover')
        }}
        featureKey="notes"
        icon={<ClipboardPen size={15} />}
        draggable
      />

      <PillButton
        onClick={startGoogleMeet}
        featureKey="googleMeet"
        icon={<SimpleIconComponent slug="siGooglemeet" size={14} />}
        draggable
      />
    </PillLayout>
  )
}

export default PillView
