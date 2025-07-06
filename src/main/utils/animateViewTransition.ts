// main/utils/animateViewTransition.ts
import { BrowserWindow, ipcMain, screen } from 'electron'
import { prefs } from './prefs'

// types
import { ViewType } from '../../types/types'

// constants
import { WIDTH, HEIGHT, OFFSET } from '../../constants/constants'

// Keep track of the last known good pill position for the current session
let lastKnownPillY: number | null = null

// Flag to track if this is the first transition to pill after app launch
let isFirstTransitionToPill = true

// Debug helper
const logPositionInfo = (message: string, data: unknown) => {
  console.log(`[POSITION] ${message}:`, data)
}

export function registerViewHandlers(mainWindow: BrowserWindow) {
  console.log('[IPC] 🔧 Registering view handlers for animate-view-transition')
  
  // View dimensions - ensure they match with those defined in the renderer
  const viewDimensions = {
    default: { width: WIDTH.DEFAULT, height: HEIGHT.DEFAULT },
    pill: { width: WIDTH.PILL, height: HEIGHT.PILL_COLLAPSED },
    hover: { width: WIDTH.HOVER, height: HEIGHT.HOVER } // Match renderer dimensions
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

  // Note: Hover positions are saved but not used in startup positioning
  // They are loaded when transitioning to hover view dynamically

  // Handle IPC calls for view transitions
  ipcMain.handle('animate-view-transition', async (_event, view: ViewType) => {
    console.log('[TRANSITION] ===== STARTING VIEW TRANSITION =====')
    console.log('[TRANSITION] Target view:', view)
    
    if (!mainWindow || mainWindow.isDestroyed()) {
      console.log('[TRANSITION] ❌ Window not available')
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
        // Get hover dimensions from prefs - USE THESE FOR POSITIONING
        const savedWidth = prefs.get('hoverWidth') as number | undefined
        const savedHeight = prefs.get('hoverHeight') as number | undefined

        if (savedWidth && savedHeight) {
          // Validate dimensions - ensure we're not using pill dimensions for hover
          if (
            savedWidth !== WIDTH.PILL &&
            savedHeight !== HEIGHT.PILL_COLLAPSED &&
            savedWidth > 100 &&
            savedHeight > 100
          ) {
            // Use saved dimensions for BOTH sizing AND positioning calculations
            console.log('[POSITION] Using saved hover dimensions for positioning:', {
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
      
      console.log('[DISPLAY] Current display info:', {
        displayId: currentDisplay.id,
        workArea,
        scaleFactor: currentDisplay.scaleFactor,
        size: currentDisplay.size
      })

      // Get current window position (for transitions)
      const currentBounds = mainWindow.getBounds()

      // Save current position before any transitions if we're in pill view
      if (
        currentBounds.width === viewDimensions.pill.width &&
        currentBounds.height === viewDimensions.pill.height
      ) {
        // Save the position for later use - this is the pill's original position
        lastKnownPillY = currentBounds.y
        prefs.set('pillX', currentBounds.x)
        prefs.set('pillY', currentBounds.y)
        
        // Also save as the "return position" specifically for hover view transitions
        prefs.set('pillReturnX', currentBounds.x)
        prefs.set('pillReturnY', currentBounds.y)
        
        logPositionInfo('Saved pill position during transition (including return position)', {
          x: currentBounds.x,
          y: currentBounds.y
        })
      }

      console.log(`Transitioning to ${view} view on display:`, currentDisplay.id)

      // 3. Calculate target position based on view type
      let targetX, targetY

      console.log('[TRANSITION] Calculating position for view:', view)

      if (view === 'default') {
        console.log('[TRANSITION] 📍 Taking DEFAULT view path')
        // Default view: Bottom right with consistent margin
        targetX = workArea.x + workArea.width - dimensions.width - MARGIN
        targetY = workArea.y + workArea.height - dimensions.height - MARGIN
      } else if (view === 'pill') {
        console.log('[TRANSITION] 💊 Taking PILL view path')
        
        // Determine X position based on the source view
        if (currentBounds.width === viewDimensions.hover.width && currentBounds.height === viewDimensions.hover.height) {
          // Coming from hover view - use the saved return position
          const pillReturnX = prefs.get('pillReturnX') as number | undefined
          if (pillReturnX !== undefined) {
            targetX = pillReturnX
            logPositionInfo('Coming from hover view, using saved return X position', targetX)
          } else {
            // Fallback to regular saved position
            const savedPillX = prefs.get('pillX') as number | undefined
            targetX = savedPillX !== undefined ? savedPillX : workArea.x + workArea.width - PILL_OFFSET
            logPositionInfo('Coming from hover view, using fallback X position', targetX)
          }
        } else {
          // Coming from other views - use regular saved position or default
          const savedPillX = prefs.get('pillX') as number | undefined
          if (savedPillX !== undefined) {
            targetX = savedPillX
            logPositionInfo('Using saved pill X position', targetX)
          } else {
            // Default to right edge with offset for first time
            targetX = workArea.x + workArea.width - PILL_OFFSET
            logPositionInfo('Using default pill X position (right edge)', targetX)
          }
        }

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
        // Coming from hover view - return to the exact position where pill was before hover opened
        else if (
          currentBounds.width === viewDimensions.hover.width &&
          currentBounds.height === viewDimensions.hover.height
        ) {
          // First try to use the saved return position (most accurate)
          const pillReturnY = prefs.get('pillReturnY') as number | undefined
          if (pillReturnY !== undefined && pillReturnY >= workArea.y && pillReturnY <= workArea.y + workArea.height - dimensions.height) {
            targetY = pillReturnY
            logPositionInfo('Coming from hover view, using saved return position', targetY)
          } else if (lastKnownPillY !== null && lastKnownPillY >= workArea.y && lastKnownPillY <= workArea.y + workArea.height - dimensions.height) {
            targetY = lastKnownPillY
            logPositionInfo('Coming from hover view, using last known pill position', targetY)
          } else {
            // Reset to safe position if no valid saved position
            targetY = workArea.y + PILL_FIRST_TOP_MARGIN
            console.log(`[POSITION] ⚠️ Coming from hover view - no valid saved position, using safe position (${targetY})`)
            lastKnownPillY = targetY
            prefs.set('pillY', targetY)
            logPositionInfo('Coming from hover view, using safe 130px top margin', targetY)
          }
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

        // Ensure X is within bounds of current monitor
        const minX = workArea.x
        const maxX = workArea.x + workArea.width - dimensions.width
        targetX = Math.min(maxX, Math.max(minX, targetX))

        // Ensure Y is within bounds of current monitor
        const minY = workArea.y
        const maxY = workArea.y + workArea.height - dimensions.height
        targetY = Math.min(maxY, Math.max(minY, targetY))

        // Update the stored position to ensure consistency
        prefs.set('pillX', targetX)
        prefs.set('pillY', targetY)
        lastKnownPillY = targetY
      } else if (view === 'hover') {
        console.log('[TRANSITION] 🔄 Taking HOVER view path - SMART POSITIONING SHOULD HAPPEN HERE')
        // Smart positioning for hover view based on pill position and screen edges
        const pillX = currentBounds.x
        const pillY = currentBounds.y
        const pillWidth = currentBounds.width
        const hoverWidth = dimensions.width
        
        // Calculate distances from edges
        const distanceFromRight = workArea.x + workArea.width - (pillX + pillWidth)
        const distanceFromLeft = pillX - workArea.x
        
        console.log('[HOVER] ======= SMART POSITIONING DEBUG =======')
        console.log('[HOVER] Current bounds:', currentBounds)
        console.log('[HOVER] Dimensions to use:', dimensions)
        console.log('[HOVER] Work area:', workArea)
        console.log('[HOVER] Pill position:', { x: pillX, y: pillY, width: pillWidth })
        console.log('[HOVER] Hover width:', hoverWidth)
        console.log('[HOVER] Distance from right edge:', distanceFromRight)
        console.log('[HOVER] Distance from left edge:', distanceFromLeft)
        console.log('[HOVER] Comparison: distanceFromRight < hoverWidth?', distanceFromRight < hoverWidth)
        
        // Determine positioning based on available space
        if (distanceFromRight < hoverWidth) {
          // Position hover to the left of the pill
          targetX = pillX - hoverWidth
          console.log('[HOVER] 🔴 POSITIONING ON LEFT SIDE (insufficient space on right)')
          console.log('[HOVER] Initial left position:', targetX)
          
          // Ensure we don't go off the left edge
          if (targetX < workArea.x) {
            const beforeAdjustment = targetX
            targetX = workArea.x
            console.log('[HOVER] ⚠️  Adjusted to avoid left edge overflow:', beforeAdjustment, '→', targetX)
          }
        } else {
          // Position hover to the right of the pill
          targetX = pillX + pillWidth
          console.log('[HOVER] 🟢 POSITIONING ON RIGHT SIDE (sufficient space)')
          console.log('[HOVER] Initial right position:', targetX)
          
          // Ensure we don't go off the right edge
          const rightEdgeCheck = targetX + hoverWidth
          const screenRightEdge = workArea.x + workArea.width
          console.log('[HOVER] Right edge check:', rightEdgeCheck, 'vs screen edge:', screenRightEdge)
          
          if (rightEdgeCheck > screenRightEdge) {
            const beforeAdjustment = targetX
            targetX = workArea.x + workArea.width - hoverWidth
            console.log('[HOVER] ⚠️  Adjusted to avoid right edge overflow:', beforeAdjustment, '→', targetX)
          }
        }
        
        // Keep the same Y position as the pill
        targetY = pillY
        
        // Ensure Y position is within bounds
        const minY = workArea.y
        const maxY = workArea.y + workArea.height - dimensions.height
        targetY = Math.max(minY, Math.min(maxY, targetY))

        // Save the calculated position for next time
        prefs.set('hoverX', targetX)
        prefs.set('hoverY', targetY)
        
        // CRITICAL: Save the smart position globally so fix-hover-dimensions uses it
        prefs.set('smartHoverX', targetX)
        prefs.set('smartHoverY', targetY)
        console.log('[HOVER] 💾 Saved smart position for hover view:', { smartX: targetX, smartY: targetY })
        
        console.log('[HOVER] ✅ FINAL SMART POSITION:', { targetX, targetY })
        console.log('[HOVER] ======= END DEBUG =======')
        
        // Double check the final position makes sense
        if (targetX + hoverWidth > workArea.x + workArea.width) {
          console.error('[HOVER] 🚨 ERROR: Final position still goes off right edge!')
        }
        if (targetX < workArea.x) {
          console.error('[HOVER] 🚨 ERROR: Final position goes off left edge!')
        }
      } else {
        console.log('[TRANSITION] ❓ Taking OTHER view path (unexpected):', view)
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

      // 4. Set the window size and position with fast native animation
      console.log('[TRANSITION] 🎯 Setting final window bounds:', {
        x: Math.round(targetX),
        y: Math.round(targetY),
        width: dimensions.width,
        height: dimensions.height
      })
      
      // Log before setBounds
      const beforeBounds = mainWindow.getBounds()
      console.log('[DEBUG] 📏 Window bounds BEFORE setBounds:', beforeBounds)
      
      // CRITICAL: Temporarily enable resizability to allow dimension changes
      const wasResizable = mainWindow.isResizable()
      console.log('[DEBUG] 🔧 Window resizability before setBounds:', wasResizable)
      
      if (!wasResizable) {
        console.log('[DEBUG] 🔓 Temporarily enabling resizability for setBounds')
        mainWindow.setResizable(true)
      }
      
      try {
        mainWindow.setBounds(
          {
            x: Math.round(targetX),
            y: Math.round(targetY),
            width: dimensions.width,
            height: dimensions.height
          },
          true // Keep native animation but with faster timing
        )
        console.log('[DEBUG] ✅ setBounds call completed successfully')
      } catch (error) {
        console.error('[DEBUG] ❌ setBounds call failed:', error)
      }
      
      // Log immediately after setBounds
      const afterBounds = mainWindow.getBounds()
      console.log('[DEBUG] 📏 Window bounds IMMEDIATELY after setBounds:', afterBounds)
      
      // Restore original resizability state
      if (!wasResizable) {
        console.log('[DEBUG] 🔒 Restoring original resizability state')
        mainWindow.setResizable(false)
      }

      // Verify the window actually got positioned correctly
      setTimeout(() => {
        const actualBounds = mainWindow.getBounds()
        console.log('[VERIFICATION] 🔍 Window bounds after positioning:', actualBounds)
        console.log('[VERIFICATION] 📏 Expected vs Actual:', {
          expectedX: Math.round(targetX),
          actualX: actualBounds.x,
          xDifference: actualBounds.x - Math.round(targetX),
          expectedY: Math.round(targetY),
          actualY: actualBounds.y,
          yDifference: actualBounds.y - Math.round(targetY),
          expectedWidth: dimensions.width,
          actualWidth: actualBounds.width,
          expectedHeight: dimensions.height,
          actualHeight: actualBounds.height
        })
        
        // Check if dimensions changed at all
        if (actualBounds.width !== dimensions.width || actualBounds.height !== dimensions.height) {
          console.error('[VERIFICATION] 🚨 DIMENSIONS NOT CHANGED!', {
            expectedDimensions: { width: dimensions.width, height: dimensions.height },
            actualDimensions: { width: actualBounds.width, height: actualBounds.height },
            message: 'setBounds call was ignored or overridden'
          })
        }
        
        // Check if window is actually going off right edge
        const rightEdge = actualBounds.x + actualBounds.width
        const screenRightEdge = workArea.x + workArea.width
        if (rightEdge > screenRightEdge) {
          console.error('[VERIFICATION] 🚨 WINDOW IS GOING OFF RIGHT EDGE!', {
            windowRightEdge: rightEdge,
            screenRightEdge: screenRightEdge,
            overhang: rightEdge - screenRightEdge
          })
        } else {
          console.log('[VERIFICATION] ✅ Window positioned correctly within screen bounds')
        }
      }, 50) // Check position after animation starts

      // Much faster completion detection
      mainWindow.once('resized', () => {
        mainWindow.webContents.send('view-transition-done', view)
      })

      // Super fast fallback for snappy feel
      setTimeout(() => {
        mainWindow.webContents.send('view-transition-done', view)
      }, 120) // Fast but safe timing to prevent flicker

      console.log('[TRANSITION] ✅ View transition completed successfully')
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
      prefs.set('pillX', bounds.x)
      prefs.set('pillY', bounds.y)
      lastKnownPillY = bounds.y
      logPositionInfo('Explicitly saved pill position', { x: bounds.x, y: bounds.y })
    }
  })
}
