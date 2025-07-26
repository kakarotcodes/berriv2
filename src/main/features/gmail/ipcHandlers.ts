import { ipcMain } from 'electron'
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
        let filePath = path.join(downloadsPath, filename)
        
        // Handle filename conflicts by adding a number suffix
        let counter = 1
        const originalName = filename
        const fileExtension = path.extname(originalName)
        const baseName = path.basename(originalName, fileExtension)
        
        while (fs.existsSync(filePath)) {
          const newFilename = `${baseName} (${counter})${fileExtension}`
          filePath = path.join(downloadsPath, newFilename)
          counter++
        }
        
        // Write buffer to file
        fs.writeFileSync(filePath, buffer)
        
        console.log('[IPC] Gmail attachment downloaded successfully to:', filePath)
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

  // Handle getting full Gmail email
  ipcMain.handle('gmail:get-full-email', async (_event, { messageId }): Promise<{ success: boolean; email?: any; error?: string }> => {
    console.log('[IPC] gmail:get-full-email handler called with:', { messageId })

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

      console.log('[IPC] Fetching full Gmail email')
      console.log('[IPC] About to call gmailAPI.getFullEmail with:', { messageId, hasAccess: !!authTokens.access })
      const result = await gmailAPI.getFullEmail(authTokens.access, authTokens.refresh, messageId)
      console.log('[IPC] gmailAPI.getFullEmail returned:', { success: result.success, bodyLength: result.email?.body?.length })

      if (result.success && result.email) {
        console.log('[IPC] Full Gmail email fetched successfully')
        return result
      } else {
        return {
          success: false,
          error: result.error || 'Failed to get full email'
        }
      }
    } catch (error) {
      console.error('[IPC] Failed to get full Gmail email:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch full Gmail email'
      }
    }
  })

  // Handle sending Gmail email
  ipcMain.handle('gmail:send-email', async (_event, options): Promise<{ success: boolean; messageId?: string; error?: string }> => {
    console.log('[IPC] gmail:send-email handler called with:', { 
      to: options.to, 
      subject: options.subject, 
      hasBody: !!options.body 
    })

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

      console.log('[IPC] Sending Gmail email')
      const result = await gmailAPI.sendEmail(authTokens.access, authTokens.refresh, options)

      if (result.success) {
        console.log('[IPC] Gmail email sent successfully:', result.messageId)
        return result
      } else {
        return {
          success: false,
          error: result.error || 'Failed to send email'
        }
      }
    } catch (error) {
      console.error('[IPC] Failed to send Gmail email:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send Gmail email'
      }
    }
  })

  // Handle saving Gmail draft
  ipcMain.handle('gmail:save-draft', async (_event, options): Promise<{ success: boolean; draftId?: string; error?: string }> => {
    console.log('[IPC] gmail:save-draft handler called with:', { 
      to: options.to, 
      subject: options.subject, 
      hasBody: !!options.body 
    })

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

      console.log('[IPC] Saving Gmail draft')
      const result = await gmailAPI.saveDraft(authTokens.access, authTokens.refresh, options)

      if (result.success) {
        console.log('[IPC] Gmail draft saved successfully:', result.draftId)
        return result
      } else {
        return {
          success: false,
          error: result.error || 'Failed to save draft'
        }
      }
    } catch (error) {
      console.error('[IPC] Failed to save Gmail draft:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save Gmail draft'
      }
    }
  })

  // Handle deleting Gmail draft
  ipcMain.handle('gmail:delete-draft', async (_event, draftId: string): Promise<{ success: boolean; error?: string }> => {
    console.log('[IPC] gmail:delete-draft handler called with:', { draftId })

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

      console.log('[IPC] Deleting Gmail draft')
      const result = await gmailAPI.deleteDraft(authTokens.access, authTokens.refresh, draftId)

      if (result.success) {
        console.log('[IPC] Gmail draft deleted successfully')
        return result
      } else {
        return {
          success: false,
          error: result.error || 'Failed to delete draft'
        }
      }
    } catch (error) {
      console.error('[IPC] Failed to delete Gmail draft:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete Gmail draft'
      }
    }
  })

  // Handle deleting Gmail message
  ipcMain.handle('gmail:delete-message', async (_event, messageId: string): Promise<{ success: boolean; error?: string }> => {
    console.log('[IPC] gmail:delete-message handler called with:', { messageId })

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

      console.log('[IPC] Deleting Gmail message')
      const result = await gmailAPI.deleteMessage(authTokens.access, authTokens.refresh, messageId)

      if (result.success) {
        console.log('[IPC] Gmail message deleted successfully')
        return result
      } else {
        return {
          success: false,
          error: result.error || 'Failed to delete message'
        }
      }
    } catch (error) {
      console.error('[IPC] Failed to delete Gmail message:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete Gmail message'
      }
    }
  })

  console.log('[IPC] Gmail handlers registered')
} 