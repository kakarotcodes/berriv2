// main/utils/animateViewTransition.ts
import { BrowserWindow, ipcMain, screen } from 'electron'
import { prefs } from './prefs'

// types
import { ViewType } from '../../types/types'

// constants
import { WIDTH, HEIGHT, OFFSET } from '../../constants/constants'

// Debug helper
const logPositionInfo = (message: string, data: any) => {
  console.log(`[POSITION] ${message}:`, data)
}

export function registerViewHandlers(mainWindow: BrowserWindow) {
  const MARGIN = 20 // Consistent margin from screen edges
  const PILL_OFFSET = OFFSET.PILLOFFSET // Distance from right edge for pill view
  const PILL_FIRST_TOP_MARGIN = 130 // Distance from top on first launch

  // Default dimensions for various views
  const viewDimensions = {
    default: { width: WIDTH.DEFAULT, height: HEIGHT.DEFAULT },
    pill: { width: WIDTH.PILL, height: HEIGHT.PILL },
    hover: { width: WIDTH.HOVER, height: HEIGHT.HOVER },
    expanded: { width: 800, height: 600 }
  }

  // Track positions between transitions
  let lastKnownPillY: number | null = null
  let lastKnownHoverX: number | null = null
  let lastKnownHoverY: number | null = null
  let isFirstTransitionToPill = true

  // Load saved positions and dimensions from preferences
  const savedPillY = prefs.get('pillY') as number | undefined
  const customHoverWidth = prefs.get('customHoverWidth') as number | undefined
  const customHoverHeight = prefs.get('customHoverHeight') as number | undefined
  
  if (customHoverWidth && customHoverHeight) {
    // Use custom dimensions if saved previously
    viewDimensions.hover.width = customHoverWidth
    viewDimensions.hover.height = customHoverHeight
    console.log('[DIMENSIONS] Using custom hover dimensions:', customHoverWidth, 'x', customHoverHeight)
  }

  // At startup, load the saved pill position if it exists
  if (savedPillY !== undefined) {
    logPositionInfo('Loaded saved pill position at startup', savedPillY)
    // Only update lastKnownPillY, but keep isFirstTransitionToPill true
    // so we still use the 130px margin on first transition
    lastKnownPillY = savedPillY
  }
  
  // Load saved hover positions
  const savedHoverX = prefs.get('hoverX') as number | undefined
  const savedHoverY = prefs.get('hoverY') as number | undefined
  
  // Debug log for hover position
  console.log('[POSITION] Raw hover position from prefs:', { 
    hoverX: savedHoverX, 
    hoverY: savedHoverY
  })
  
  if (savedHoverX !== undefined) {
    lastKnownHoverX = savedHoverX
    logPositionInfo('Loaded saved hover X position at startup', savedHoverX)
  } else {
    console.log('[POSITION] No saved hover X position found')
  }
  
  if (savedHoverY !== undefined) {
    lastKnownHoverY = savedHoverY
    logPositionInfo('Loaded saved hover Y position at startup', savedHoverY)
  } else {
    console.log('[POSITION] No saved hover Y position found')
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
      if (
        currentBounds.width === viewDimensions.pill.width &&
        currentBounds.height === viewDimensions.pill.height
      ) {
        // We're definitely in pill view now, save the position for later use
        lastKnownPillY = currentBounds.y
        prefs.set('pillY', currentBounds.y)
        logPositionInfo('Saved pill position during transition', lastKnownPillY)
      }

      console.log(`Transitioning to ${view} view on display:`, currentDisplay.id)

      // Set window resizability based on the view type
      // Make window resizable only in hover view
      if (view === 'hover') {
        mainWindow.setResizable(true)
        mainWindow.setMinimumSize(WIDTH.MIN_HOVER, HEIGHT.MIN_HOVER)
        console.log('Window set to resizable with minimum size 200x200')
      } else {
        // Save window size if currently in hover view before transitioning away
        if (currentBounds.width >= viewDimensions.hover.width && 
            currentBounds.height >= viewDimensions.hover.height) {
          // Save the custom hover dimensions if user resized the window
          prefs.set('customHoverWidth', currentBounds.width)
          prefs.set('customHoverHeight', currentBounds.height)
          console.log('Saved custom hover dimensions:', currentBounds.width, 'x', currentBounds.height)
        }
        
        // Make window non-resizable for other views
        mainWindow.setResizable(false)
        mainWindow.setMinimumSize(WIDTH.PILL, HEIGHT.PILL)
        console.log('Window set to non-resizable')
      }

      // 3. Calculate target position based on view type
      let targetX, targetY

      if (view === 'default') {
        // Default view: Bottom right with consistent margin
        targetX = workArea.x + workArea.width - dimensions.width - MARGIN
        targetY = workArea.y + workArea.height - dimensions.height - MARGIN
      } else if (view === 'pill') {
        // Pill view positioning - use consistent offset from right edge
        targetX = workArea.x + workArea.width - PILL_OFFSET

        if (isFirstTransitionToPill) {
          // First transition to pill after app launch - use 130px from top
          targetY = workArea.y + PILL_FIRST_TOP_MARGIN
          logPositionInfo('First transition to pill view - positioning 130px from top', targetY)

          // Reset the flag so subsequent transitions use saved position
          isFirstTransitionToPill = false
        } else if (lastKnownPillY !== null) {
          // Use the last known position from this session (from dragging or previous positions)
          targetY = lastKnownPillY
          logPositionInfo('Using last known pill position', targetY)
        } else {
          // Fallback - should rarely happen if ever
          targetY = workArea.y + PILL_FIRST_TOP_MARGIN
          logPositionInfo('Using fallback pill position (130px from top)', targetY)
        }

        // Ensure Y is within bounds of current monitor
        const minY = workArea.y
        const maxY = workArea.y + workArea.height - dimensions.height
        targetY = Math.min(maxY, Math.max(minY, targetY))

        // Update the stored position to ensure consistency
        prefs.set('pillY', targetY)
        lastKnownPillY = targetY
      } else if (view === 'hover') {
        // REQUIREMENT: Open hover view at the pill's location

        // If we're leaving hover view, save its position for next time and update pill's position
        if (currentBounds.width === viewDimensions.hover.width) {
          // Save hover Y position to be used for pill's position next time
          lastKnownPillY = currentBounds.y;
          prefs.set('pillY', currentBounds.y);
          logPositionInfo('Saved hover Y position to be used for pill', currentBounds.y);
        }

        // Position hover view at the pill's location if coming from pill view
        if (currentBounds.width === viewDimensions.pill.width) {
          // Use pill position with an offset from the right edge
          const rightEdgeOffset = 20; // Space between hover view and right edge
          
          // Use pill's Y position
          targetY = currentBounds.y;
          
          // Check if this is coming from the right side pill
          // The pill is typically positioned at the right edge
          const isPillAtRightEdge = Math.abs((workArea.x + workArea.width - PILL_OFFSET) - currentBounds.x) < 5;
          
          if (isPillAtRightEdge) {
            // Position hover with space from right edge
            targetX = workArea.x + workArea.width - dimensions.width - rightEdgeOffset;
            logPositionInfo('Positioning hover with space from right edge', { targetX, targetY });
          } else {
            // Just use pill's exact position
            targetX = currentBounds.x;
            logPositionInfo('Positioning hover at exact pill location', { targetX, targetY });
          }
        } else {
          // Otherwise use saved position or fallback to current position
          targetX = currentBounds.x;
          targetY = currentBounds.y;
          logPositionInfo('Keeping current position for hover', { targetX, targetY });
        }

        // Ensure the position is within screen bounds
        const minX = workArea.x;
        const maxX = workArea.x + workArea.width - dimensions.width;
        targetX = Math.max(minX, Math.min(maxX, targetX));

        // Ensure Y is within bounds for the hover size
        const minY = workArea.y;
        const maxY = workArea.y + workArea.height - dimensions.height;
        targetY = Math.min(maxY, Math.max(minY, targetY));

        logPositionInfo('Final hover view position', { targetX, targetY });
      } else {
        // Other views: Centered in display
        targetX = workArea.x + (workArea.width - dimensions.width) / 2
        targetY = workArea.y + (workArea.height - dimensions.height) / 2
      }

      logPositionInfo(`Target position for ${view} view`, {
        x: targetX,
        y: targetY,
        width: dimensions.width,
        height: dimensions.height
      })

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
    if (
      bounds.width === viewDimensions.pill.width &&
      bounds.height === viewDimensions.pill.height
    ) {
      prefs.set('pillY', bounds.y)
      lastKnownPillY = bounds.y
      logPositionInfo('Explicitly saved pill position', bounds.y)
    }
  })
}
