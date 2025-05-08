// stores/viewStore.ts
import { create } from 'zustand'

type ViewType = 'default' | 'pill' | 'hover' | 'expanded'

interface ViewState {
  currentView: ViewType
  targetView: ViewType | null
  dimensions: { width: number; height: number }
  setView: (view: ViewType) => Promise<void>
}

const viewDimensions: Record<ViewType, { width: number; height: number }> = {
  default: { width: 512, height: 512 },
  pill: { width: 100, height: 48 },
  hover: { width: 240, height: 240 },
  expanded: { width: 800, height: 600 }
}

export const useViewStore = create<ViewState>((set) => ({
  currentView: 'default',
  targetView: null,
  dimensions: viewDimensions.default,
  setView: async (view) => {
    set({ targetView: view })
    // Send IPC message to main process
    await window.electronAPI.animateViewTransition(view)
    set({ currentView: view, dimensions: viewDimensions[view] })
  }
}))
