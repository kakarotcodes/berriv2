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

// Attach event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const shareBtn = document.querySelector('button[title="Share"]')
  if (shareBtn) {
    shareBtn.addEventListener('click', shareImage)
  }
})

console.log('[SHARE_BUTTON] Share button script loaded successfully');