// components/DefaultView.tsx
import { useViewStore } from '@/globalStore'
import { useElectron } from '@/hooks/useElectron'
import { useAuth } from '@/hooks/useAuth'

const DefaultView: React.FC = () => {
  const { setView } = useViewStore()
  const { setMainWindowResizable } = useElectron()
  const { isAuthenticated, isLoading, error, login, logout } = useAuth()

  const switchToPillView = () => {
    setMainWindowResizable(false)
    setView('pill')
  }

  const handleAuthAction = () => {
    if (isAuthenticated) {
      logout()
    } else {
      login()
    }
  }

  return (
    <div className="w-full h-full p-4 frosted-glass-main">
      {/* Your existing workspace content */}
      <div
        className="text-white text-center"
        style={{ color: '#ffffff', zIndex: 10, position: 'relative' }}
      >
        <button onClick={switchToPillView} className="cursor-pointer">
          Switch to Pill View
        </button>
        <div className="w-full h-20" />

        {/* Authentication Section */}
        <div className="space-y-4">
          {error && <div className="text-red-400 text-sm bg-red-900/20 p-2 rounded">{error}</div>}

          <button
            onClick={handleAuthAction}
            disabled={isLoading}
            className={`
              px-4 py-2 rounded-md cursor-pointer font-bold transition-colors
              ${
                isAuthenticated
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-slate-100'
              }
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isLoading ? 'Loading...' : isAuthenticated ? 'Sign Out' : 'Sign in with Google'}
          </button>

          {isAuthenticated && (
            <div className="text-green-400 text-sm">✓ Signed in successfully</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DefaultView
