import { ipcMain } from 'electron'
import { openGoogleLoginWindow, closeAuthWindow, requestCalendarPermissions, requestGmailPermissions } from '../auth'

interface AuthResponse {
  success: boolean
  error?: string
  tokens?: unknown
}

export function registerAuthHandlers(): void {
  // Handle opening the Google login window
  ipcMain.handle('auth:open-google-login', async (): Promise<AuthResponse> => {
    try {
      openGoogleLoginWindow()
      return { success: true }
    } catch (error) {
      console.error('Failed to open Google login window:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to open login window'
      }
    }
  })

  // Handle calendar permission request
  ipcMain.handle('auth:request-calendar', async (): Promise<AuthResponse> => {
    console.log('[IPC] auth:request-calendar handler called')
    try {
      requestCalendarPermissions()
      console.log('[IPC] requestCalendarPermissions completed successfully')
      return {
        success: true
      }
    } catch (error) {
      console.error('[IPC] Failed to request calendar permissions:', error)
      console.error('[IPC] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        type: typeof error
      })
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to open calendar permission request'
      }
    }
  })

  // Handle Gmail permission request
  ipcMain.handle('auth:request-gmail', async (): Promise<AuthResponse> => {
    console.log('[IPC] auth:request-gmail handler called')
    try {
      requestGmailPermissions()
      console.log('[IPC] requestGmailPermissions completed successfully')
      return {
        success: true
      }
    } catch (error) {
      console.error('[IPC] Failed to request Gmail permissions:', error)
      console.error('[IPC] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        type: typeof error
      })
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to open Gmail permission request'
      }
    }
  })

  // Handle getting current auth tokens
  ipcMain.handle('auth:get-tokens', async (): Promise<AuthResponse> => {
    try {
      const tokens = (global as { authTokens?: unknown }).authTokens
      return { success: true, tokens }
    } catch (error) {
      console.error('Failed to get auth tokens:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  // Handle clearing auth tokens (logout)
  ipcMain.handle('auth:logout', async (): Promise<AuthResponse> => {
    try {
      ;(global as { authTokens?: unknown }).authTokens = null
      closeAuthWindow()
      return { success: true }
    } catch (error) {
      console.error('Failed to logout:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  console.log('[IPC] Auth handlers registered')
}
