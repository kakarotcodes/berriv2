// OCR Button functionality for screenshot preview
console.log('[OCR_BUTTON] OCR button script loaded')

function copyTextToClipboard() {
  const ocrText = document.getElementById('ocrText')
  if (ocrText && ocrText.textContent) {
    navigator.clipboard.writeText(ocrText.textContent)
      .then(() => {
        console.log('[OCR_BUTTON] Text copied to clipboard successfully')
        
        // Visual feedback
        const copyBtn = document.getElementById('copyTextBtn')
        if (copyBtn) {
          const originalText = copyBtn.textContent
          copyBtn.textContent = '✓ Copied'
          copyBtn.style.background = 'rgb(48, 209, 88)'
          
          setTimeout(() => {
            copyBtn.textContent = originalText
            copyBtn.style.background = ''
          }, 1500)
        }
      })
      .catch(err => {
        console.error('[OCR_BUTTON] Failed to copy text:', err)
      })
  }
}

function createNoteFromText() {
  const ocrText = document.getElementById('ocrText')
  if (ocrText && ocrText.textContent) {
    // Send IPC message to create a new note with the extracted text
    const { ipcRenderer } = require('electron')
    
    const note = {
      id: Date.now().toString(),
      title: 'Screenshot Text',
      type: 'text',
      content: ocrText.textContent,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pinned: false,
      trashed: false
    }
    
    ipcRenderer.invoke('notes:insert', note)
      .then(() => {
        console.log('[OCR_BUTTON] Note created successfully')
        
        // Visual feedback
        const createBtn = document.getElementById('createNoteBtn')
        if (createBtn) {
          const originalText = createBtn.textContent
          createBtn.textContent = '✓ Note Created'
          createBtn.style.background = 'rgb(48, 209, 88)'
          
          setTimeout(() => {
            createBtn.textContent = originalText
            createBtn.style.background = ''
          }, 1500)
        }
      })
      .catch(err => {
        console.error('[OCR_BUTTON] Failed to create note:', err)
      })
  }
}

// Attach event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const copyTextBtn = document.getElementById('copyTextBtn')
  const createNoteBtn = document.getElementById('createNoteBtn')
  
  if (copyTextBtn) {
    copyTextBtn.addEventListener('click', copyTextToClipboard)
    console.log('[OCR_BUTTON] Copy text button listener attached')
  }
  
  if (createNoteBtn) {
    createNoteBtn.addEventListener('click', createNoteFromText)
    console.log('[OCR_BUTTON] Create note button listener attached')
  }
})

// Make functions available globally
window.copyTextToClipboard = copyTextToClipboard
window.createNoteFromText = createNoteFromText

console.log('[OCR_BUTTON] OCR functions attached to window')