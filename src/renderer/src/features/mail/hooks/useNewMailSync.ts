// New mail sync hook with attachment support
import { useEffect, useCallback } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { useMailStore } from '../store'
import type { NewMailItem } from '../types/newTypes'

export const useNewMailSync = () => {
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
      console.log('[NEW_MAIL] Not authenticated, skipping sync')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      console.log('[NEW_MAIL] Syncing emails with new API...')
      
      // Use the new IPC handler
      const result = await (window as any).electronAPI.gmail.getEmailsNew({
        maxResults: 20
      })
      
      if (result.success && result.emails) {
        // Convert API format to our mail format
        const convertedMails: NewMailItem[] = result.emails.map((email: any) => ({
          id: email.id,
          subject: email.subject,
          sender: email.sender,
          recipient: email.recipient,
          body: email.body,
          timestamp: new Date(email.timestamp),
          isRead: email.isRead,
          isStarred: email.isStarred,
          labels: email.labels,
          attachments: email.attachments || []
        }))
        
        console.log(`[NEW_MAIL] ✅ Successfully synced ${convertedMails.length} emails`)
        console.log(`[NEW_MAIL] Emails with attachments: ${convertedMails.filter(e => e.attachments.length > 0).length}`)
        
        // Log emails with attachments for debugging
        convertedMails.forEach(email => {
          if (email.attachments.length > 0) {
            console.log(`[NEW_MAIL] 📎 "${email.subject}" has attachments:`, email.attachments.map(a => a.filename))
          }
        })
        
        setMails(convertedMails)
      } else {
        setError(result.error || 'Failed to sync emails')
        console.error('[NEW_MAIL] Failed to sync emails:', result.error)
      }
      
    } catch (error) {
      console.error('[NEW_MAIL] Sync failed:', error)
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