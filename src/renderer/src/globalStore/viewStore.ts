// stores/viewStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { toast } from 'react-toastify'

// constants
import { WIDTH, HEIGHT } from './../../../constants/constants'

type ViewType = 'default' | 'pill' | 'hover'

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
  pill: { width: WIDTH.PILL, height: HEIGHT.PILL_COLLAPSED },
  hover: { width: WIDTH.HOVER, height: HEIGHT.HOVER } // Match main process dimension
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
          const state = get()

          // Dismiss all toasts when switching to pill view to prevent visual issues
          if (view === 'pill') {
            toast.dismiss()
          }

          // 1️⃣ Start transition immediately - no forced delays
          set({
            targetView: view,
            isTransitioning: true
          })

          // Save hover dimensions before leaving hover view
          if (state.currentView === 'hover' && view !== 'hover') {
            console.log('[VIEW] Switching from hover view, saving dimensions')
            try {
              const bounds = await window.electronAPI.getWindowBounds()
              if (bounds?.width && bounds?.height) {
                if (bounds.width !== WIDTH.PILL && bounds.height !== HEIGHT.PILL_COLLAPSED) {
                  console.log('[VIEW] Saving hover dimensions:', {
                    width: bounds.width,
                    height: bounds.height
                  })
                  window.electronAPI.saveHoverSize({ width: bounds.width, height: bounds.height })
                }
              }
            } catch (e) {
              console.error('[VIEW] Failed to save hover dimensions:', e)
            }
          }

          // Get target dimensions
          let updatedDimensions = viewDimensions[view]

          // Load saved hover dimensions
          if (view === 'hover') {
            console.log('[VIEW] Switching to hover view, loading saved dimensions')
            try {
              const savedSize = await window.electronAPI.getSavedHoverSize()
              if (savedSize?.width && savedSize?.height) {
                if (savedSize.width !== WIDTH.PILL && savedSize.height !== HEIGHT.PILL_COLLAPSED) {
                  console.log('[VIEW] Using saved hover dimensions:', savedSize)
                  updatedDimensions = savedSize
                }
              }
            } catch (e) {
              console.error('[VIEW] Error loading saved hover size:', e)
            }
          }

          // 2️⃣ Start the native window animation
          console.log('[VIEW] 🚀 About to call animateViewTransition with view:', view)
          await window.electronAPI.animateViewTransition(view)
          console.log('[VIEW] ✅ animateViewTransition call completed')

          // 3️⃣ Wait for the real "done" signal with fast fallback
          await new Promise<void>((resolve) => {
            let resolved = false

            const cleanup = window.electronAPI.onViewTransitionDone((completedView) => {
              if (completedView === view && !resolved) {
                resolved = true
                cleanup()
                resolve()
              }
            })

            // Quick fallback for snappy content loading
            setTimeout(() => {
              if (!resolved) {
                resolved = true
                cleanup()
                resolve()
              }
            }, 140) // Fast but safe - prevents flicker
          })

          // Apply saved dimensions for hover view after animation completes
          if (view === 'hover') {
            window.electronAPI.fixHoverDimensions()
          }

          // 4️⃣ NOW update React state — one clean update, no flicker
          set({
            dimensions: updatedDimensions,
            currentView: view,
            isTransitioning: false,
            targetView: null
          })

          console.log(`[VIEW] Transition to ${view} completed successfully`)
        } catch (error) {
          console.error('[VIEW] View transition failed:', error)
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
