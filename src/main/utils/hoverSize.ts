import { prefs } from './prefs'
import { WIDTH, HEIGHT } from '../../constants/constants'

/**
 * Gets the saved hover window dimensions from electron-store
 * Returns default size (500x500) if none found
 */
export function getSavedHoverSize(): { width: number; height: number } {
  // Read from preferences store with fallback to defaults
  const width = prefs.get('hoverWidth') ?? 500
  const height = prefs.get('hoverHeight') ?? 500
  
  console.log('[HOVER] Retrieved saved hover size:', { width, height })
  return { width, height }
}

/**
 * Saves the hover window dimensions to electron-store
 * Validates input dimensions before saving
 */
export function saveHoverSize(width: number, height: number): boolean {
  console.log('[HOVER] Saving hover size:', { width, height })
  
  // Validate dimensions - basic type checking
  if (typeof width !== 'number' || typeof height !== 'number' || 
      width <= 0 || height <= 0 || 
      isNaN(width) || isNaN(height)) {
    console.error('[HOVER] Invalid dimensions provided:', { width, height })
    return false
  }
  
  // Additional validation - don't save pill dimensions as hover dimensions
  // And ensure minimum reasonable size
  if (width === WIDTH.PILL || height === HEIGHT.PILL || width < 100 || height < 100) {
    console.error('[HOVER] Rejecting suspicious hover dimensions (too small):', { width, height })
    return false
  }
  
  try {
    // Save to prefs store
    prefs.set('hoverWidth', Math.round(width))
    prefs.set('hoverHeight', Math.round(height))
    
    // Verify the save operation
    const savedWidth = prefs.get('hoverWidth')
    const savedHeight = prefs.get('hoverHeight')
    
    console.log('[HOVER] Verified saved dimensions:', { 
      width: savedWidth, 
      height: savedHeight 
    })
    
    return true
  } catch (e) {
    console.error('[HOVER] Error saving hover dimensions:', e)
    return false
  }
} 