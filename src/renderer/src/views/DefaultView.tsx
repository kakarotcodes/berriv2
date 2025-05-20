// components/DefaultView.tsx
import { useViewStore } from '@/globalStore'
import { useElectron } from '@/hooks/useElectron'

const DefaultView = () => {
  const { setView } = useViewStore()

  const { setMainWindowResizable } = useElectron()

  const switchToPillView = () => {
    setMainWindowResizable(false)
    setView('pill')
  }

  return (
    <div className="w-full h-full cursor-pointer bg-[#00000000] p-4">
      {/* Your existing workspace content */}
      <div className="text-white text-center">
        <button onClick={switchToPillView}>Switch to Pill View</button>
      </div>
    </div>
  )
}

export default DefaultView
