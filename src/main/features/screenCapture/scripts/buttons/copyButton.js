console.log('[COPY_BUTTON] Loading copy button script...')
// Access ipcRenderer from global context
const { ipcRenderer } = window.require('electron')

function copyImage() {
  console.log('[COPY_BUTTON] Copy button clicked')
  try {
    const { ipcRenderer } = window.require('electron')
    ipcRenderer.send('preview-copy')
  } catch (error) {
    console.error('[COPY_BUTTON] Failed to send copy command:', error)
  }
}

// Future complex functionality can go here
function copyWithMetadata() {
  // TODO: Copy image with metadata, OCR text, etc.
}

function copyAsMarkdown() {
  // TODO: Copy as markdown format
}

// Export functions to global scope
window.copyImage = copyImage
window.copyWithMetadata = copyWithMetadata
window.copyAsMarkdown = copyAsMarkdown

console.log('[COPY_BUTTON] Copy button script loaded successfully')
