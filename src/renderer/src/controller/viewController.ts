// dependencies
import { create } from 'zustand'

// globalStore/viewController.ts
type Feature = 'clipboard' | 'calendar' | 'notes' | null

export const useViewController = create<{
  activeFeature: Feature
  setActiveFeature: (feature: Feature) => void
}>((set) => ({
  activeFeature: null,
  currentView: 'pill',
  setActiveFeature: (feature) => set({ activeFeature: feature })
}))
