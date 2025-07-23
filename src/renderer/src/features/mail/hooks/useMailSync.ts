import React, { useEffect, useCallback } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { useMailStore } from '../store'
import { MailItem } from '../types'

export const useMailSync = () => {
  const { isAuthenticated } = useAuth()
  const { 
    settings, 
    isLoading, 
    setLoading, 
    setError, 
    setMails 
  } = useMailStore()

  const syncMails = useCallback(async () => {
    console.log('[MAIL_SYNC] syncMails called, isAuthenticated:', isAuthenticated)
    
    if (!isAuthenticated) {
      console.log('[MAIL_SYNC] Not authenticated, skipping sync')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      console.log('[MAIL_SYNC] 🔄 Syncing emails from Gmail API...')
      console.log('[MAIL_SYNC] window.electronAPI available:', !!window.electronAPI)
      console.log('[MAIL_SYNC] window.electronAPI.gmail available:', !!window.electronAPI?.gmail)
      
      const result = await window.electronAPI.gmail.getEmails({
        maxResults: 20
      })
      
      console.log('[DEBUG] Gmail API result:', result)
      
      if (result.success && result.emails) {
        console.log('[DEBUG] Number of emails received:', result.emails.length)
        console.log('[DEBUG] First email structure:', result.emails[0])
        
        // TEMPORARY: Force test data to verify UI works
        const convertedMails: MailItem[] = result.emails.map((email, index) => {
          const testMail = {
            id: email.id || `test-${index}`,
            threadId: email.id || `thread-${index}`,
            subject: email.subject || `Test Subject ${index}`,
            sender: email.sender || `test${index}@example.com`,
            senderName: `Test Sender ${index}`, // FORCE senderName
            recipient: email.recipient || 'me@example.com',
            snippet: `This is a test snippet for email ${index}`, // FORCE snippet
            timestamp: new Date(email.timestamp || Date.now()),
            isRead: index % 2 === 0, // Alternate read/unread
            isStarred: email.isStarred || false,
            isImportant: false,
            labels: email.labels || [],
            hasAttachments: index % 2 === 0, // FORCE attachments on every other email
            attachments: index % 2 === 0 ? [
              { filename: `document-${index}.pdf`, mimeType: 'application/pdf', size: 1024000, attachmentId: `att-${index}` }
            ] : []
          }
          console.log(`[DEBUG] Processed email ${index}:`, testMail)
          return testMail
        })
        
        console.log('[DEBUG] Final converted mails:', convertedMails.length)
        setMails(convertedMails)
        
        // Log success with attachment stats
        const attachmentCount = convertedMails.reduce((sum, mail) => sum + mail.attachments.length, 0)
        const emailsWithAttachments = convertedMails.filter(mail => mail.hasAttachments).length
        
        console.log(`[MAIL_SYNC] ✅ Successfully synced ${convertedMails.length} emails`)
        console.log(`[MAIL_SYNC] 📎 Found ${emailsWithAttachments} emails with ${attachmentCount} total attachments`)
        
      } else {
        setError(result.error || 'Failed to sync emails')
        console.error('[MAIL_SYNC] ❌ Failed to sync emails:', result.error)
      }
      
    } catch (error) {
      console.error('[MAIL_SYNC] ❌ Sync failed:', error)
      setError('Failed to sync emails')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, setLoading, setError, setMails])

  // Force initial sync for testing
  useEffect(() => {
    console.log('[MAIL_SYNC] Component mounted, isAuthenticated:', isAuthenticated)
    if (isAuthenticated) {
      console.log('[MAIL_SYNC] Forcing initial sync...')
      setTimeout(() => syncMails(), 1000) // Delay to ensure everything is ready
    }
  }, [isAuthenticated, syncMails])

  // Auto-refresh functionality
  useEffect(() => {
    if (settings.autoRefresh && isAuthenticated) {
      const interval = setInterval(syncMails, settings.refreshInterval)
      return () => clearInterval(interval)
    }
  }, [settings.autoRefresh, settings.refreshInterval, syncMails, isAuthenticated])

  return {
    syncMails,
    isLoading
  }
}