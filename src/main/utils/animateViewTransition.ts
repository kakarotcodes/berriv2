// main/utils/animateViewTransition.ts
import { BrowserWindow, ipcMain, screen } from 'electron'
import { prefs } from './prefs'

// types
import { ViewType } from '../../types/types'

// constants
import {
  DEFAULT_VIEW_HEIGHT,
  DEFAULT_VIEW_WIDTH,
  HOVER_VIEW_HEIGHT,
  HOVER_VIEW_WIDTH,
  PILL_VIEW_HEIGHT,
  PILL_VIEW_WIDTH
} from '../../constants/constants'

// Keep track of the last known good pill position for the current session
let lastKnownPillY: number | null = null

// Flag to track if this is the first transition to pill after app launch
let isFirstTransitionToPill = true

// Debug helper
const logPositionInfo = (message: string, data: any) => {
  console.log(`[POSITION] ${message}:`, data)
}

export function registerViewHandlers(mainWindow: BrowserWindow) {
  // View dimensions - ensure they match with those defined in the renderer
  const viewDimensions = {
    default: { width: DEFAULT_VIEW_WIDTH, height: DEFAULT_VIEW_HEIGHT },
    pill: { width: PILL_VIEW_WIDTH, height: PILL_VIEW_HEIGHT },
    hover: { width: HOVER_VIEW_WIDTH, height: HOVER_VIEW_HEIGHT }, // Match renderer dimensions
    expanded: { width: 800, height: 600 }
  }

  // Consistent margin across all views
  const MARGIN = 20
  const PILL_OFFSET = 98
  const PILL_FIRST_TOP_MARGIN = 130 // Top margin for initial pill positioning

  // At startup, load the saved pill position if it exists
  const savedPillY = prefs.get('pillY') as number | undefined
  if (savedPillY !== undefined) {
    logPositionInfo('Loaded saved pill position at startup', savedPillY)
    // Only update lastKnownPillY, but keep isFirstTransitionToPill true
    // so we still use the 130px margin on first transition
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
        // Hover view: Position with consistent margin, maintaining vertical alignment with pill
        targetX = workArea.x + workArea.width - dimensions.width - MARGIN

        // If we're coming from pill view, save the current Y position
        if (currentBounds.width === viewDimensions.pill.width) {
          lastKnownPillY = currentBounds.y
          prefs.set('pillY', currentBounds.y)
          logPositionInfo('Saved pill Y position before hover', lastKnownPillY)
        }

        // Use the same Y position as the current window
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
