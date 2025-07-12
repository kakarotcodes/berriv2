console.log('[CLOSE_BUTTON] Loading close button script...')

async function closeWindow(): Promise<void> {
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
async function closeWithSavePrompt(): Promise<void> {
  // TODO: Ask user if they want to save before closing
}

async function minimizeToTray(): Promise<void> {
  // TODO: Minimize to system tray instead of closing
}

async function closeWithFeedback(): Promise<void> {
  // TODO: Show quick feedback survey before closing
}

// Export functions to global scope
;(window as any).closeWindow = closeWindow
;(window as any).closeWithSavePrompt = closeWithSavePrompt
;(window as any).minimizeToTray = minimizeToTray
;(window as any).closeWithFeedback = closeWithFeedback

console.log('[CLOSE_BUTTON] Close button script loaded successfully')
