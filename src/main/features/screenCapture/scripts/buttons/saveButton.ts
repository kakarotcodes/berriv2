console.log('[SAVE_BUTTON] Loading save button script...');

async function saveImage(): Promise<void> {
  console.log('[SAVE_BUTTON] Save button clicked');
  try {
    const electron = await import('electron');
    electron.ipcRenderer.send('preview-save');
  } catch (error) {
    console.error('[SAVE_BUTTON] Failed to send save command:', error);
  }
}

// Future complex functionality can go here
async function saveWithCustomName(): Promise<void> {
  // TODO: Save with custom filename
}

async function saveToSpecificFolder(): Promise<void> {
  // TODO: Save to user-selected folder
}

async function saveInMultipleFormats(): Promise<void> {
  // TODO: Save in PNG, JPG, WebP formats
}

async function saveWithWatermark(): Promise<void> {
  // TODO: Add watermark before saving
}

// Attach event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const saveBtn = document.querySelector('button[title="Save to file"]')
  if (saveBtn) {
    saveBtn.addEventListener('click', saveImage)
  }
})

console.log('[SAVE_BUTTON] Save button script loaded successfully');