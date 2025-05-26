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
          const state = get();
          
          // Start transition - show blank state AFTER getting current dimensions
          set({
            targetView: view,
            isTransitioning: true
          });
          
          // IMPORTANT: Save hover dimensions ONLY when leaving hover view
          // AND do it before any window resize happens
          if (state.currentView === 'hover' && view !== 'hover') {
            console.log('[VIEW] Switching from hover view, saving dimensions');
            try {
              // Get current window bounds before any transitions happen
              const bounds = await window.electronAPI.getWindowBounds();
              
              if (bounds?.width && bounds?.height) {
                // Verify we're actually still in hover view (checks size is not pill size)
                if (bounds.width !== WIDTH.PILL && bounds.height !== HEIGHT.PILL) {
                  console.log('[VIEW] Saving hover dimensions:', { width: bounds.width, height: bounds.height });
                  
                  // First save directly to electron-store
                  window.electronAPI.saveHoverSize({ width: bounds.width, height: bounds.height });
                  
                  // For transition to pill view, ensure pill appears at a sensible position
                  if (view === 'pill') {
                    console.log('[VIEW] Transitioning to pill view, ensuring smooth position transition');
                    // Position will be handled by animateViewTransition
                  }
                } else {
                  console.log('[VIEW] Skip saving - window already changed to non-hover size');
                }
              }
            } catch (e) {
              console.error('[VIEW] Failed to save hover dimensions:', e);
            }
          }

          // Get dimensions for the target view
          let updatedDimensions = viewDimensions[view];
          
          // Special handling for hover view
          if (view === 'hover') {
            console.log('[VIEW] Switching to hover view, loading saved dimensions');
            try {
              const savedSize = await window.electronAPI.getSavedHoverSize();
              
              if (savedSize?.width && savedSize?.height) {
                // Additional validation - don't use pill dimensions as hover dimensions
                if (savedSize.width !== WIDTH.PILL && savedSize.height !== HEIGHT.PILL) {
                  console.log('[VIEW] Using saved hover dimensions:', savedSize);
                  updatedDimensions = savedSize;
                } else {
                  console.log('[VIEW] Ignoring invalid saved dimensions (pill size)');
                }
              } else {
                console.log('[VIEW] No valid saved dimensions, using defaults:', viewDimensions.hover);
              }
            } catch (e) {
              console.error('[VIEW] Error loading saved hover size:', e);
            }
          }

          // Update dimensions to match the target view
          set({ dimensions: updatedDimensions });

          // Animate window transition
          await window.electronAPI.animateViewTransition(view);
          
          // For hover view, explicitly apply the saved dimensions
          if (view === 'hover') {
            // Small delay to ensure the animation completes first
            setTimeout(() => {
              window.electronAPI.fixHoverDimensions();
            }, 100);
          }

          // Wait for resize animation to complete
          await new Promise(resolve => setTimeout(resolve, 200));

          // Update to the new view
          set({ currentView: view });

          // End transition - show the actual content
          setTimeout(() => {
            set({
              isTransitioning: false,
              targetView: null
            });
          }, 50);
          
        } catch (error) {
          console.error('[VIEW] View transition failed:', error);
          set({
            targetView: null,
            isTransitioning: false
          });
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
