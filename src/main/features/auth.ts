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

export function requestCalendarPermissions(): void {
  // Open calendar permissions request URL in the user's default browser
  const calendarPermissionUrl = 'http://localhost:3000/auth/calendar?source=electron'
  shell.openExternal(calendarPermissionUrl)
  console.log('Opened calendar permissions request in external browser:', calendarPermissionUrl)
}

export function requestGmailPermissions(): void {
  // Open Gmail permissions request URL in the user's default browser
  // Using the same calendar auth route since no dedicated Gmail route exists
  const gmailPermissionUrl = 'http://localhost:3000/auth/calendar?source=electron'
  shell.openExternal(gmailPermissionUrl)
  console.log('Opened Gmail permissions request in external browser (using calendar route):', gmailPermissionUrl)
}
