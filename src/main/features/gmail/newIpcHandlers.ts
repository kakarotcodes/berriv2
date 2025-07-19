import { ipcMain } from 'electron'
import { newGmailAPI } from './newGmailAPI'

interface EmailAttachment {
  filename: string
  mimeType: string
  size?: number
}

interface EmailResponse {
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
    attachments: EmailAttachment[]
  }>
  error?: string
}

export function registerNewGmailHandlers(): void {
  // Handle getting Gmail emails with attachments
  ipcMain.handle('gmail:get-emails-new', async (_event, options): Promise<EmailResponse> => {
    console.log('[NEW_IPC] 🎯 gmail:get-emails-new handler called with options:', options)

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

      console.log('[NEW_IPC] Fetching Gmail emails with new API')
      const result = await newGmailAPI.getEmails(
        authTokens.access, 
        authTokens.refresh, 
        options?.maxResults || 20
      )

      if (result.success) {
        console.log(`[NEW_IPC] ✅ Successfully fetched ${result.emails?.length || 0} emails`)
        console.log(`[NEW_IPC] Emails with attachments: ${result.emails?.filter(e => e.attachments.length > 0).length || 0}`)
      }

      return result
    } catch (error) {
      console.error('[NEW_IPC] Failed to get Gmail emails:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch Gmail emails'
      }
    }
  })

  console.log('[NEW_IPC] New Gmail handlers registered')
}