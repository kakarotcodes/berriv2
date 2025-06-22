// dependencies
import { create } from 'zustand'

// globalStore/viewController.ts
export type Feature = 'clipboard' | 'calendar' | 'notes' | 'screenshots' | 'googleMeet' | 'mail' | null

export const useViewController = create<{
  activeFeature: Feature
  setActiveFeature: (feature: Feature) => void
}>((set) => ({
  activeFeature: 'clipboard',
  currentView: 'pill',
  setActiveFeature: (feature) => set({ activeFeature: feature })
}))
