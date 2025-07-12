console.log('[CLOSE_BUTTON] Loading close button script...')

async function closeWindow() {
  console.log('[CLOSE_BUTTON] Close button clicked')
  try {
    const electron = await import('electron')
    electron.ipcRenderer.send('preview-close')
  } catch (error) {
    console.error('[CLOSE_BUTTON] IPC failed, using window.close():', error)
    window.close()
  }
}

// Future complex functionality can go here
async function closeWithSavePrompt() {
  // TODO: Ask user if they want to save before closing
}

async function minimizeToTray() {
  // TODO: Minimize to system tray instead of closing
}

async function closeWithFeedback() {
  // TODO: Show quick feedback survey before closing
}

// Export functions to global scope
window.closeWindow = closeWindow
window.closeWithSavePrompt = closeWithSavePrompt
window.minimizeToTray = minimizeToTray
window.closeWithFeedback = closeWithFeedback

console.log('[CLOSE_BUTTON] Close button script loaded successfully')
