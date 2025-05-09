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
  const { window, targetWidth, targetHeight, targetX = -1, targetY = -1, duration = 150 } = args

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

    // Get screen bounds safely
    const display = screen.getDisplayMatching(window.getBounds())
    const { workArea } = display ?? screen.getPrimaryDisplay()

    const startTime = Date.now()
    const endTime = startTime + duration

    const animateStep = () => {
      try {
        if (!window || window.isDestroyed()) return

        const now = Date.now()
        const elapsed = now - startTime

        if (now >= endTime) {
          const finalX = Math.round(Math.max(workArea.x, targetX >= 0 ? targetX : currentX))

          const finalY = Math.round(
            Math.max(
              workArea.y,
              Math.min(
                targetY >= 0 ? targetY : currentY,
                workArea.y + workArea.height - targetHeight
              )
            )
          )

          window.setBounds(
            {
              x: finalX,
              y: finalY,
              width: targetWidth,
              height: targetHeight
            },
            true
          )
          return
        }

        const progress = Math.min(elapsed / duration, 1)
        const easeProgress = easeInOutCubic(progress)

        const newWidth = Math.round(currentWidth + widthDelta * easeProgress)
        const newHeight = Math.round(currentHeight + heightDelta * easeProgress)
        const newX = targetX >= 0 ? Math.round(currentX + xDelta * easeProgress) : currentX
        const newY = targetY >= 0 ? Math.round(currentY + yDelta * easeProgress) : currentY

        const boundedX = Math.round(
          Math.max(
            Math.floor(workArea.x),
            Math.ceil(newX) // Remove right boundary check
          )
        )

        const boundedY = Math.round(
          Math.max(
            Math.floor(workArea.y),
            Math.min(Math.ceil(newY), Math.floor(workArea.y + workArea.height - newHeight))
          )
        )

        window.setBounds(
          {
            x: boundedX,
            y: boundedY,
            width: newWidth,
            height: newHeight
          },
          true
        )

        // const timeoutId = setTimeout(animateStep, 16)
        const timeoutId = setTimeout(animateStep, FRAME_DURATION) as unknown as NodeJS.Timeout

        timeoutMap.set(window, timeoutId)
      } catch (error) {
        console.error('Animation frame error:', error)
      }
    }

    animateStep()
  } catch (error) {
    console.error('Animation initialization failed:', error)
  }
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}
