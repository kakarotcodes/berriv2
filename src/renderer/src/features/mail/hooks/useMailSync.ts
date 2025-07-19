// dependencies
import { useEffect, useCallback } from 'react'

// hooks
import { useAuth } from '../../../hooks/useAuth'

// store
import { useMailStore } from '../store'

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
    if (!isAuthenticated) {
      console.log('[MAIL] Not authenticated, skipping sync')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      console.log('[MAIL] Syncing emails from Gmail API...')
      
      const result = await window.electronAPI.gmail.getEmails({
        maxResults: 20
      })
      
      if (result.success && result.emails) {
        // Convert Gmail API format to our mail format
        const convertedMails = result.emails.map(email => ({
          id: email.id,
          subject: email.subject,
          sender: email.sender,
          recipient: email.recipient,
          body: email.body,
          timestamp: new Date(email.timestamp),
          isRead: email.isRead,
          isStarred: email.isStarred,
          labels: email.labels,
          hasAttachments: Math.random() > 0.7 // 30% chance of having attachments for testing
        }))
        
        setMails(convertedMails)
        console.log(`[MAIL] Successfully synced ${convertedMails.length} emails`)
      } else {
        setError(result.error || 'Failed to sync emails')
        console.error('[MAIL] Failed to sync emails:', result.error)
      }
      
    } catch (error) {
      console.error('[MAIL] Sync failed:', error)
      setError('Failed to sync emails')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, setLoading, setError, setMails])

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