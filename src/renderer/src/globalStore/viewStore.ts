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
          // Save current hover size BEFORE starting the transition
          const state = get()

          // AGGRESSIVE anti-flicker for hover -> pill transition
          if (state.currentView === 'hover' && view === 'pill') {
            // Immediately hide all content
            set({
              targetView: view,
              isTransitioning: true
            })

            // Disable all CSS transitions during resize
            const style = document.createElement('style')
            style.id = 'disable-transitions'
            style.innerHTML =
              '*, *::before, *::after { transition: none !important; animation: none !important; }'
            document.head.appendChild(style)

            // Force immediate render of blank state
            await new Promise((resolve) => setTimeout(resolve, 32)) // Two frames

            console.log('[VIEW] Hover->Pill: Hiding content and starting window resize')
          } else if (state.currentView === 'hover' && view !== 'hover') {
            set({
              targetView: view,
              isTransitioning: true
            })
            await new Promise((resolve) => setTimeout(resolve, 16))
          } else {
            set({
              targetView: view,
              isTransitioning: true
            })
          }

          // IMPORTANT: Save hover dimensions ONLY when leaving hover view
          if (state.currentView === 'hover' && view !== 'hover') {
            console.log('[VIEW] Switching from hover view, saving dimensions')
            try {
              const bounds = await window.electronAPI.getWindowBounds()

              if (bounds?.width && bounds?.height) {
                if (bounds.width !== WIDTH.PILL && bounds.height !== HEIGHT.PILL) {
                  console.log('[VIEW] Saving hover dimensions:', {
                    width: bounds.width,
                    height: bounds.height
                  })

                  window.electronAPI.saveHoverSize({ width: bounds.width, height: bounds.height })

                  if (view === 'pill') {
                    console.log(
                      '[VIEW] Transitioning to pill view, ensuring smooth position transition'
                    )
                  }
                } else {
                  console.log('[VIEW] Skip saving - window already changed to non-hover size')
                }
              }
            } catch (e) {
              console.error('[VIEW] Failed to save hover dimensions:', e)
            }
          }

          // Get dimensions for the target view
          let updatedDimensions = viewDimensions[view]

          // Special handling for hover view
          if (view === 'hover') {
            console.log('[VIEW] Switching to hover view, loading saved dimensions')
            try {
              const savedSize = await window.electronAPI.getSavedHoverSize()

              if (savedSize?.width && savedSize?.height) {
                if (savedSize.width !== WIDTH.PILL && savedSize.height !== HEIGHT.PILL) {
                  console.log('[VIEW] Using saved hover dimensions:', savedSize)
                  updatedDimensions = savedSize
                } else {
                  console.log('[VIEW] Ignoring invalid saved dimensions (pill size)')
                }
              } else {
                console.log(
                  '[VIEW] No valid saved dimensions, using defaults:',
                  viewDimensions.hover
                )
              }
            } catch (e) {
              console.error('[VIEW] Error loading saved hover size:', e)
            }
          }

          // Update dimensions to match the target view
          set({ dimensions: updatedDimensions })

          // Animate window transition
          await window.electronAPI.animateViewTransition(view)

          // For hover view, explicitly apply the saved dimensions
          if (view === 'hover') {
            setTimeout(() => {
              window.electronAPI.fixHoverDimensions()
            }, 100)
          }

          // Extended wait for hover->pill to ensure window is fully resized
          const waitTime = state.currentView === 'hover' && view === 'pill' ? 400 : 200
          await new Promise((resolve) => setTimeout(resolve, waitTime))

          // Update to the new view
          set({ currentView: view })

          // Re-enable CSS transitions after resize is complete
          if (state.currentView === 'hover' && view === 'pill') {
            const disableStyle = document.getElementById('disable-transitions')
            if (disableStyle) {
              document.head.removeChild(disableStyle)
            }
            console.log('[VIEW] Hover->Pill: Re-enabled CSS transitions')
          }

          // Very short delay before showing content
          const endTransitionDelay = state.currentView === 'hover' && view === 'pill' ? 20 : 50
          setTimeout(() => {
            set({
              isTransitioning: false,
              targetView: null
            })
          }, endTransitionDelay)
        } catch (error) {
          console.error('[VIEW] View transition failed:', error)
          // Clean up disabled transitions in case of error
          const disableStyle = document.getElementById('disable-transitions')
          if (disableStyle) {
            document.head.removeChild(disableStyle)
          }
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
