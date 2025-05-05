// src/renderer/src/store/viewStore.ts

import { create } from 'zustand'

/**
 * Valid view modes for the overlay application
 */
export type ViewMode = 'default' | 'pill' | 'hover' | 'expanded'

/**
 * ViewState interface defining the structure and actions for view state management
 */
export interface ViewState {
  /** Current active view mode */
  viewMode: ViewMode
  /** Whether a transition animation is currently in progress */
  isTransitioning: boolean
  /** Directly sets the view mode without transition validation */
  setViewMode: (mode: ViewMode) => void
  /** Attempts to transition to a new view mode, validating the transition first */
  transitionTo: (mode: ViewMode) => void
}

/**
 * Map defining valid transitions between view modes
 * Each key represents a starting view mode with an array of valid destination modes
 */
const VALID_TRANSITIONS: Record<ViewMode, ViewMode[]> = {
  default: ['pill', 'expanded'],
  pill: ['hover', 'default', 'expanded'],
  hover: ['pill'],
  expanded: ['default', 'pill']
}

/**
 * Checks if a transition between two view modes is valid
 * @param from Current view mode
 * @param to Destination view mode
 * @returns Boolean indicating if the transition is allowed
 */
const isValidTransition = (from: ViewMode, to: ViewMode): boolean => {
  return VALID_TRANSITIONS[from]?.includes(to) || false
}

/**
 * Zustand store for managing view state in the Electron overlay app
 * Handles view mode changes and provides transition state tracking
 */
const useViewStore = create<ViewState>((set, get) => ({
  // Initial state
  viewMode: 'default',
  isTransitioning: false,

  // Immediately set the view mode without transition validation
  setViewMode: (mode) => set({ viewMode: mode }),

  // Attempt to change view mode with transition validation
  transitionTo: (mode) => {
    const currentMode = get().viewMode

    // Skip if trying to transition to the current mode
    if (currentMode === mode) return

    // Validate the transition
    if (!isValidTransition(currentMode, mode)) {
      console.warn(`Invalid transition attempted: ${currentMode} → ${mode}`)
      return
    }

    // Start transition
    set({ isTransitioning: true })

    // Set new view mode
    set({ viewMode: mode })

    // End transition after animation completes (assuming 300ms transition)
    setTimeout(() => {
      set({ isTransitioning: false })
    }, 300)
  }
}))

export default useViewStore
