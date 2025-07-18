console.log('[PREVIEW] Script loading...')
console.log('[PREVIEW] Window location:', window.location.href)
console.log('[PREVIEW] Script execution starting...')

let timer: NodeJS.Timeout | null = null
let renameTimer: NodeJS.Timeout | null = null

async function autoSaveFilename(filename: string): Promise<void> {
  console.log('[PREVIEW] autoSaveFilename called with:', filename)
  try {
    console.log('[PREVIEW] Attempting to access electron...')
    // Try direct access first (since nodeIntegration is enabled)
    if (typeof window !== 'undefined' && (window as any).require) {
      console.log('[PREVIEW] Using window.require for electron')
      const { ipcRenderer } = (window as any).require('electron')
      ipcRenderer.send('preview-save', filename)
      console.log('[PREVIEW] Auto-saved filename via window.require:', filename)
      return
    }

    // Fallback to dynamic import
    console.log('[PREVIEW] Attempting to import electron...')
    const electron = await import('electron')
    console.log('[PREVIEW] Electron imported successfully, sending IPC...')
    electron.ipcRenderer.send('preview-save', filename)
    console.log('[PREVIEW] Auto-saved filename:', filename)
  } catch (error) {
    console.error('[PREVIEW] Auto-save failed:', error)
  }
}

function debouncedAutoSave(filename: string): void {
  if (renameTimer) clearTimeout(renameTimer)
  renameTimer = setTimeout(() => {
    autoSaveFilename(filename)
  }, 500) // 500ms debounce
}

async function startAutoCloseTimer(): Promise<void> {
  console.log('[PREVIEW] Starting auto-close timer...')
  if (timer) clearTimeout(timer)
  timer = setTimeout(async () => {
    console.log('[PREVIEW] Auto-close timer firing...')
    try {
      // Try direct access first (since nodeIntegration is enabled)
      if (typeof window !== 'undefined' && (window as any).require) {
        const { ipcRenderer } = (window as any).require('electron')
        ipcRenderer.send('preview-close')
        return
      }

      // Fallback to dynamic import
      const electron = await import('electron')
      electron.ipcRenderer.send('preview-close')
    } catch (error) {
      console.error('[PREVIEW] IPC failed, using window.close():', error)
      window.close()
    }
  }, 5000)
}

// Log when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('[PREVIEW] DOM loaded')
  const img = document.querySelector('.preview-image') as HTMLImageElement
  console.log('[PREVIEW] Image element found:', !!img)
  if (img) {
    console.log('[PREVIEW] Image src length:', img.src ? img.src.length : 'null')
    console.log(
      '[PREVIEW] Image src type:',
      img.src
        ? img.src.startsWith('data:')
          ? 'data URL'
          : img.src.startsWith('file://')
            ? 'file URL'
            : 'unknown'
        : 'null'
    )
    console.log('[PREVIEW] Image complete status:', img.complete)
    console.log('[PREVIEW] Image natural dimensions:', img.naturalWidth, 'x', img.naturalHeight)

    // Start the auto-close timer
    startAutoCloseTimer()

    // Set timeout to detect if image never loads
    setTimeout(() => {
      console.log(
        '[PREVIEW] 3-second check - complete:',
        img.complete,
        'naturalWidth:',
        img.naturalWidth
      )
      if (!img.complete || img.naturalWidth === 0) {
        console.error('[PREVIEW] Image failed to load within 3 seconds')
        document.body.style.borderColor = 'orange'
        // Still start timer even if image fails to load
        if (!timer) startAutoCloseTimer()
      }
    }, 3000)
  } else {
    console.error('[PREVIEW] Image element not found!')
    // Start timer anyway
    startAutoCloseTimer()
  }

  // Set up auto-save for title input
  console.log('[PREVIEW] Looking for title input element...')
  const titleInput = document.querySelector('.preview-title-input') as HTMLInputElement
  console.log('[PREVIEW] Title input element found:', !!titleInput)
  if (titleInput) {
    console.log('[PREVIEW] Title input current value:', titleInput.value)
    titleInput.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement
      const filename = target.value.trim() || 'Screenshot'
      console.log('[PREVIEW] Title changed to:', filename)
      debouncedAutoSave(filename)
    })
    console.log('[PREVIEW] Auto-save listener added to title input')
  } else {
    console.error('[PREVIEW] Title input element not found!')
  }
})

document.body.addEventListener('mouseenter', () => {
  console.log('[PREVIEW] Mouse entered, clearing timer')
  if (timer) clearTimeout(timer)
  timer = null
})

document.body.addEventListener('mouseleave', () => {
  console.log('[PREVIEW] Mouse left, restarting timer')
  startAutoCloseTimer()
})

// Button functions are now loaded from separate modules

console.log('[PREVIEW] Script loaded successfully')
