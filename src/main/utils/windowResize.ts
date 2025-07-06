// src/main/utils/windowResize.ts
import { BrowserWindow, screen } from 'electron'

// Track ongoing animations using timeout IDs
const timeoutMap = new WeakMap<BrowserWindow, NodeJS.Timeout>()

interface WindowResizeOptions {
  window: BrowserWindow | null | undefined
  targetWidth: number
  targetHeight: number
  targetX?: number
  targetY?: number
  duration?: number
}

const TARGET_FPS = 60
const FRAME_DURATION = 1000 / TARGET_FPS // ~16.6 ms

export function animateWindowResize(args: WindowResizeOptions): void {
  const { window, targetWidth, targetHeight, targetX = -1, targetY = -1, duration = 400 } = args

  // Validate window instance
  if (!window || window.isDestroyed()) {
    console.error('Invalid window instance for animation')
    return
  }

  try {
    // Clear any existing animation
    const existingTimeout = timeoutMap.get(window)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    // Get current window state with safety checks
    const [currentWidth, currentHeight] = window.getSize()
    const [currentX, currentY] = window.getPosition()

    // Calculate deltas
    const widthDelta = targetWidth - currentWidth
    const heightDelta = targetHeight - currentHeight
    const xDelta = targetX >= 0 ? targetX - currentX : 0
    const yDelta = targetY >= 0 ? targetY - currentY : 0

    // Early exit if no changes needed
    if (widthDelta === 0 && heightDelta === 0 && xDelta === 0 && yDelta === 0) {
      return
    }

    // Get screen bounds safely - cache for performance
    const display = screen.getDisplayMatching(window.getBounds())
    const { workArea } = display ?? screen.getPrimaryDisplay()

    const startTime = performance.now() // More precise timing
    const endTime = startTime + duration

    // Pre-calculate values for better performance
    const hasXChange = targetX >= 0
    const hasYChange = targetY >= 0

    let frameCount = 0
    const animateStep = () => {
      try {
        if (!window || window.isDestroyed()) return

        const now = performance.now()
        const elapsed = now - startTime

        if (elapsed >= duration) {
          // Final position - ensure exact target values
          const finalX = hasXChange ? targetX : currentX
          const finalY = hasYChange ? targetY : currentY

          window.setBounds(
            {
              x: finalX,
              y: finalY,
              width: targetWidth,
              height: targetHeight
            },
            false // No animation for final frame
          )
          timeoutMap.delete(window)
          return
        }

        const progress = Math.min(elapsed / duration, 1)
        const easeProgress = easeInOutSine(progress)

        // Calculate new dimensions
        const newWidth = Math.round(currentWidth + widthDelta * easeProgress)
        const newHeight = Math.round(currentHeight + heightDelta * easeProgress)
        
        // Calculate new position with minimal rounding for smoothness
        const newX = hasXChange ? currentX + xDelta * easeProgress : currentX
        const newY = hasYChange ? currentY + yDelta * easeProgress : currentY

        // Apply bounds constraints only when necessary
        const boundedX = hasXChange ? Math.max(workArea.x, Math.min(workArea.x + workArea.width - newWidth, newX)) : newX
        const boundedY = hasYChange ? Math.max(workArea.y, Math.min(workArea.y + workArea.height - newHeight, newY)) : newY

        // Round final values for pixel-perfect positioning
        const finalX = Math.round(boundedX)
        const finalY = Math.round(boundedY)

        window.setBounds(
          {
            x: finalX,
            y: finalY,
            width: newWidth,
            height: newHeight
          },
          false // No system animation - we handle it ourselves
        )

        frameCount++
        
        // Use setImmediate for better performance on the next tick
        const timeoutId = setTimeout(() => {
          setImmediate(animateStep)
        }, Math.max(0, FRAME_DURATION - (performance.now() - now))) as unknown as NodeJS.Timeout
        
        timeoutMap.set(window, timeoutId)
      } catch (error) {
        console.error('Animation frame error:', error)
        timeoutMap.delete(window)
      }
    }

    // Start animation
    setImmediate(animateStep)
  } catch (error) {
    console.error('Animation initialization failed:', error)
  }
}

// Ultra-smooth easing function
export function easeInOutSine(t: number): number {
  return 0.5 * (1 - Math.cos(Math.PI * t))
}

// Alternative ultra-smooth easing - even more gentle
export function easeInOutQuint(t: number): number {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2
}

// Keep other easing functions for compatibility
export function easeInOutQuart(t: number): number {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export function cancelWindowResize(window: BrowserWindow): void {
  const timeoutId = timeoutMap.get(window)
  if (timeoutId) {
    clearTimeout(timeoutId)
    timeoutMap.delete(window)
  }
}
