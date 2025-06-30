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
  query?: string
}

// Predefined filter queries
export const GMAIL_FILTERS = {
  PRIMARY: 'category:primary',
  ALL_INBOX: 'in:inbox',
  UNREAD: 'in:inbox is:unread',
  IMPORTANT: 'in:inbox is:important',
  STARRED: 'in:inbox is:starred',
  PERSONAL: 'category:primary -from:noreply -from:no-reply -from:newsletter -from:donotreply -from:notifications -subject:unsubscribe',
  FILTERED: 'in:inbox -in:spam -in:trash -from:noreply -from:no-reply -from:newsletter -from:donotreply -from:notifications -subject:unsubscribe -category:promotions -category:social -category:updates'
} as const

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

  private extractEmailFromString(emailString: string): string {
    // Extract email from "Name <email@domain.com>" format
    const match = emailString.match(/<([^>]+)>/)
    return match ? match[1] : emailString
  }

  private extractNameFromString(emailString: string): string {
    // Extract name from "Name <email@domain.com>" format
    const match = emailString.match(/^([^<]+)</)
    return match ? match[1].trim().replace(/"/g, '') : emailString
  }

  private generateEmailPreview(subject: string, sender: string): string {
    // Generate a simple preview without fetching body - return empty since subject is already shown
    return ''
  }

  async getEmails(accessToken: string, refreshToken?: string, options: GetEmailsOptions = {}): Promise<GmailAPIResponse> {
    try {
      console.log('[GMAIL_API] Starting optimized email fetch...')
      console.log('[GMAIL_API] Access token available:', !!accessToken)
      console.log('[GMAIL_API] Refresh token available:', !!refreshToken)
      
      this.setCredentials(accessToken, refreshToken)

      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client })

      const { maxResults = 20, query = GMAIL_FILTERS.PRIMARY } = options

      console.log('[GMAIL_API] Using query:', query)
      console.log('[GMAIL_API] Requesting Gmail message list...')
      
      const startTime = Date.now()
      
      // First, get the list of message IDs with the specified query
      const listResponse = await gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: query
      })

      console.log('[GMAIL_API] Message list response received in', Date.now() - startTime, 'ms')

      if (!listResponse.data.messages) {
        console.log('[GMAIL_API] No messages found for query:', query)
        return {
          success: true,
          emails: []
        }
      }

      console.log(`[GMAIL_API] Found ${listResponse.data.messages.length} messages, fetching metadata concurrently...`)

      // Fetch all message details concurrently using Promise.all
      // Use metadata format for much faster responses (no body content)
      const messagePromises = listResponse.data.messages.slice(0, maxResults).map(message =>
        gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
          format: 'metadata', // Much faster than 'full' - only headers and labels
          metadataHeaders: ['Subject', 'From', 'To', 'Date'] // Only fetch required headers
        }).catch(error => {
          console.error('[GMAIL_API] Error fetching message:', message.id, error)
          return null // Return null for failed requests
        })
      )

      const messageResponses = await Promise.all(messagePromises)
      
      console.log('[GMAIL_API] All message details fetched in', Date.now() - startTime, 'ms')

      // Process responses and build email objects
      const emails: GmailEmail[] = []
      
      for (const messageResponse of messageResponses) {
        if (!messageResponse?.data) continue

        try {
          const emailData = messageResponse.data
          const headers = emailData.payload?.headers || []
          
          // Extract relevant headers
          const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject'
          const from = headers.find(h => h.name === 'From')?.value || 'Unknown Sender'
          const to = headers.find(h => h.name === 'To')?.value || 'Unknown Recipient'
          const date = headers.find(h => h.name === 'Date')?.value || new Date().toISOString()
          
          // Generate a simple preview instead of fetching body
          const body = this.generateEmailPreview(subject, from)

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
            body,
            timestamp,
            isRead,
            isStarred,
            labels
          })

        } catch (messageError) {
          console.error('[GMAIL_API] Error processing individual message:', messageError)
          // Continue with other messages even if one fails
        }
      }

      const totalTime = Date.now() - startTime
      console.log(`[GMAIL_API] Successfully processed ${emails.length} emails with query: ${query} in ${totalTime}ms`)
      console.log(`[GMAIL_API] Performance: ${Math.round(totalTime / emails.length)}ms per email`)

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