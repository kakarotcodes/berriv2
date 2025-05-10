// main/utils/animateViewTransition.ts
import { BrowserWindow, ipcMain, screen } from 'electron'
import { prefs } from './prefs'

// types
import { ViewType } from '../../types/types'

// Keep track of the last known good pill position
let lastKnownPillY: number | null = null

// Debug helper
const logPositionInfo = (message: string, data: any) => {
  console.log(`[POSITION] ${message}:`, data)
}

export function registerViewHandlers(mainWindow: BrowserWindow) {
  // View dimensions
  const viewDimensions = {
    default: { width: 512, height: 288 },
    pill: { width: 100, height: 48 },
    hover: { width: 350, height: 350 },
    expanded: { width: 800, height: 600 }
  }

  // At startup, load the saved pill position if it exists
  const savedPillY = prefs.get('pillY') as number | undefined
  if (savedPillY !== undefined) {
    logPositionInfo('Loaded saved pill position at startup', savedPillY)
    lastKnownPillY = savedPillY
  }

  // Handle IPC calls for view transitions
  ipcMain.handle('animate-view-transition', async (_event, view: ViewType) => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      return false
    }

    try {
      // 1. Get target dimensions
      const dimensions = viewDimensions[view]
      if (!dimensions) {
        console.error('Invalid view type:', view)
        return false
      }

      // 2. Get current cursor position to determine current display
      const cursorPos = screen.getCursorScreenPoint()
      const currentDisplay = screen.getDisplayNearestPoint(cursorPos)
      const workArea = currentDisplay.workArea

      // Get current window position (for transitions)
      const currentBounds = mainWindow.getBounds()
      
      // Save current position before any transitions if we're in pill view
      if (currentBounds.width === viewDimensions.pill.width && 
          currentBounds.height === viewDimensions.pill.height) {
        // We're definitely in pill view now, save the position for later use
        lastKnownPillY = currentBounds.y
        prefs.set('pillY', currentBounds.y)
        logPositionInfo('Saved pill position during transition', lastKnownPillY)
      }

      console.log(`Transitioning to ${view} view on display:`, currentDisplay.id)

      // 3. Calculate target position based on view type
      let targetX, targetY

      if (view === 'default') {
        // Default view: Bottom right with 20px margins
        targetX = workArea.x + workArea.width - dimensions.width - 20
        targetY = workArea.y + workArea.height - dimensions.height - 20
      } else if (view === 'pill') {
        // Pill view positioning - make sure we maintain position
        const pillOffset = 80 // Same offset as pill view
        targetX = workArea.x + workArea.width - pillOffset

        // Get the saved position from persistent storage
        const storedY = prefs.get('pillY') as number | undefined
        
        // Determine Y position with better fallbacks
        if (lastKnownPillY !== null) {
          // First priority: Use the last known position from this session
          targetY = lastKnownPillY
          logPositionInfo('Using last known pill position from memory', targetY)
        } else if (storedY !== undefined) {
          // Second priority: Use the persistently stored position
          targetY = storedY
          logPositionInfo('Using saved pill position from storage', targetY)
        } else {
          // Last resort: Default to 130px from top
          targetY = workArea.y + 130
          logPositionInfo('Using default pill position (130px from top)', targetY)
        }

        // Ensure Y is within bounds
        const minY = workArea.y
        const maxY = workArea.y + workArea.height - dimensions.height
        targetY = Math.min(maxY, Math.max(minY, targetY))
        
        // Update the stored position to ensure consistency
        prefs.set('pillY', targetY)
        lastKnownPillY = targetY
      } else if (view === 'hover') {
        // Hover view: Position it so it's fully visible on screen
        // Starting from the same position as the pill, but adjusted to be fully visible

        // For X position: Position it so it's fully within the screen
        // Offset from right edge by its full width
        targetX = workArea.x + workArea.width - dimensions.width - 20

        // If we're coming from pill view, save the current Y position more aggressively
        if (currentBounds.width === viewDimensions.pill.width) {
          lastKnownPillY = currentBounds.y
          prefs.set('pillY', currentBounds.y)
          logPositionInfo('Saved pill Y position before hover', lastKnownPillY)
        }

        // Use the same Y position as the pill
        targetY = currentBounds.y

        // Ensure Y is within bounds for the new larger size
        const minY = workArea.y
        const maxY = workArea.y + workArea.height - dimensions.height
        targetY = Math.min(maxY, Math.max(minY, targetY))

        logPositionInfo('Hover view positioned fully on screen', { targetX, targetY })
      } else {
        // Other views: Centered in display
        targetX = workArea.x + (workArea.width - dimensions.width) / 2
        targetY = workArea.y + (workArea.height - dimensions.height) / 2
      }

      logPositionInfo(
        `Target position for ${view} view`,
        { x: targetX, y: targetY, width: dimensions.width, height: dimensions.height }
      )

      // 4. Set the window size and position (animation handled by the OS)
      mainWindow.setBounds(
        {
          x: Math.round(targetX),
          y: Math.round(targetY),
          width: dimensions.width,
          height: dimensions.height
        },
        true
      ) // true = animate

      // IMPORTANT: Only reset the lastKnownPillY when explicitly told to
      // This ensures we don't lose our position
      // If transitioning to default view, reset the last known pill position
      // if (view === 'default') {
      //   lastKnownPillY = null
      // }

      return true
    } catch (error) {
      console.error('Error during view transition:', error)
      return false
    }
  })
  
  // Add an explicit IPC handler for persisting the pill position
  ipcMain.on('save-pill-position', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    
    const bounds = mainWindow.getBounds()
    // Only save if we're in pill view
    if (bounds.width === viewDimensions.pill.width && 
        bounds.height === viewDimensions.pill.height) {
      prefs.set('pillY', bounds.y)
      lastKnownPillY = bounds.y
      logPositionInfo('Explicitly saved pill position', bounds.y)
    }
  })
}
