/**
 * Common utility functions for application actions
 * Centralizes repeated functionality across components
 */

/**
 * Starts a Google Meet session
 */
export const startGoogleMeet = async (): Promise<void> => {
  try {
    await window.electronAPI.startGoogleMeet()
  } catch (e) {
    console.error('Google Meet failed:', e)
    alert('Failed to start meeting.')
    throw e
  }
}

/**
 * Opens the macOS screen capture toolbar (Cmd+Shift+5)
 */
export const openScreenCapture = async (): Promise<void> => {
  console.log('[SCREEN_CAPTURE] Camera button clicked')
  try {
    console.log('[SCREEN_CAPTURE] Calling electronAPI.screenCapture.openToolbar()')
    const result = await window.electronAPI.screenCapture.openToolbar()
    console.log('[SCREEN_CAPTURE] Result:', result)
    if (!result.success) {
      console.error('Screen capture failed:', result.error)
      alert('Failed to open screen capture toolbar.')
      throw new Error(result.error)
    } else {
      console.log('[SCREEN_CAPTURE] Screen capture toolbar opened successfully')
    }
  } catch (e) {
    console.error('Screen capture failed:', e)
    alert('Failed to open screen capture toolbar.')
    throw e
  }
}

/**
 * Opens the macOS snipping tool (Cmd+Shift+4)
 */
export const openSnippingTool = async (): Promise<void> => {
  console.log('[SNIPPING_TOOL] Scissors button clicked')
  try {
    console.log('[SNIPPING_TOOL] Calling electronAPI.screenCapture.openSnippingTool()')
    const result = await window.electronAPI.screenCapture.openSnippingTool()
    console.log('[SNIPPING_TOOL] Result:', result)
    if (!result.success) {
      console.error('Snipping tool failed:', result.error)
      alert('Failed to open snipping tool.')
      throw new Error(result.error)
    } else {
      console.log('[SNIPPING_TOOL] Snipping tool opened successfully')
    }
  } catch (e) {
    console.error('Snipping tool failed:', e)
    alert('Failed to open snipping tool.')
    throw e
  }
}