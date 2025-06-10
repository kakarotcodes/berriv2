// main/utils/animateViewTransition.ts
import { BrowserWindow, ipcMain, screen } from 'electron'
import { prefs } from './prefs'

// types
import { ViewType } from '../../types/types'

// constants
import { WIDTH, HEIGHT, OFFSET } from '../../constants/constants'

// Keep track of the last known good pill position for the current session
let lastKnownPillY: number | null = null

// Keep track of the last known hover position
let lastKnownHoverX: number | null = null
let lastKnownHoverY: number | null = null

// Flag to track if this is the first transition to pill after app launch
let isFirstTransitionToPill = true

// Debug helper
const logPositionInfo = (message: string, data: any) => {
  console.log(`[POSITION] ${message}:`, data)
}

export function registerViewHandlers(mainWindow: BrowserWindow) {
  // View dimensions - ensure they match with those defined in the renderer
  const viewDimensions = {
    default: { width: WIDTH.DEFAULT, height: HEIGHT.DEFAULT },
    pill: { width: WIDTH.PILL, height: HEIGHT.PILL },
    hover: { width: WIDTH.HOVER, height: HEIGHT.HOVER }, // Match renderer dimensions
    expanded: { width: 800, height: 600 }
  }

  // Consistent margin across all views
  const MARGIN = 20
  const PILL_OFFSET = OFFSET.PILLOFFSET
  const PILL_FIRST_TOP_MARGIN = 130 // Top margin for initial pill positioning

  // Debug: Log all stored preferences at startup
  console.log('[PREFS] All stored preferences:', prefs.store)

  // At startup, ALWAYS set isFirstTransitionToPill to true
  // to ensure we use the 130px top margin on first transition
  isFirstTransitionToPill = true

  // Still load saved pill position for subsequent transitions
  const savedPillY = prefs.get('pillY') as number | undefined
  if (savedPillY !== undefined) {
    logPositionInfo(
      'Loaded saved pill position at startup, but will use 130px margin for first transition',
      savedPillY
    )
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
      let dimensions = viewDimensions[view]
      if (!dimensions) {
        console.error('Invalid view type:', view)
        return false
      }

      // Special case for hover view - load saved dimensions
      if (view === 'hover') {
        // Get hover dimensions from prefs
        const savedWidth = prefs.get('hoverWidth') as number | undefined
        const savedHeight = prefs.get('hoverHeight') as number | undefined

        if (savedWidth && savedHeight) {
          // Validate dimensions - ensure we're not using pill dimensions for hover
          if (
            savedWidth !== WIDTH.PILL &&
            savedHeight !== HEIGHT.PILL &&
            savedWidth > 100 &&
            savedHeight > 100
          ) {
            // Minimum reasonable size
            console.log('[POSITION] Using saved hover dimensions:', {
              width: savedWidth,
              height: savedHeight
            })
            dimensions = { width: savedWidth, height: savedHeight }
          } else {
            console.log('[POSITION] Saved hover dimensions invalid, using defaults:', {
              saved: { width: savedWidth, height: savedHeight },
              using: viewDimensions.hover
            })
            dimensions = viewDimensions.hover
          }
        } else {
          console.log('[POSITION] No saved hover dimensions, using defaults')
        }
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

      // 3. Calculate target position based on view type
      let targetX, targetY

      if (view === 'default') {
        // Default view: Bottom right with consistent margin
        targetX = workArea.x + workArea.width - dimensions.width - MARGIN
        targetY = workArea.y + workArea.height - dimensions.height - MARGIN
      } else if (view === 'pill') {
        // Pill view positioning - use consistent offset from right edge
        targetX = workArea.x + workArea.width - PILL_OFFSET

        // Check if this is first transition to pill
        if (isFirstTransitionToPill) {
          // First transition to pill after app launch - ALWAYS use 130px from top
          targetY = workArea.y + PILL_FIRST_TOP_MARGIN
          logPositionInfo(
            'First transition to pill view - positioning with 130px top margin',
            targetY
          )

          // Reset the flag so subsequent transitions use saved position
          isFirstTransitionToPill = false
        }
        // Coming from hover view - special handling for subsequent transitions
        else if (
          currentBounds.width === viewDimensions.hover.width &&
          currentBounds.height === viewDimensions.hover.height
        ) {
          targetY = currentBounds.y
          logPositionInfo('Coming from hover view, setting pill at hover Y position', targetY)
        }
        // Coming from default view - use saved pill position (don't use default view's position)
        else if (
          currentBounds.width === viewDimensions.default.width &&
          currentBounds.height === viewDimensions.default.height
        ) {
          if (lastKnownPillY !== null) {
            targetY = lastKnownPillY
            logPositionInfo('Coming from default view, using saved pill position', targetY)
          } else {
            // Fallback if no saved position
            targetY = workArea.y + PILL_FIRST_TOP_MARGIN
            logPositionInfo(
              'Coming from default view, no saved pill position, using 130px top margin',
              targetY
            )
          }
        } else if (lastKnownPillY !== null) {
          // Use the last known position from this session
          targetY = lastKnownPillY
          logPositionInfo('Using last known pill position', targetY)
        } else {
          // Fallback - should rarely happen
          targetY = workArea.y + PILL_FIRST_TOP_MARGIN
          logPositionInfo('Using fallback pill position with 130px top margin', targetY)
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
          lastKnownPillY = currentBounds.y
          prefs.set('pillY', currentBounds.y)
          logPositionInfo('Saved hover Y position to be used for pill', currentBounds.y)
        }

        // Position hover view at the pill's location if coming from pill view
        if (currentBounds.width === viewDimensions.pill.width) {
          // Use pill position with an offset from the right edge
          const rightEdgeOffset = 20 // Space between hover view and right edge

          // Use pill's Y position
          targetY = currentBounds.y

          // Check if this is coming from the right side pill
          // The pill is typically positioned at the right edge
          const isPillAtRightEdge =
            Math.abs(workArea.x + workArea.width - PILL_OFFSET - currentBounds.x) < 5

          if (isPillAtRightEdge) {
            // Position hover with space from right edge
            targetX = workArea.x + workArea.width - dimensions.width - rightEdgeOffset
            logPositionInfo('Positioning hover with space from right edge', { targetX, targetY })
          } else {
            // Just use pill's exact position
            targetX = currentBounds.x
            logPositionInfo('Positioning hover at exact pill location', { targetX, targetY })
          }
        } else {
          // Otherwise use saved position or fallback to current position
          targetX = currentBounds.x
          targetY = currentBounds.y
          logPositionInfo('Keeping current position for hover', { targetX, targetY })
        }

        // Ensure the position is within screen bounds
        const minX = workArea.x
        const maxX = workArea.x + workArea.width - dimensions.width
        targetX = Math.max(minX, Math.min(maxX, targetX))

        // Ensure Y is within bounds for the hover size
        const minY = workArea.y
        const maxY = workArea.y + workArea.height - dimensions.height
        targetY = Math.min(maxY, Math.max(minY, targetY))

        logPositionInfo('Final hover view position', { targetX, targetY })
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
        true // true = animate
      )

      // Fire real completion event when macOS finishes the animation
      mainWindow.once('resized', () => {
        console.log(`[MAIN] Window resized event fired for ${view} view`)
        mainWindow.webContents.send('view-transition-done', view)
        console.log(`[MAIN] Sent view-transition-done event for ${view}`)
      })

      // Also add a fallback in case 'resized' doesn't fire
      setTimeout(() => {
        console.log(`[MAIN] Fallback timer for ${view} transition`)
        mainWindow.webContents.send('view-transition-done', view)
      }, 500)

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
