// src/renderer/src/hooks/useView.ts

import useViewStore, { ViewMode } from '../globalStore/viewStore'

/**
 * Hook for accessing the view store with proper typing
 *
 * @example
 * // Basic usage
 * const { viewMode, transitionTo } = useView()
 *
 * @example
 * // Using the view state in a component
 * function ViewSwitcher() {
 *   const { viewMode, transitionTo } = useView()
 *
 *   return (
 *     <div>
 *       <p>Current view: {viewMode}</p>
 *       <button onClick={() => transitionTo('pill')}>
 *         Switch to Pill
 *       </button>
 *     </div>
 *   )
 * }
 */
export function useView() {
  const { viewMode, isTransitioning, setViewMode, transitionTo } = useViewStore()
  return { viewMode, isTransitioning, setViewMode, transitionTo }
}

/**
 * Exports the ViewMode type for type safety in consumer components
 */
export type { ViewMode }
