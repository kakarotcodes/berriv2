// src/renderer/src/utils/viewTransitions.ts

import { ViewMode } from '../globalStore/viewStore'

/**
 * A utility object representing all valid view transitions
 * Useful for testing and documentation
 */
export const viewTransitions: Record<ViewMode, Record<ViewMode, boolean>> = {
  default: {
    default: false, // Same state, not a transition
    pill: true, // Valid: default → pill
    hover: false, // Invalid: default → hover
    expanded: true // Valid: default → expanded
  },
  pill: {
    default: true, // Valid: pill → default
    pill: false, // Same state, not a transition
    hover: true, // Valid: pill → hover
    expanded: true // Valid: pill → expanded
  },
  hover: {
    default: false, // Invalid: hover → default
    pill: true, // Valid: hover → pill
    hover: false, // Same state, not a transition
    expanded: false // Invalid: hover → expanded
  },
  expanded: {
    default: true, // Valid: expanded → default
    pill: true, // Valid: expanded → pill
    hover: false, // Invalid: expanded → hover
    expanded: false // Same state, not a transition
  }
}

/**
 * Gets all possible target modes for a given source mode
 * @param fromMode The starting view mode
 * @returns Array of valid destination modes
 */
export function getValidTransitions(fromMode: ViewMode): ViewMode[] {
  return Object.entries(viewTransitions[fromMode])
    .filter(([_, isValid]) => isValid)
    .map(([mode]) => mode as ViewMode)
}
