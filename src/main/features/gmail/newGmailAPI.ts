import { google } from 'googleapis'

interface EmailAttachment {
  filename: string
  mimeType: string
  size?: number
}

interface Email {
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
}

interface EmailAPIResponse {
  success: boolean
  emails?: Email[]
  error?: string
}

export class NewGmailAPI {
  private oauth2Client: any

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )
  }

  private setCredentials(accessToken: string, refreshToken?: string): void {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    })
  }

  private extractAttachments(payload: any): EmailAttachment[] {
    const attachments: EmailAttachment[] = []

    const walkParts = (part: any): void => {
      if (!part) return

      // Check if this part has an attachment
      if (part.filename && part.filename.trim() !== '') {
        attachments.push({
          filename: part.filename,
          mimeType: part.mimeType || 'unknown',
          size: part.body?.size
        })
        console.log(`[NEW_GMAIL_API] Found attachment: ${part.filename} (${part.mimeType})`)
      } 
      // Check for attachment ID (inline attachments)
      else if (part.body?.attachmentId) {
        const fileName = part.mimeType ? `attachment.${part.mimeType.split('/')[1]}` : 'attachment'
        attachments.push({
          filename: fileName,
          mimeType: part.mimeType || 'unknown',
          size: part.body?.size
        })
        console.log(`[NEW_GMAIL_API] Found inline attachment: ${fileName} (${part.mimeType})`)
      }

      // Recursively check nested parts
      if (part.parts && Array.isArray(part.parts)) {
        part.parts.forEach(walkParts)
      }
    }

    // Start walking from the payload
    if (payload) {
      walkParts(payload)
    }

    return attachments
  }

  async getEmails(accessToken: string, refreshToken?: string, maxResults: number = 20): Promise<EmailAPIResponse> {
    try {
      console.log('[NEW_GMAIL_API] 🚀 Starting email fetch with attachment detection...')
      console.log('[NEW_GMAIL_API] 🔑 Access token available:', !!accessToken)
      
      this.setCredentials(accessToken, refreshToken)
      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client })

      // Get message list
      const listResponse = await gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: 'in:inbox'
      })

      if (!listResponse.data.messages) {
        return { success: true, emails: [] }
      }

      console.log(`[NEW_GMAIL_API] Found ${listResponse.data.messages.length} messages`)

      // Fetch full message details for attachment detection
      const emails: Email[] = []
      
      for (const message of listResponse.data.messages.slice(0, maxResults)) {
        try {
          const messageResponse = await gmail.users.messages.get({
            userId: 'me',
            id: message.id!,
            format: 'full'
          })

          const emailData = messageResponse.data
          const headers = emailData.payload?.headers || []

          // Extract headers
          const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject'
          const from = headers.find(h => h.name === 'From')?.value || 'Unknown Sender'
          const to = headers.find(h => h.name === 'To')?.value || 'Unknown Recipient'
          const date = headers.find(h => h.name === 'Date')?.value || new Date().toISOString()

          // Extract attachments
          const attachments = this.extractAttachments(emailData.payload)
          
          if (attachments.length > 0) {
            console.log(`[NEW_GMAIL_API] ✅ Email "${subject}" has ${attachments.length} attachments:`, 
              attachments.map(a => a.filename))
          }

          // Basic email info
          const email: Email = {
            id: emailData.id || '',
            subject,
            sender: from,
            recipient: to,
            body: '',
            timestamp: new Date(date).toISOString(),
            isRead: !emailData.labelIds?.includes('UNREAD'),
            isStarred: emailData.labelIds?.includes('STARRED') || false,
            labels: emailData.labelIds || [],
            attachments
          }

          emails.push(email)

        } catch (error) {
          console.error('[NEW_GMAIL_API] Error processing message:', error)
        }
      }

      console.log(`[NEW_GMAIL_API] Successfully processed ${emails.length} emails`)
      console.log(`[NEW_GMAIL_API] Emails with attachments: ${emails.filter(e => e.attachments.length > 0).length}`)

      return {
        success: true,
        emails: emails.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      }

    } catch (error) {
      console.error('[NEW_GMAIL_API] Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch emails'
      }
    }
  }
}

export const newGmailAPI = new NewGmailAPI()