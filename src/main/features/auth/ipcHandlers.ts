import { ipcMain } from 'electron'
import { openGoogleLoginWindow, closeAuthWindow } from '../auth'

export function registerAuthHandlers(): void {
  // Handle opening the Google login window
  ipcMain.handle('auth:open-google-login', async () => {
    try {
      openGoogleLoginWindow()
      return { success: true }
    } catch (error) {
      console.error('Failed to open Google login window:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Handle getting current auth tokens
  ipcMain.handle('auth:get-tokens', async () => {
    try {
      const tokens = (global as any).authTokens
      return { success: true, tokens }
    } catch (error) {
      console.error('Failed to get auth tokens:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Handle clearing auth tokens (logout)
  ipcMain.handle('auth:logout', async () => {
    try {
      ;(global as any).authTokens = null
      closeAuthWindow()
      return { success: true }
    } catch (error) {
      console.error('Failed to logout:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  console.log('[IPC] Auth handlers registered')
} 