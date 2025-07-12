console.log('[PREVIEW] Script loading...')

let timer: NodeJS.Timeout | null = null

// Function to set the image URL
function setImageUrl(imageUrl: string): void {
  const img = document.getElementById('previewImage') as HTMLImageElement
  if (img) {
    img.src = imageUrl
    console.log('[PREVIEW] Image URL set:', imageUrl.startsWith('data:') ? 'data URL' : 'file URL')
  }
}

async function startAutoCloseTimer(): Promise<void> {
  console.log('[PREVIEW] Starting auto-close timer...')
  if (timer) clearTimeout(timer)
  timer = setTimeout(async () => {
    console.log('[PREVIEW] Auto-close timer firing...')
    try {
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
