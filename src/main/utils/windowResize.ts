import { BrowserWindow } from 'electron'

// WeakMap to track ongoing animation frame IDs for each window
const animationFrameMap = new WeakMap<BrowserWindow, number>()

/**
 * Smoothly animates a window resize from its current size to the target dimensions.
 * Cancels any ongoing animation for the window before starting a new one.
 * 
 * @param window - The Electron BrowserWindow to resize
 * @param targetWidth - The desired final width in pixels
 * @param targetHeight - The desired final height in pixels
 * @param duration - Animation duration in milliseconds (default: 150ms)
 */
export function animateWindowResize(
  window: BrowserWindow,
  targetWidth: number,
  targetHeight: number,
  duration: number = 150
): void {
  // Cancel any ongoing animation for this window
  const currentAnimationFrame = animationFrameMap.get(window)
  if (currentAnimationFrame !== undefined) {
    cancelAnimationFrame(currentAnimationFrame)
  }

  // Get current window size
  const [currentWidth, currentHeight] = window.getSize()
  
  // Calculate total width and height change
  const widthDelta = targetWidth - currentWidth
  const heightDelta = targetHeight - currentHeight
  
  // Calculate animation parameters
  const startTime = Date.now()
  const endTime = startTime + duration
  
  // Animation frame handler
  const updateFrame = () => {
    const now = Date.now()
    const elapsed = now - startTime
    
    // If animation complete, set final size and exit
    if (now >= endTime) {
      window.setSize(targetWidth, targetHeight, true)
      return
    }
    
    // Calculate progress ratio (0 to 1)
    const progress = elapsed / duration
    
    // Use easeOutQuad for smooth animation: t*(2-t)
    const easeProgress = progress * (2 - progress)
    
    // Calculate intermediate dimensions
    const newWidth = Math.round(currentWidth + widthDelta * easeProgress)
    const newHeight = Math.round(currentHeight + heightDelta * easeProgress)
    
    // Apply the new size
    window.setSize(newWidth, newHeight, true)
    
    // Request next frame and store the ID
    const frameId = requestAnimationFrame(updateFrame)
    animationFrameMap.set(window, frameId)
  }
  
  // Start the animation
  updateFrame()
}
