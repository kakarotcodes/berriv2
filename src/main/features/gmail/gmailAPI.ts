import { google } from 'googleapis'

// Clean, optimized email interface for Gmail-like UI
interface GmailEmail {
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
  attachments: GmailAttachment[]
}

interface GmailAttachment {
  filename: string
  mimeType: string
  size: number
  attachmentId: string
}

interface GmailAPIResponse {
  success: boolean
  emails?: GmailEmail[]
  error?: string
}

interface GetEmailsOptions {
  maxResults?: number
  query?: string
  pageToken?: string
}

interface SendEmailOptions {
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  body: string
  attachments?: Array<{
    filename: string
    content: string // base64 encoded content
    mimeType: string
  }>
  replyToMessageId?: string
  inReplyTo?: string
  references?: string
}

interface SaveDraftOptions {
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  body: string
}

// Optimized Gmail filter queries
export const GMAIL_FILTERS = {
  INBOX: 'in:inbox',
  UNREAD: 'in:inbox is:unread',
  STARRED: 'in:inbox is:starred',
  IMPORTANT: 'in:inbox is:important',
  SENT: 'in:sent',
  PRIMARY: 'category:primary',
  SOCIAL: 'category:social',
  PROMOTIONS: 'category:promotions',
  UPDATES: 'category:updates'
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

  private extractSenderInfo(fromHeader: string): { email: string; name: string } {
    if (!fromHeader) return { email: 'unknown@example.com', name: 'Unknown' }
    
    // Parse "Name <email@domain.com>" format
    const match = fromHeader.match(/^(.+?)\s*<(.+?)>$/)
    if (match) {
      return {
        name: match[1].trim().replace(/^"|"$/g, ''),
        email: match[2].trim()
      }
    }
    
    // Just email without name
    return { email: fromHeader.trim(), name: fromHeader.trim() }
  }

  private extractAttachments(payload: any): GmailAttachment[] {
    const attachments: GmailAttachment[] = []
    
    if (!payload) return attachments

    const processPayloadPart = (part: any) => {
      if (!part) return
      
      // Check if this part is an attachment
      if (part.filename && part.filename.length > 0) {
        const body = part.body || {}
        attachments.push({
          filename: part.filename,
          mimeType: part.mimeType || 'application/octet-stream',
          size: body.size ? parseInt(body.size, 10) : 0,
          attachmentId: body.attachmentId || ''
        })
      }
      
      // Recursively process nested parts
      if (part.parts && Array.isArray(part.parts)) {
        part.parts.forEach(processPayloadPart)
      }
    }

    // Process the main payload and all its parts
    processPayloadPart(payload)
    
    return attachments
  }

  private formatTimestamp(dateStr: string): string {
    try {
      return new Date(dateStr).toISOString()
    } catch {
      return new Date().toISOString()
    }
  }

  async getEmails(accessToken: string, refreshToken?: string, options: GetEmailsOptions = {}): Promise<GmailAPIResponse> {
    const startTime = Date.now()
    console.log('[GMAIL_API] Starting optimized email fetch...')
    
    try {
      this.setCredentials(accessToken, refreshToken)
      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client })

      const { maxResults = 20, query = GMAIL_FILTERS.INBOX, pageToken } = options

      console.log(`[GMAIL_API] Fetching emails with query: "${query}", maxResults: ${maxResults}`)

      // Step 1: Get message list
      const listResponse = await gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: query,
        pageToken
      })

      if (!listResponse.data.messages || listResponse.data.messages.length === 0) {
        console.log('[GMAIL_API] No messages found')
        return { success: true, emails: [] }
      }

      console.log(`[GMAIL_API] Found ${listResponse.data.messages.length} messages`)

      // Step 2: Fetch message details with optimized format
      // Using 'full' format but with specific fields to get attachments + essential data
      const messagePromises = listResponse.data.messages.map(async (message) => {
        try {
          const response = await gmail.users.messages.get({
            userId: 'me',
            id: message.id!,
            format: 'full',
            fields: 'id,threadId,labelIds,snippet,payload(headers,parts(filename,mimeType,body(size,attachmentId),parts))'
          })
          return response.data
        } catch (error) {
          console.error(`[GMAIL_API] Failed to fetch message ${message.id}:`, error)
          return null
        }
      })

      const messageResponses = await Promise.all(messagePromises)
      const validMessages = messageResponses.filter(msg => msg !== null)

      console.log(`[GMAIL_API] Successfully fetched ${validMessages.length} message details`)

      // Step 3: Process messages into clean email objects
      const emails: GmailEmail[] = []

      for (const messageData of validMessages) {
        try {
          const headers = messageData.payload?.headers || []
          
          // Extract headers
          const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject'
          const from = headers.find(h => h.name === 'From')?.value || 'Unknown Sender'
          const to = headers.find(h => h.name === 'To')?.value || 'Unknown Recipient'
          const date = headers.find(h => h.name === 'Date')?.value || new Date().toISOString()
          
          // Extract sender info
          const senderInfo = this.extractSenderInfo(from)
          
          // Extract labels and status
          const labels = messageData.labelIds || []
          const isRead = !labels.includes('UNREAD')
          const isStarred = labels.includes('STARRED')
          const isImportant = labels.includes('IMPORTANT')
          
          // Extract attachments
          const attachments = this.extractAttachments(messageData.payload)
          
          emails.push({
            id: messageData.id || '',
            threadId: messageData.threadId || '',
            subject,
            sender: senderInfo.email,
            senderName: senderInfo.name,
            recipient: to,
            snippet: messageData.snippet || '',
            timestamp: this.formatTimestamp(date),
            isRead,
            isStarred,
            isImportant,
            labels,
            hasAttachments: attachments.length > 0,
            attachments
          })

        } catch (error) {
          console.error('[GMAIL_API] Error processing message:', error)
          // Continue with other messages
        }
      }

      const totalTime = Date.now() - startTime
      console.log(`[GMAIL_API] ✅ Successfully processed ${emails.length} emails in ${totalTime}ms`)
      console.log(`[GMAIL_API] ⚡ Performance: ${Math.round(totalTime / emails.length)}ms per email`)
      
      // Log attachment stats
      const emailsWithAttachments = emails.filter(e => e.hasAttachments)
      if (emailsWithAttachments.length > 0) {
        console.log(`[GMAIL_API] 📎 Found ${emailsWithAttachments.length} emails with attachments`)
      }

      return {
        success: true,
        emails
      }

    } catch (error) {
      console.error('[GMAIL_API] ❌ Gmail API error:', error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch emails'
      }
    }
  }

  async getAttachment(accessToken: string, refreshToken: string | undefined, messageId: string, attachmentId: string): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      this.setCredentials(accessToken, refreshToken)
      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client })

      const attachment = await gmail.users.messages.attachments.get({
        userId: 'me',
        messageId,
        id: attachmentId
      })

      if (!attachment.data?.data) {
        throw new Error('No attachment data received')
      }

      return {
        success: true,
        data: attachment.data.data
      }
    } catch (error) {
      console.error('[GMAIL_API] Error getting attachment:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get attachment'
      }
    }
  }

  async getFullEmail(accessToken: string, refreshToken: string | undefined, messageId: string): Promise<{ success: boolean; email?: any; error?: string }> {
    try {
      this.setCredentials(accessToken, refreshToken)
      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client })

      const response = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      })

      const message = response.data
      if (!message.payload) throw new Error('No email payload received')

      const headers = message.payload.headers || []
      const getHeader = (name: string) =>
        headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || ''

      let body = ''
      type InlineImg = { attachmentId: string; mime: string }
      const inlineImages = new Map<string, InlineImg>() // cid -> {id,mime}

      const extractContent = (part: any) => {
        if (!part) return

        // capture inline images
        if (part.body?.attachmentId && part.headers) {
          const cid = part.headers.find((h: any) => h.name?.toLowerCase() === 'content-id')?.value
          if (cid) {
            inlineImages.set(cid.replace(/[<>]/g, ''), {
              attachmentId: part.body.attachmentId,
              mime: part.mimeType || 'image/png'
            })
          }
        }

        // text/html or text/plain
        if (part.body?.data) {
          const decoded = Buffer.from(part.body.data, 'base64').toString('utf-8')
          if (part.mimeType === 'text/html') body = decoded
          else if (!body && part.mimeType === 'text/plain') body = decoded
        }

        // recurse
        if (part.parts) part.parts.forEach(extractContent)
      }

      extractContent(message.payload)

      // Replace cid: with real data URIs
      console.log(`[GMAIL_API] Found ${inlineImages.size} inline images`)
      if (body && inlineImages.size) {
        for (const [cid, { attachmentId, mime }] of inlineImages) {
          console.log(`[GMAIL_API] Processing inline image: cid=${cid}, attachmentId=${attachmentId}, mime=${mime}`)
          try {
            const att = await gmail.users.messages.attachments.get({
              userId: 'me',
              messageId,
              id: attachmentId
            })
            const raw = att.data.data || ''
            const b64 = raw.replace(/-/g, '+').replace(/_/g, '/')
            const dataUrl = `data:${mime};base64,${b64}`
            console.log(`[GMAIL_API] Created data URL for ${cid}: ${dataUrl.substring(0, 50)}...`)
            
            const beforeReplace = body.includes(`cid:${cid}`)
            body = body.replace(new RegExp(`cid:${cid}`, 'g'), dataUrl)
            const afterReplace = body.includes(`cid:${cid}`)
            console.log(`[GMAIL_API] Replaced cid:${cid} - found before: ${beforeReplace}, found after: ${afterReplace}`)
          } catch (error) {
            console.error(`[GMAIL_API] Failed to fetch inline image ${cid}:`, error)
            // Leave the cid: reference as is if we can't fetch the attachment
          }
        }
      }

      // Log if body contains any remaining cid: or external image references
      const cidMatches = body.match(/cid:[^"'\s>]+/g)
      const protocolMatches = body.match(/src=["']\/\/[^"']+["']/g)
      const httpMatches = body.match(/src=["']https?:\/\/[^"']+["']/g)
      console.log(`[GMAIL_API] After processing - remaining cid: ${cidMatches?.length || 0}, protocol-relative: ${protocolMatches?.length || 0}, external http: ${httpMatches?.length || 0}`)
      
      if (body.includes('<img')) {
        console.log('[GMAIL_API] Body contains img tags')
      } else {
        console.log('[GMAIL_API] Body does not contain img tags')
      }

      // normalize protocol-relative URLs
      body = body.replace(/src=["']\/\/([^"']+)["']/g, 'src="https://$1"')
                 .replace(/href=["']\/\/([^"']+)["']/g, 'href="https://$1"')

      const parseRecipients = (s: string) => (s ? s.split(',').map(r => r.trim()) : [])

      const fullHeaders: Record<string, string> = {}
      headers.forEach(h => { if (h.name && h.value) fullHeaders[h.name] = h.value })

      return {
        success: true,
        email: {
          body,
          fullHeaders,
          date: getHeader('Date'),
          to: parseRecipients(getHeader('To')),
          cc: parseRecipients(getHeader('Cc')),
          bcc: parseRecipients(getHeader('Bcc'))
        }
      }
    } catch (error) {
      console.error('[GMAIL_API] Error getting full email:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get full email' }
    }
  }

  async sendEmail(accessToken: string, refreshToken: string | undefined, options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      this.setCredentials(accessToken, refreshToken)
      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client })

      let emailBody: string

      if (options.attachments && options.attachments.length > 0) {
        // Create multipart email with attachments
        const boundary = 'boundary_' + Math.random().toString(36).substring(2, 15)
        
        const headers = [
          `To: ${options.to.join(', ')}`,
          ...(options.cc && options.cc.length > 0 ? [`Cc: ${options.cc.join(', ')}`] : []),
          ...(options.bcc && options.bcc.length > 0 ? [`Bcc: ${options.bcc.join(', ')}`] : []),
          `Subject: ${options.subject}`,
          `MIME-Version: 1.0`,
          `Content-Type: multipart/mixed; boundary="${boundary}"`,
          ...(options.inReplyTo ? [`In-Reply-To: ${options.inReplyTo}`] : []),
          ...(options.references ? [`References: ${options.references}`] : [])
        ]

        // Build multipart body
        const parts = [
          ...headers,
          '',
          `--${boundary}`,
          'Content-Type: text/html; charset=UTF-8',
          'Content-Transfer-Encoding: 7bit',
          '',
          options.body
        ]

        // Add attachments
        for (const attachment of options.attachments) {
          parts.push(
            `--${boundary}`,
            `Content-Type: ${attachment.mimeType}`,
            `Content-Disposition: attachment; filename="${attachment.filename}"`,
            'Content-Transfer-Encoding: base64',
            '',
            attachment.content
          )
        }

        parts.push(`--${boundary}--`)
        emailBody = parts.join('\r\n')
      } else {
        // Simple email without attachments
        const headers = [
          `To: ${options.to.join(', ')}`,
          ...(options.cc && options.cc.length > 0 ? [`Cc: ${options.cc.join(', ')}`] : []),
          ...(options.bcc && options.bcc.length > 0 ? [`Bcc: ${options.bcc.join(', ')}`] : []),
          `Subject: ${options.subject}`,
          `Content-Type: text/html; charset=UTF-8`,
          `MIME-Version: 1.0`,
          ...(options.inReplyTo ? [`In-Reply-To: ${options.inReplyTo}`] : []),
          ...(options.references ? [`References: ${options.references}`] : [])
        ]

        emailBody = [
          ...headers,
          '', // Empty line separates headers from body
          options.body
        ].join('\r\n')
      }

      // Encode to base64url (Gmail API requirement)
      const encodedMessage = Buffer.from(emailBody)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '') // Remove padding

      // Send the email
      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
          ...(options.replyToMessageId ? { threadId: options.replyToMessageId } : {})
        }
      })

      console.log('[GMAIL_API] ✅ Email sent successfully:', response.data.id)

      return {
        success: true,
        messageId: response.data.id || undefined
      }
    } catch (error) {
      console.error('[GMAIL_API] ❌ Error sending email:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email'
      }
    }
  }

  async deleteDraft(accessToken: string, refreshToken: string | undefined, draftId: string): Promise<{ success: boolean; error?: string }> {
    try {
      this.setCredentials(accessToken, refreshToken)
      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client })

      await gmail.users.drafts.delete({
        userId: 'me',
        id: draftId
      })

      console.log('[GMAIL_API] ✅ Draft deleted successfully:', draftId)

      return {
        success: true
      }
    } catch (error) {
      console.error('[GMAIL_API] ❌ Error deleting draft:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete draft'
      }
    }
  }

  async deleteMessage(accessToken: string, refreshToken: string | undefined, messageId: string): Promise<{ success: boolean; error?: string }> {
    try {
      this.setCredentials(accessToken, refreshToken)
      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client })

      await gmail.users.messages.delete({
        userId: 'me',
        id: messageId
      })

      console.log('[GMAIL_API] ✅ Message deleted successfully:', messageId)

      return {
        success: true
      }
    } catch (error) {
      console.error('[GMAIL_API] ❌ Error deleting message:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete message'
      }
    }
  }

  async saveDraft(accessToken: string, refreshToken: string | undefined, options: SaveDraftOptions): Promise<{ success: boolean; draftId?: string; error?: string }> {
    try {
      this.setCredentials(accessToken, refreshToken)
      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client })

      // Build email headers for draft
      const headers = [
        `To: ${options.to.join(', ')}`,
        ...(options.cc && options.cc.length > 0 ? [`Cc: ${options.cc.join(', ')}`] : []),
        ...(options.bcc && options.bcc.length > 0 ? [`Bcc: ${options.bcc.join(', ')}`] : []),
        `Subject: ${options.subject}`,
        `Content-Type: text/html; charset=UTF-8`,
        `MIME-Version: 1.0`
      ]

      // Build raw email message for draft
      const emailBody = [
        ...headers,
        '', // Empty line separates headers from body
        options.body
      ].join('\r\n')

      // Encode to base64url (Gmail API requirement)
      const encodedMessage = Buffer.from(emailBody)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '') // Remove padding

      // Create the draft
      const response = await gmail.users.drafts.create({
        userId: 'me',
        requestBody: {
          message: {
            raw: encodedMessage
          }
        }
      })

      console.log('[GMAIL_API] ✅ Draft saved successfully:', response.data.id)

      return {
        success: true,
        draftId: response.data.id || undefined
      }
    } catch (error) {
      console.error('[GMAIL_API] ❌ Error saving draft:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save draft'
      }
    }
  }
}

export const gmailAPI = new GmailAPI()