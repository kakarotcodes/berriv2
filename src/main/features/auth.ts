import { shell } from 'electron'

export function openGoogleLoginWindow(): void {
  // Open OAuth URL in the user's default browser (like Google Meet button)
  const authUrl = 'http://localhost:3000/login?source=electron'
  shell.openExternal(authUrl)
  console.log('Opened Google OAuth in external browser:', authUrl)
}

export function closeAuthWindow(): void {
  // No longer needed since we're using external browser
  console.log('closeAuthWindow called but not needed for external browser flow')
}

export function getAuthWindow(): null {
  // No longer needed since we're using external browser
  return null
}
