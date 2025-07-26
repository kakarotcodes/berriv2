import React, { useEffect, useCallback } from 'react'
import { EnvelopeIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../../hooks/useAuth'
import { useMailStore } from '../store'
import { Draft } from '../types'
import { GMAIL_FILTERS, FILTER_LABELS, GmailFilterType } from '../types'
import MailItem from './MailItem'

const MailList: React.FC = () => {
  const { isAuthenticated } = useAuth()
  const {
    isLoading,
    error,
    getFilteredMails,
    getUnreadCount,
    setMails,
    setLoading,
    setError,
    gmailFilter,
    searchQuery,
    getCachedEmails,
    updateCache,
    clearCache,
    getDrafts,
    loadDraftsFromStorage
  } = useMailStore()

  const debouncedFetch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout
      return (filter: GmailFilterType, search: string) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          fetchEmails(filter, search)
        }, 300)
      }
    })(),
    []
  )

  useEffect(() => {
    if (isAuthenticated) {
      loadDraftsFromStorage() // Load drafts on mount
      fetchEmails(gmailFilter, searchQuery)
    }
  }, [isAuthenticated, gmailFilter, loadDraftsFromStorage])

  useEffect(() => {
    if (!isAuthenticated) return
    if (searchQuery.trim()) debouncedFetch(gmailFilter, searchQuery)
    else fetchEmails(gmailFilter, searchQuery)
  }, [searchQuery, isAuthenticated, gmailFilter, debouncedFetch])

  useEffect(() => {
    if (!isAuthenticated) {
      clearCache()
      setMails([])
    }
  }, [isAuthenticated, clearCache, setMails])

  const fetchEmails = async (
    filterType: GmailFilterType = gmailFilter,
    search: string = searchQuery,
    forceRefresh = false
  ) => {
    if (!isAuthenticated) return

    // Handle DRAFTS filter - fetch Gmail drafts AND combine with local drafts
    if (filterType === 'DRAFTS') {
      setLoading(true)
      setError(null)
      
      try {
        // Fetch Gmail drafts
        let combinedQuery = GMAIL_FILTERS[filterType]
        if (search.trim()) combinedQuery = `${combinedQuery} ${search.trim()}`

        const result = await window.electronAPI.gmail.getEmails({
          maxResults: 20,
          query: combinedQuery
        })

        let gmailDrafts = []
        if (result.success && result.emails) {
          gmailDrafts = result.emails.map((email, index) => ({
            id: email.id,
            threadId: email.threadId || email.id,
            subject: email.subject,
            sender: email.sender,
            senderName: email.senderName || email.sender.split('@')[0] || `Sender ${index}`,
            recipient: email.recipient,
            snippet: email.snippet || 'No preview available',
            timestamp: new Date(email.timestamp),
            isRead: email.isRead,
            isStarred: email.isStarred,
            isImportant: email.isImportant || false,
            labels: email.labels,
            hasAttachments: email.hasAttachments,
            attachments: email.attachments || []
          }))
        }

        // Get local drafts
        const localDrafts = getDrafts()
        
        // Convert local drafts to mail items
        const localDraftMails = localDrafts
          .filter((draft) => {
            if (!search.trim()) return true
            return (
              draft.subject.toLowerCase().includes(search.toLowerCase()) ||
              draft.to.some(email => email.toLowerCase().includes(search.toLowerCase())) ||
              draft.body.toLowerCase().includes(search.toLowerCase())
            )
          })
          .map((draft) => ({
            id: draft.id,
            threadId: draft.id,
            subject: draft.subject,
            sender: 'draft@local',
            senderName: 'Local Draft',
            recipient: draft.to.join(', '),
            snippet: draft.body.replace(/<[^>]*>/g, '').substring(0, 100) + '...',
            timestamp: new Date(draft.timestamp),
            isRead: true,
            isStarred: false,
            isImportant: false,
            labels: ['LOCAL_DRAFT'],
            hasAttachments: false,
            attachments: []
          }))

        // Combine and sort by timestamp (newest first)
        const allDrafts = [...gmailDrafts, ...localDraftMails].sort((a, b) => 
          b.timestamp.getTime() - a.timestamp.getTime()
        )
        
        setMails(allDrafts)
        if (!search.trim()) updateCache(filterType, allDrafts)
      } catch (err) {
        console.error('[MAIL] draft fetch error', err)
        setError('Failed to load drafts')
      } finally {
        setLoading(false)
      }
      return
    }

    if (!search.trim() && !forceRefresh) {
      const cached = getCachedEmails(filterType)
      if (cached) {
        setMails(cached)
        return
      }
    }

    setLoading(true)
    setError(null)

    try {
      let combinedQuery = GMAIL_FILTERS[filterType]
      if (search.trim()) combinedQuery = `${combinedQuery} ${search.trim()}`

      const result = await window.electronAPI.gmail.getEmails({
        maxResults: 20,
        query: combinedQuery
      })

      if (result.success && result.emails) {
        console.log('[MAIL_LIST] Received emails:', result.emails.length)
        console.log('[MAIL_LIST] First email:', result.emails[0])
        
        const converted = result.emails.map((email, index) => ({
          id: email.id,
          threadId: email.threadId || email.id,
          subject: email.subject,
          sender: email.sender,
          senderName: email.senderName || email.sender.split('@')[0] || `Sender ${index}`,
          recipient: email.recipient,
          snippet: email.snippet || 'No preview available',
          timestamp: new Date(email.timestamp),
          isRead: email.isRead,
          isStarred: email.isStarred,
          isImportant: email.isImportant || false,
          labels: email.labels,
          hasAttachments: email.hasAttachments || (index % 2 === 0), // TEST: Force attachments
          attachments: email.attachments || (index % 2 === 0 ? [
            { filename: `test-file-${index}.pdf`, mimeType: 'application/pdf', size: 1024, attachmentId: `att-${index}` }
          ] : [])
        }))
        
        console.log('[MAIL_LIST] Converted emails:', converted.length)
        console.log('[MAIL_LIST] First converted:', converted[0])

        setMails(converted)
        if (!search.trim()) updateCache(filterType, converted)
      } else {
        setError(result.error || 'Failed to load emails')
      }
    } catch (err) {
      console.error('[MAIL] fetch error', err)
      setError('Failed to load emails')
    } finally {
      setLoading(false)
    }
  }

  const refreshEmails = () => fetchEmails(gmailFilter, searchQuery, true)

  const filteredMails = getFilteredMails()
  const unreadCount = getUnreadCount()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-3 text-white">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
          <span className="text-sm">Loading emails...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-red-300 text-center">
          <p className="font-medium">Error loading emails</p>
          <p className="text-sm">{error}</p>
        </div>
        <button
          onClick={() => fetchEmails()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* min-h-0 so children can shrink */}
      <div
        className="
        flex-1 flex flex-col overflow-y-auto hide-scrollbar min-h-0
        divide-y divide-white/10
      "
      >
        {filteredMails.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-center">
            <EnvelopeIcon className="size-8 mx-auto mb-2 opacity-50" />
            <p>No emails found</p>
            <p className="text-xs mt-1">Filter: {FILTER_LABELS[gmailFilter]}</p>
          </div>
        ) : (
          filteredMails.map((mail) => <MailItem key={mail.id} mail={mail} />)
        )}
      </div>
    </div>
  )
}

export default MailList
