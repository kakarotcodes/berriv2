import { ipcMain } from 'electron'
import { gmailAPI } from './gmailAPI'

interface GmailResponse {
  success: boolean
  emails?: Array<{
    id: string
    subject: string
    sender: string
    recipient: string
    body: string
    timestamp: string
    isRead: boolean
    isStarred: boolean
    labels: string[]
    hasAttachments: boolean
    attachments: string[]
  }>
  error?: string
}

export function registerGmailHandlers(): void {
  // Handle getting Gmail emails
  ipcMain.handle('gmail:get-emails', async (_event, options): Promise<GmailResponse> => {
    console.log('[IPC] gmail:get-emails handler called with options:', options)

    try {
      // Get the current auth tokens from global state
      const authTokens = (global as { authTokens?: { access: string; refresh?: string } })
        .authTokens

      if (!authTokens?.access) {
        return {
          success: false,
          error: 'No authentication tokens available. Please authenticate first.'
        }
      }

      console.log('[IPC] Fetching Gmail emails with tokens')
      const result = await gmailAPI.getEmails(authTokens.access, authTokens.refresh, options)

      console.log(
        '[IPC] Gmail emails fetched successfully:',
        result.emails?.length || 0,
        'emails'
      )
      return result
    } catch (error) {
      console.error('[IPC] Failed to get Gmail emails:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch Gmail emails'
      }
    }
  })

  console.log('[IPC] Gmail handlers registered')
} 