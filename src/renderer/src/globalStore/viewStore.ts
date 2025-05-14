// stores/viewStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// constants
import { WIDTH, HEIGHT } from './../../../constants/constants'

type ViewType = 'default' | 'pill' | 'hover' | 'expanded'

interface ViewState {
  currentView: ViewType
  targetView: ViewType | null
  isTransitioning: boolean
  dimensions: { width: number; height: number }
  isPinned: boolean
  setIsPinned: (pinned: boolean) => void
  togglePin: () => void
  setView: (view: ViewType) => Promise<void>
}

const viewDimensions: Record<ViewType, { width: number; height: number }> = {
  default: { width: WIDTH.DEFAULT, height: HEIGHT.DEFAULT }, // Fixed height to match main window creation
  pill: { width: WIDTH.PILL, height: HEIGHT.PILL },
  hover: { width: WIDTH.HOVER, height: HEIGHT.HOVER }, // Match main process dimension
  expanded: { width: 800, height: 600 }
}

export const useViewStore = create<ViewState>()(
  persist(
    (set, get) => ({
      currentView: 'default',
      targetView: null,
      isTransitioning: false,
      dimensions: viewDimensions.default,
      isPinned: false,
      
      setIsPinned: (pinned: boolean) => set({ isPinned: pinned }),
      
      togglePin: () => set((state) => ({ isPinned: !state.isPinned })),
      
      setView: async (view) => {
        try {
          const currentView = get().currentView

          // Step 1: Mark that we're starting a transition and set the target
          set({
            targetView: view,
            isTransitioning: true
          })

          // Handle transitions differently based on source and target views
          if (currentView === 'default' && view === 'pill') {
            // For default->pill transitions:
            // 1. Start the electron window resize
            window.electronAPI.animateViewTransition(view)

            // 2. Wait longer for the resize to be nearly complete before mounting pill
            await new Promise((resolve) => setTimeout(resolve, 250))

            // 3. Now it's almost pill-sized, so update the component
            set({
              currentView: view,
              dimensions: viewDimensions[view]
            })

            // 4. Clear transition state slightly after the change
            setTimeout(() => {
              set({
                isTransitioning: false,
                targetView: null
              })
            }, 150)
          } else if (currentView === 'pill' && view === 'hover') {
            // For pill->hover: optimize the transition timing
            // Start the resize animation first
            await window.electronAPI.animateViewTransition(view)

            // Then update the view component
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
            }, 100)
          } else if (currentView === 'hover' && view === 'pill') {
            // For hover->pill: optimize the transition timing
            // Start the resize animation first
            await window.electronAPI.animateViewTransition(view)

            // Wait for resize to complete
            await new Promise((resolve) => setTimeout(resolve, 200))

            // Then update the view component
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
            }, 100)
          } else {
            // For all other transitions: optimize timing
            window.electronAPI.animateViewTransition(view)

            // Wait for resize to complete
            await new Promise((resolve) => setTimeout(resolve, 200))

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
        // Only persist dimensions and pinned state
        dimensions: state.dimensions,
        isPinned: state.isPinned
      })
    }
  )
)
