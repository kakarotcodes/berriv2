// views/PillView.tsx
import { memo, useEffect } from 'react'
import { useElectron } from '@/hooks/useElectron'
import { useViewStore } from '@/globalStore'

const PillView = memo(() => {
  const { resizeWindow } = useElectron()
  const { dimensions, setView } = useViewStore()

  useEffect(() => {
    try {
      resizeWindow(dimensions)
    } catch (error) {
      console.error('Error resizing window:', error)
    }
  }, [dimensions, resizeWindow])

  return (
    <div
      className="text-white cursor-pointer"
      onClick={() => {
        // Add immediate visual feedback
        useViewStore.setState({ currentView: 'default' })
        setView('default').catch(console.error)
      }}
    >
      I'm the pill view (Click to return to default)
    </div>
  )
})

export default PillView
