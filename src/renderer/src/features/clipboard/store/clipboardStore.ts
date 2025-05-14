import { create } from 'zustand'

// globalStore/viewController.ts
type Feature = 'clipboard' | null
type ViewType = 'pill' | 'default' | 'hover'

export const useViewController = create<{
  activeFeature: Feature
  currentView: ViewType
  setView: (view: ViewType) => void
  setFeature: (feature: Feature) => void
}>((set) => ({
  activeFeature: null,
  currentView: 'pill',
  setView: (view) => set({ currentView: view }),
  setFeature: (feature) => set({ activeFeature: feature })
}))
