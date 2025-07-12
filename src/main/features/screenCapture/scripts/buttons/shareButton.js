console.log('[SHARE_BUTTON] Loading share button script...');

async function shareImage() {
  console.log('[SHARE_BUTTON] Share button clicked');
  try {
    const electron = await import('electron');
    electron.ipcRenderer.send('preview-share');
  } catch (error) {
    console.error('[SHARE_BUTTON] Failed to send share command:', error);
  }
}

// Future complex functionality can go here
async function shareToSlack() {
  // TODO: Direct share to Slack
}

async function shareToDiscord() {
  // TODO: Direct share to Discord
}

async function shareViaEmail() {
  // TODO: Share via email client
}

async function shareToCloudStorage() {
  // TODO: Upload to Dropbox/Google Drive and share link
}

async function shareWithAnnotations() {
  // TODO: Add annotations before sharing
}

// Export functions to global scope
window.shareImage = shareImage;
window.shareToSlack = shareToSlack;
window.shareToDiscord = shareToDiscord;
window.shareViaEmail = shareViaEmail;
window.shareToCloudStorage = shareToCloudStorage;
window.shareWithAnnotations = shareWithAnnotations;

console.log('[SHARE_BUTTON] Share button script loaded successfully');