// main/utils/animateViewTransition.ts
import { BrowserWindow, ipcMain, screen } from 'electron'
import { prefs } from './prefs'

// types
import { ViewType } from '../../types/types'

// Keep track of the last known good pill position
let lastKnownPillY: number | null = null

export function registerViewHandlers(mainWindow: BrowserWindow) {
  // View dimensions
  const viewDimensions = {
    default: { width: 512, height: 288 },
    pill: { width: 100, height: 48 },
    hover: { width: 350, height: 350 },
    expanded: { width: 800, height: 600 }
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

      console.log(`Transitioning to ${view} view on display:`, currentDisplay.id)

      // 3. Calculate target position based on view type
      let targetX, targetY

      if (view === 'default') {
        // Default view: Bottom right with 20px margins
        targetX = workArea.x + workArea.width - dimensions.width - 20
        targetY = workArea.y + workArea.height - dimensions.height - 20
      } else if (view === 'pill') {
        // If we're coming from hover view, use the lastKnownPillY
        // Otherwise use the saved position from preferences
        const pillOffset = 80 // Same offset as pill view
        targetX = workArea.x + workArea.width - pillOffset

        // Prioritize: 1) Last known position 2) Saved position 3) Default position with 130px top margin
        if (lastKnownPillY !== null) {
          // Coming from hover - use the known position
          targetY = lastKnownPillY
          console.log('Using last known pill position:', targetY)
        } else {
          // Normal case - use saved position or default to 130px from top
          const savedY = prefs.get('pillY') as number | undefined
          targetY = savedY !== undefined ? savedY : workArea.y + 130 // Default is 130px from top of the screen
        }

        // Ensure Y is within bounds
        const minY = workArea.y
        const maxY = workArea.y + workArea.height - dimensions.height
        targetY = Math.min(maxY, Math.max(minY, targetY))

        // Save this position for future reference
        prefs.set('pillY', targetY)
      } else if (view === 'hover') {
        // Hover view: Position it so it's fully visible on screen
        // Starting from the same position as the pill, but adjusted to be fully visible

        // For X position: Position it so it's fully within the screen
        // Offset from right edge by its full width
        targetX = workArea.x + workArea.width - dimensions.width - 20

        // If we're coming from pill view, save the current Y position
        if (mainWindow.getBounds().width === viewDimensions.pill.width) {
          lastKnownPillY = currentBounds.y
          console.log('Saved pill Y position before hover:', lastKnownPillY)
        }

        // Use the same Y position as the pill
        targetY = currentBounds.y

        // Ensure Y is within bounds for the new larger size
        const minY = workArea.y
        const maxY = workArea.y + workArea.height - dimensions.height
        targetY = Math.min(maxY, Math.max(minY, targetY))

        console.log('Hover view positioned fully on screen:', { targetX, targetY })
      } else {
        // Other views: Centered in display
        targetX = workArea.x + (workArea.width - dimensions.width) / 2
        targetY = workArea.y + (workArea.height - dimensions.height) / 2
      }

      console.log(
        `Target position: x=${targetX}, y=${targetY}, width=${dimensions.width}, height=${dimensions.height}`
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

      // If transitioning to default view, reset the last known pill position
      if (view === 'default') {
        lastKnownPillY = null
      }

      return true
    } catch (error) {
      console.error('Error during view transition:', error)
      return false
    }
  })
}
