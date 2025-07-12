console.log('[PREVIEW] Script loading...');
const { ipcRenderer } = require('electron');
console.log('[PREVIEW] ipcRenderer loaded:', !!ipcRenderer);

let timer = null;

function startAutoCloseTimer() {
  console.log('[PREVIEW] Starting auto-close timer...');
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    console.log('[PREVIEW] Auto-close timer firing...');
    try {
      ipcRenderer.send('preview-close');
    } catch (error) {
      console.error('[PREVIEW] IPC failed, using window.close():', error);
      window.close();
    }
  }, 5000);
}

// Log when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('[PREVIEW] DOM loaded');
  const img = document.querySelector('.preview-image');
  console.log('[PREVIEW] Image element found:', !!img);
  if (img) {
    console.log('[PREVIEW] Image src length:', img.src ? img.src.length : 'null');
    console.log('[PREVIEW] Image src type:', img.src ? (img.src.startsWith('data:') ? 'data URL' : img.src.startsWith('file://') ? 'file URL' : 'unknown') : 'null');
    console.log('[PREVIEW] Image complete status:', img.complete);
    console.log('[PREVIEW] Image natural dimensions:', img.naturalWidth, 'x', img.naturalHeight);
    
    // Start the auto-close timer
    startAutoCloseTimer();
    
    // Set timeout to detect if image never loads
    setTimeout(() => {
      console.log('[PREVIEW] 3-second check - complete:', img.complete, 'naturalWidth:', img.naturalWidth);
      if (!img.complete || img.naturalWidth === 0) {
        console.error('[PREVIEW] Image failed to load within 3 seconds');
        document.body.style.borderColor = 'orange';
        // Still start timer even if image fails to load
        if (!timer) startAutoCloseTimer();
      }
    }, 3000);
  } else {
    console.error('[PREVIEW] Image element not found!');
    // Start timer anyway
    startAutoCloseTimer();
  }
});

document.body.addEventListener('mouseenter', () => {
  console.log('[PREVIEW] Mouse entered, clearing timer');
  if (timer) clearTimeout(timer);
  timer = null;
});

document.body.addEventListener('mouseleave', () => {
  console.log('[PREVIEW] Mouse left, restarting timer');
  startAutoCloseTimer();
});

function copyImage() {
  console.log('[PREVIEW] Copy button clicked');
  ipcRenderer.send('preview-copy');
}

function saveImage() {
  console.log('[PREVIEW] Save button clicked');
  ipcRenderer.send('preview-save');
}

function shareImage() {
  console.log('[PREVIEW] Share button clicked');
  ipcRenderer.send('preview-share');
}

function closeWindow() {
  console.log('[PREVIEW] Close button clicked');
  try {
    ipcRenderer.send('preview-close');
  } catch (error) {
    console.error('[PREVIEW] IPC failed, using window.close():', error);
    window.close();
  }
}

console.log('[PREVIEW] Script loaded successfully');