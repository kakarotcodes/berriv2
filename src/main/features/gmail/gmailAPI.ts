import { google } from 'googleapis'

interface GmailEmail {
  id: string
  subject: string
  sender: string
  recipient: string
  body: string
  timestamp: string
  isRead: boolean
  isStarred: boolean
  labels: string[]
}

interface GmailAPIResponse {
  success: boolean
  emails?: GmailEmail[]
  error?: string
}

interface GetEmailsOptions {
  maxResults?: number
}

export class GmailAPI {
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

  async getEmails(accessToken: string, refreshToken?: string, options: GetEmailsOptions = {}): Promise<GmailAPIResponse> {
    try {
      console.log('[GMAIL_API] Starting email fetch...')
      console.log('[GMAIL_API] Access token available:', !!accessToken)
      console.log('[GMAIL_API] Refresh token available:', !!refreshToken)
      
      this.setCredentials(accessToken, refreshToken)

      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client })

      const { maxResults = 20 } = options

      console.log('[GMAIL_API] Requesting Gmail message list...')
      
      // First, get the list of message IDs
      const listResponse = await gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: 'in:inbox' // Only fetch emails from inbox
      })

      console.log('[GMAIL_API] Message list response received')

      if (!listResponse.data.messages) {
        console.log('[GMAIL_API] No messages found')
        return {
          success: true,
          emails: []
        }
      }

      console.log(`[GMAIL_API] Found ${listResponse.data.messages.length} messages, fetching details...`)

      // Then fetch details for each message
      const emails: GmailEmail[] = []
      
      for (const message of listResponse.data.messages.slice(0, maxResults)) {
        try {
          const messageResponse = await gmail.users.messages.get({
            userId: 'me',
            id: message.id!,
            format: 'full'
          })

          const emailData = messageResponse.data
          const headers = emailData.payload?.headers || []
          
          // Extract relevant headers
          const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject'
          const from = headers.find(h => h.name === 'From')?.value || 'Unknown Sender'
          const to = headers.find(h => h.name === 'To')?.value || 'Unknown Recipient'
          const date = headers.find(h => h.name === 'Date')?.value || new Date().toISOString()
          
          // Extract body (simplified - gets first text part)
          let body = ''
          if (emailData.payload?.parts) {
            const textPart = emailData.payload.parts.find(part => part.mimeType === 'text/plain')
            if (textPart?.body?.data) {
              body = Buffer.from(textPart.body.data, 'base64').toString('utf-8')
            }
          } else if (emailData.payload?.body?.data) {
            body = Buffer.from(emailData.payload.body.data, 'base64').toString('utf-8')
          }

          // Limit body length for display
          if (body.length > 500) {
            body = body.substring(0, 500) + '...'
          }

          // Parse timestamp
          const timestamp = new Date(date).toISOString()

          // Check if message is read/unread
          const isRead = !emailData.labelIds?.includes('UNREAD')
          const isStarred = emailData.labelIds?.includes('STARRED') || false
          const labels = emailData.labelIds || []

          emails.push({
            id: emailData.id || '',
            subject,
            sender: from,
            recipient: to,
            body: body || 'No content available',
            timestamp,
            isRead,
            isStarred,
            labels
          })

        } catch (messageError) {
          console.error('[GMAIL_API] Error fetching individual message:', messageError)
          // Continue with other messages even if one fails
        }
      }

      console.log(`[GMAIL_API] Successfully processed ${emails.length} emails`)

      return {
        success: true,
        emails
      }

    } catch (error) {
      console.error('[GMAIL_API] Gmail API error:', error)
      console.error('[GMAIL_API] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code,
        status: (error as any)?.status,
        errors: (error as any)?.errors
      })
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch emails'
      }
    }
  }
}

export const gmailAPI = new GmailAPI() 