console.log('[COPY_BUTTON] Loading copy button script...')
// Access ipcRenderer from global context
const { ipcRenderer } = (window as any).require('electron')

function copyImage(): void {
  console.log('[COPY_BUTTON] Copy button clicked')
  try {
    const { ipcRenderer } = (window as any).require('electron')
    ipcRenderer.send('preview-copy')
  } catch (error) {
    console.error('[COPY_BUTTON] Failed to send copy command:', error)
  }
}

// Future complex functionality can go here
function copyWithMetadata(): void {
  // TODO: Copy image with metadata, OCR text, etc.
}

function copyAsMarkdown(): void {
  // TODO: Copy as markdown format
}

// Attach event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const copyBtn = document.querySelector('button[title="Copy to clipboard"]')
  if (copyBtn) {
    copyBtn.addEventListener('click', copyImage)
  }
})

console.log('[COPY_BUTTON] Copy button script loaded successfully')
