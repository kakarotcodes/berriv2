// dependencies
import { useEffect } from 'react'

// assets
import GoogleCalendar from '@/assets/pill-icons/calendar.svg?react'
import Gmail from '@/assets/pill-icons/gmail.svg?react'
import ClipBoardHistory from '@/assets/pill-icons/clipboard.svg?react'
import GoogleMeet from '@/assets/pill-icons/meet.svg?react'
import Notes from '@/assets/pill-icons/notes.svg?react'
import Snipping from '@/assets/pill-icons/snipping.svg?react'
import Record from '@/assets/pill-icons/record.svg?react'
import CameraFolder from '@/assets/pill-icons/camera-folder.svg?react'

// Hooks
import { useElectron } from '@/hooks/useElectron'
import { useIdleOpacity, useDragHandle, usePillInit } from '../hooks'

// Store & Controller
import { useViewStore } from '@/globalStore'
import { useViewController } from '@/controller'

// Layouts & UI
import { PillLayout } from '../layouts'
import { PillButton } from './components'
import { Feature } from '@/controller/viewController'

// Constants
import { WIDTH, HEIGHT } from '../../../../constants/constants'

const PillView: React.FC = () => {
  const { resizeWindow, savePillPosition, setMainWindowResizable } = useElectron()
  const { setView, targetView, isTransitioning, currentView } = useViewStore()
  const { setActiveFeature } = useViewController()

  useIdleOpacity()
  useDragHandle(savePillPosition)
  usePillInit()

  // Ensure proper window state when pill view mounts
  useEffect(() => {
    // Only resize to pill dimensions if we're actually in pill view
    if (currentView === 'pill') {
      setMainWindowResizable(false)

      resizeWindow({ width: WIDTH.PILL, height: HEIGHT.PILL_COLLAPSED }, 400)
    }
  }, [setMainWindowResizable, resizeWindow, currentView])

  // todo: to be used later
  // const switchToDefaultView = async () => {
  //   savePillPosition()
  //   setMainWindowResizable(false)
  //   setView('default')
  // }

  const switchToHoverView = (view: Feature) => {
    setActiveFeature(view)
    setView('hover')
    setMainWindowResizable(true)
  }

  const startGoogleMeet = async () => {
    try {
      await window.electronAPI.startGoogleMeet()
    } catch (e) {
      console.error('Google Meet failed:', e)
      alert('Failed to start meeting.')
    }
  }

  const openScreenCapture = async () => {
    console.log('[SCREEN_CAPTURE] Camera button clicked')
    try {
      console.log('[SCREEN_CAPTURE] Calling electronAPI.screenCapture.openToolbar()')
      const result = await window.electronAPI.screenCapture.openToolbar()
      console.log('[SCREEN_CAPTURE] Result:', result)
      if (!result.success) {
        console.error('Screen capture failed:', result.error)
        alert('Failed to open screen capture toolbar.')
      } else {
        console.log('[SCREEN_CAPTURE] Screen capture toolbar opened successfully')
      }
    } catch (e) {
      console.error('Screen capture failed:', e)
      alert('Failed to open screen capture toolbar.')
    }
  }

  const openSnippingTool = async () => {
    console.log('[SNIPPING_TOOL] Scissors button clicked')
    try {
      console.log('[SNIPPING_TOOL] Calling electronAPI.screenCapture.openSnippingTool()')
      const result = await window.electronAPI.screenCapture.openSnippingTool()
      console.log('[SNIPPING_TOOL] Result:', result)
      if (!result.success) {
        console.error('Snipping tool failed:', result.error)
        alert('Failed to open snipping tool.')
      } else {
        console.log('[SNIPPING_TOOL] Snipping tool opened successfully')
      }
    } catch (e) {
      console.error('Snipping tool failed:', e)
      alert('Failed to open snipping tool.')
    }
  }

  if (targetView === 'default' && isTransitioning) {
    return <div className="w-full h-full bg-transparent flex items-center justify-center" />
  }

  return (
    <PillLayout>
      <PillButton
        onClick={() => {
          switchToHoverView('notes')
        }}
        featureKey="notes"
        icon={<Notes className="w-5 h-5" />}
      />

      <PillButton
        onClick={openSnippingTool}
        featureKey="snippingTool"
        icon={<Snipping className="w-4.5 h-4.5" />}
        draggable
      />

      <PillButton
        onClick={() => {
          switchToHoverView('calendar')
        }}
        featureKey="calendar"
        icon={<GoogleCalendar className="w-4.5 h-4.5" />}
      />

      <PillButton
        onClick={startGoogleMeet}
        featureKey="googleMeet"
        icon={<GoogleMeet className="w-4.5 h-4.5" />}
        draggable
      />

      <PillButton
        onClick={openScreenCapture}
        featureKey="screenCapture"
        icon={<Record className="w-4.5 h-4.5" />}
        draggable
      />

      <PillButton
        onClick={() => {
          switchToHoverView('clipboard')
        }}
        featureKey="clipboard"
        icon={<ClipBoardHistory className="w-5.5 h-5.5" />}
        draggable
      />

      <PillButton
        onClick={() => {
          switchToHoverView('screenshots')
        }}
        featureKey="screenshots"
        icon={<CameraFolder className="w-5 h-5" />}
        draggable
      />

      <PillButton
        onClick={() => {
          switchToHoverView('mail')
        }}
        featureKey="mail"
        icon={<Gmail className="w-4.5 h-4.5" />}
        draggable
      />
    </PillLayout>
  )
}

export default PillView
