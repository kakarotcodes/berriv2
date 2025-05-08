import { BrowserWindow } from 'electron'

// Track ongoing animations using timeout IDs
const timeoutMap = new WeakMap<BrowserWindow, NodeJS.Timeout>()

export function animateWindowResize(
  window: BrowserWindow,
  targetWidth: number,
  targetHeight: number,
  duration: number = 150
): void {
  // Clear any existing animation
  const existingTimeout = timeoutMap.get(window)
  if (existingTimeout) {
    clearTimeout(existingTimeout)
  }

  const [currentWidth, currentHeight] = window.getSize()
  const widthDelta = targetWidth - currentWidth
  const heightDelta = targetHeight - currentHeight

  const startTime = Date.now()
  const endTime = startTime + duration

  const animateStep = () => {
    const now = Date.now()
    const elapsed = now - startTime

    if (now >= endTime) {
      window.setSize(targetWidth, targetHeight, true)
      return
    }

    const progress = elapsed / duration
    const easeProgress = progress * (2 - progress)

    const newWidth = Math.round(currentWidth + widthDelta * easeProgress)
    const newHeight = Math.round(currentHeight + heightDelta * easeProgress)

    window.setSize(newWidth, newHeight, true)

    // Schedule next frame using setTimeout
    const timeoutId = setTimeout(animateStep, 16) // ~60fps
    timeoutMap.set(window, timeoutId)
  }

  // Start the animation
  animateStep()
}
