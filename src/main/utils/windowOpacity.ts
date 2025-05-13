import { BrowserWindow } from 'electron'

/**
 * Sets the opacity of a BrowserWindow with optional animation
 * @param window The BrowserWindow to set opacity for
 * @param alpha Opacity value between 0 and 1
 * @param animate Whether to animate the opacity change
 */
export function setWindowOpacity(window: BrowserWindow, alpha: number, shouldAnimate = true): void {
  // Return early if window is invalid or destroyed
  if (!window || window.isDestroyed()) {
    return
  }

  // Clamp alpha between 0 and 1
  const targetAlpha = Math.max(0, Math.min(1, alpha))
  
  // Get current opacity
  const currentAlpha = window.getOpacity()
  
  // If opacity difference is small or animation not requested, set immediately
  if (!shouldAnimate || Math.abs(currentAlpha - targetAlpha) < 0.05) {
    // Check if setOpacity is available on this platform
    if (typeof window.setOpacity === 'function') {
      window.setOpacity(targetAlpha)
    } else {
      // Fallback for platforms without setOpacity (macOS ≤ 10.13)
      window.webContents.send('pill:set-css-opacity', targetAlpha)
    }
    return
  }
  
  // Animate the opacity change
  const steps = 10
  const duration = 120 // ms
  const stepDuration = Math.floor(duration / steps) // ≈ 12ms per step
  let currentStep = 0
  
  // Calculate step size
  const stepSize = (targetAlpha - currentAlpha) / steps
  
  // Start the animation
  const animateOpacity = () => {
    // Safety check for destroyed windows
    if (!window || window.isDestroyed()) {
      return
    }
    
    currentStep++
    const newAlpha = currentAlpha + stepSize * currentStep
    
    // Check if setOpacity is available on this platform
    if (typeof window.setOpacity === 'function') {
      window.setOpacity(newAlpha)
    } else {
      // Fallback for platforms without setOpacity (macOS ≤ 10.13)
      window.webContents.send('pill:set-css-opacity', newAlpha)
    }
    
    // Continue animation if not finished
    if (currentStep < steps) {
      setTimeout(animateOpacity, stepDuration)
    }
  }
  
  // Start the animation
  animateOpacity()
} 