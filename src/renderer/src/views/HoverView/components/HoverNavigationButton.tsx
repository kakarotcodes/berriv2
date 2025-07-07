// controller
import { useViewController } from '@/controller'

// store
import { useViewStore } from '@/globalStore'

interface HoverNavigationButtonProps {
  featureKey: string
  icon: React.ReactNode
  onClick?: () => void
}

const HoverNavigationButton: React.FC<HoverNavigationButtonProps> = ({
  featureKey,
  icon,
  onClick
}) => {
  const { activeFeature } = useViewController()
  const { currentView } = useViewStore()

  const isActive = currentView === 'hover' && activeFeature === featureKey

  return (
    <button onClick={onClick} className={`cursor-pointer flex flex-col items-center gap-y-1`}>
      {icon}
      {isActive && <div className="h-1 w-1 bg-white rounded-[8px]" />}
    </button>
  )
}

export default HoverNavigationButton
