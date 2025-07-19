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

// Attach event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const closeBtn = document.querySelector('button[title="Close"]')
  if (closeBtn) {
    closeBtn.addEventListener('click', closeWindow)
  }

  const windowCloseBtn = document.getElementById('close-window')
  if (windowCloseBtn) {
    windowCloseBtn.addEventListener('click', closeWindow)
  }
})

console.log('[CLOSE_BUTTON] Close button script loaded successfully')
