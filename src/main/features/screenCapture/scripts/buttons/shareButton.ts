console.log('[SHARE_BUTTON] Loading share button script...');

async function shareImage(): Promise<void> {
  console.log('[SHARE_BUTTON] Share button clicked');
  try {
    const electron = await import('electron');
    electron.ipcRenderer.send('preview-share');
  } catch (error) {
    console.error('[SHARE_BUTTON] Failed to send share command:', error);
  }
}

// Future complex functionality can go here
async function shareToSlack(): Promise<void> {
  // TODO: Direct share to Slack
}

async function shareToDiscord(): Promise<void> {
  // TODO: Direct share to Discord
}

async function shareViaEmail(): Promise<void> {
  // TODO: Share via email client
}

async function shareToCloudStorage(): Promise<void> {
  // TODO: Upload to Dropbox/Google Drive and share link
}

async function shareWithAnnotations(): Promise<void> {
  // TODO: Add annotations before sharing
}

// Export functions to global scope
;(window as any).shareImage = shareImage
;(window as any).shareToSlack = shareToSlack
;(window as any).shareToDiscord = shareToDiscord
;(window as any).shareViaEmail = shareViaEmail
;(window as any).shareToCloudStorage = shareToCloudStorage
;(window as any).shareWithAnnotations = shareWithAnnotations

console.log('[SHARE_BUTTON] Share button script loaded successfully');