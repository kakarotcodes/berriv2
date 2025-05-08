// views/PillView.tsx
import { memo, useEffect } from 'react'
import { useElectron } from '@/hooks/useElectron'
import { useViewStore } from '@/globalStore'

const PillView = memo(() => {
  const { resizeWindow } = useElectron()
  const { dimensions } = useViewStore()

  const { setView } = useViewStore()

  // Keep window size in sync
  useEffect(() => {
    resizeWindow(dimensions)
  }, [dimensions, resizeWindow])

  return <div className="text-white">I'm the pill view</div>
})

export default PillView
