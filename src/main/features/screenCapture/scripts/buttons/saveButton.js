console.log('[SAVE_BUTTON] Loading save button script...');

async function saveImage() {
  console.log('[SAVE_BUTTON] Save button clicked');
  try {
    const electron = await import('electron');
    electron.ipcRenderer.send('preview-save');
  } catch (error) {
    console.error('[SAVE_BUTTON] Failed to send save command:', error);
  }
}

// Future complex functionality can go here
async function saveWithCustomName() {
  // TODO: Save with custom filename
}

async function saveToSpecificFolder() {
  // TODO: Save to user-selected folder
}

async function saveInMultipleFormats() {
  // TODO: Save in PNG, JPG, WebP formats
}

async function saveWithWatermark() {
  // TODO: Add watermark before saving
}

// Export functions to global scope
window.saveImage = saveImage;
window.saveWithCustomName = saveWithCustomName;
window.saveToSpecificFolder = saveToSpecificFolder;
window.saveInMultipleFormats = saveInMultipleFormats;
window.saveWithWatermark = saveWithWatermark;

console.log('[SAVE_BUTTON] Save button script loaded successfully');