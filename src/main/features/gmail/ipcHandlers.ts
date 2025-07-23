import { ipcMain, shell } from 'electron'
import { gmailAPI } from './gmailAPI'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

interface GmailResponse {
  success: boolean
  emails?: Array<{
    id: string
    threadId: string
    subject: string
    sender: string
    senderName: string
    recipient: string
    snippet: string
    timestamp: string
    isRead: boolean
    isStarred: boolean
    isImportant: boolean
    labels: string[]
    hasAttachments: boolean
    attachments: Array<{
      filename: string
      mimeType: string
      size: number
      attachmentId: string
    }>
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

  // Handle downloading Gmail attachment
  ipcMain.handle('gmail:download-attachment', async (_event, { messageId, attachmentId, filename }): Promise<{ success: boolean; filePath?: string; error?: string }> => {
    console.log('[IPC] gmail:download-attachment handler called with:', { messageId, attachmentId, filename })

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

      console.log('[IPC] Fetching Gmail attachment for download')
      const result = await gmailAPI.getAttachment(authTokens.access, authTokens.refresh, messageId, attachmentId)

      if (result.success && result.data) {
        // Convert base64 data to buffer
        const buffer = Buffer.from(result.data.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
        
        // Save to Downloads folder
        const downloadsPath = path.join(os.homedir(), 'Downloads')
        const filePath = path.join(downloadsPath, filename)
        
        // Write buffer to file
        fs.writeFileSync(filePath, buffer)
        
        console.log('[IPC] Gmail attachment downloaded successfully:', filename)
        return { success: true, filePath }
      } else {
        return {
          success: false,
          error: result.error || 'Failed to get attachment'
        }
      }
    } catch (error) {
      console.error('[IPC] Failed to download Gmail attachment:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to download Gmail attachment'
      }
    }
  })

  console.log('[IPC] Gmail handlers registered')
} 