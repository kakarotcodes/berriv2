// stores/viewStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ViewType = 'default' | 'pill' | 'hover' | 'expanded'

interface ViewState {
  currentView: ViewType
  targetView: ViewType | null
  isTransitioning: boolean
  dimensions: { width: number; height: number }
  setView: (view: ViewType) => Promise<void>
}

const viewDimensions: Record<ViewType, { width: number; height: number }> = {
  default: { width: 512, height: 512 },
  pill: { width: 100, height: 48 },
  hover: { width: 240, height: 240 },
  expanded: { width: 800, height: 600 }
}

export const useViewStore = create<ViewState>()(
  persist(
    (set) => ({
      currentView: 'default',
      targetView: null,
      isTransitioning: false,
      dimensions: viewDimensions.default,
      setView: async (view) => {
        try {
          // Step 1: Mark that we're starting a transition and set the target
          set({ 
            targetView: view,
            isTransitioning: true
          })
          
          // Step 2: Send the resize command to Electron first
          await window.electronAPI.animateViewTransition(view)
          
          // Step 3: Wait a moment for the window resize to complete
          await new Promise(resolve => setTimeout(resolve, 200))
          
          // Step 4: Now update the view component
          set({
            currentView: view,
            dimensions: viewDimensions[view],
            isTransitioning: false,
            targetView: null
          })
        } catch (error) {
          console.error('View transition failed:', error)
          set({ 
            targetView: null,
            isTransitioning: false
          })
        }
      }
    }),
    {
      name: 'view-storage',
      partialize: (state) => ({
        currentView: state.currentView,
        dimensions: state.dimensions
      })
    }
  )
)
