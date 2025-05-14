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

          // Start transition - show blank state
          set({
            targetView: view,
            isTransitioning: true
          })

          // All view transitions follow the same pattern:
          // 1. Start with an empty window
          // 2. Resize window without any animations
          // 3. Update the component
          
          // Update dimensions immediately to match the target
          set({
            dimensions: viewDimensions[view]
          });
          
          // Start the resize animation
          await window.electronAPI.animateViewTransition(view)

          // Wait for a small fixed time for resize to complete
          await new Promise((resolve) => setTimeout(resolve, 200))

          // Update to the new view
          set({
            currentView: view
          })

          // End transition - show the actual content
          setTimeout(() => {
            set({
              isTransitioning: false,
              targetView: null
            })
          }, 50)
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
