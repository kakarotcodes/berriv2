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
    <div className="w-full h-full bg-red-400 text-white cursor-pointer flex justify-start items-center pl-2">
      <button
        onClick={() => {
          useViewStore.setState({ currentView: 'default' })
          setView('default').catch(console.error)
        }}
        className="bg-green-500 rounded-full w-10 h-10 cursor-pointer"
      />
    </div>
  )
})

export default PillView
