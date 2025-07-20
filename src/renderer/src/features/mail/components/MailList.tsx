// dependencies
import React, { useEffect, useCallback } from 'react'
import { EnvelopeIcon } from '@heroicons/react/24/outline'

// hooks
import { useAuth } from '../../../hooks/useAuth'

// store
import { useMailStore } from '../store'

// types
import { GMAIL_FILTERS, FILTER_LABELS, GmailFilterType } from '../types'

// components
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
    clearCache
  } = useMailStore()

  // Debounced fetch function
  const debouncedFetch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout
      return (filter: GmailFilterType, search: string) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          fetchEmails(filter, search)
        }, 300) // 300ms debounce
      }
    })(),
    []
  )

  // Fetch emails when authenticated or filter changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchEmails(gmailFilter, searchQuery)
    }
  }, [isAuthenticated, gmailFilter])

  // Debounced search when search query changes
  useEffect(() => {
    if (isAuthenticated && searchQuery !== '') {
      debouncedFetch(gmailFilter, searchQuery)
    } else if (isAuthenticated && searchQuery === '') {
      fetchEmails(gmailFilter, searchQuery)
    }
  }, [searchQuery, isAuthenticated, gmailFilter, debouncedFetch])

  // Clear cache when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('[MAIL] User logged out, clearing email cache')
      clearCache()
      setMails([])
    }
  }, [isAuthenticated, clearCache, setMails])

  const fetchEmails = async (
    filterType: GmailFilterType = gmailFilter,
    search: string = searchQuery,
    forceRefresh = false
  ) => {
    // Check authentication first
    if (!isAuthenticated) {
      console.log('[MAIL] User not authenticated, skipping email fetch')
      return
    }

    // Check cache first if no search query and not forcing refresh
    if (!search.trim() && !forceRefresh) {
      const cachedEmails = getCachedEmails(filterType)
      if (cachedEmails) {
        console.log(`[MAIL] Using cached emails for filter: ${filterType}`)
        setMails(cachedEmails)
        return
      }
    }

    setLoading(true)
    setError(null)

    try {
      // Combine filter query with search query
      let combinedQuery = GMAIL_FILTERS[filterType]
      if (search.trim()) {
        combinedQuery = `${combinedQuery} ${search.trim()}`
      }

      console.log('[MAIL] Fetching emails with query:', combinedQuery)
      const result = await window.electronAPI.gmail.getEmails({
        maxResults: 20,
        query: combinedQuery
      })

      if (result.success && result.emails) {
        // Convert Gmail API format to our mail format
        const convertedMails = result.emails.map((email) => ({
          id: email.id,
          subject: email.subject,
          sender: email.sender,
          recipient: email.recipient,
          body: email.body,
          timestamp: new Date(email.timestamp),
          isRead: email.isRead,
          isStarred: email.isStarred,
          labels: email.labels
        }))

        setMails(convertedMails)

        // Cache emails only if no search query (cache base filter results)
        if (!search.trim()) {
          updateCache(filterType, convertedMails)
          console.log(`[MAIL] Cached ${convertedMails.length} emails for filter: ${filterType}`)
        }

        console.log(
          `[MAIL] Successfully fetched ${convertedMails.length} emails with query: ${combinedQuery}`
        )
      } else {
        setError(result.error || 'Failed to load emails')
        console.error('[MAIL] Failed to fetch emails:', result.error)
      }
    } catch (err) {
      console.error('[MAIL] Error fetching emails:', err)
      setError('Failed to load emails')
    } finally {
      setLoading(false)
    }
  }

  const refreshEmails = () => {
    fetchEmails(gmailFilter, searchQuery, true) // Force refresh
  }

  const filteredMails = getFilteredMails()
  const unreadCount = getUnreadCount()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-3 text-white">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
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
    <div className="flex flex-col h-full p-4 overflow-hidden">
      {/* Mail list */}
      <div className="flex flex-col h-full overflow-y-auto space-y-2 hide-scrollbar">
        {filteredMails.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-400 text-center">
              <EnvelopeIcon className="size-8 mx-auto mb-2 opacity-50" />
              <p>No emails found</p>
              <p className="text-xs mt-1">Filter: {FILTER_LABELS[gmailFilter]}</p>
            </div>
          </div>
        ) : (
          filteredMails.map((mail) => <MailItem key={mail.id} mail={mail} />)
        )}
      </div>
    </div>
  )
}

export default MailList
