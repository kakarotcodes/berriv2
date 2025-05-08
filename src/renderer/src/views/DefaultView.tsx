// components/DefaultView.tsx
import { useViewStore } from '@/globalStore'

const DefaultView = () => {
  const { setView } = useViewStore()

  return (
    <div className="w-full h-full cursor-pointer bg-gray-800/50 p-4 transition-all transform-gpu will-change-transform">
      {/* Your existing workspace content */}
      <div className="text-white text-center">
        <button onClick={() => setView('pill')}>Switch to Pill View</button>
      </div>
    </div>
  )
}

export default DefaultView
