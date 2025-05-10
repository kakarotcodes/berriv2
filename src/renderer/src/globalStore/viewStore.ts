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
    (set, get) => ({
      currentView: 'default',
      targetView: null,
      isTransitioning: false,
      dimensions: viewDimensions.default,
      setView: async (view) => {
        try {
          const currentView = get().currentView;
          
          // Step 1: Mark that we're starting a transition and set the target
          set({ 
            targetView: view,
            isTransitioning: true
          })
          
          // Handle transitions differently based on source and target views
          if (currentView === 'default' && view === 'pill') {
            // For default->pill transitions only: wait for resize to begin
            window.electronAPI.animateViewTransition(view)
            
            // Brief delay to let resize start before component change
            await new Promise(resolve => setTimeout(resolve, 50))
            
            // Update the view component
            set({
              currentView: view,
              dimensions: viewDimensions[view]
            })
            
            // Clear transition state after animation completes
            setTimeout(() => {
              set({
                isTransitioning: false,
                targetView: null
              })
            }, 150)
          } 
          else if (currentView === 'pill' && view === 'hover' || 
                   currentView === 'hover' && view === 'pill') {
            // For pill<->hover: keep existing behavior which works perfectly
            // Update view immediately, then resize
            set({
              currentView: view,
              dimensions: viewDimensions[view]
            })
            
            // Send the resize command to Electron in parallel
            window.electronAPI.animateViewTransition(view)
              .then(() => {
                set({ 
                  isTransitioning: false,
                  targetView: null
                })
              })
              .catch(error => {
                console.error('Window resize failed:', error)
                set({ 
                  isTransitioning: false,
                  targetView: null
                })
              })
          }
          else {
            // For all other transitions: small delay before component change
            window.electronAPI.animateViewTransition(view)
            
            // Brief delay to avoid visual glitches
            await new Promise(resolve => setTimeout(resolve, 80))
            
            // Update the view component
            set({
              currentView: view,
              dimensions: viewDimensions[view],
              isTransitioning: false,
              targetView: null
            })
          }
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
