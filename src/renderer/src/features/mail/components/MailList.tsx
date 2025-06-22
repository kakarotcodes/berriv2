// dependencies
import React, { useEffect, useState } from 'react'
import { EnvelopeIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

// hooks
import { useAuth } from '../../../hooks/useAuth'

// store
import { useMailStore } from '../store'

// components
import MailItem from './MailItem'

// Gmail filter options
const GMAIL_FILTERS = {
  PRIMARY: 'category:primary',
  ALL_INBOX: 'in:inbox',
  UNREAD: 'in:inbox is:unread',
  IMPORTANT: 'in:inbox is:important',
  STARRED: 'in:inbox is:starred',
  PERSONAL: 'category:primary -from:noreply -from:no-reply -from:newsletter -from:donotreply -from:notifications -subject:unsubscribe',
} as const

type FilterType = keyof typeof GMAIL_FILTERS

const FILTER_LABELS: Record<FilterType, string> = {
  PRIMARY: 'Primary',
  ALL_INBOX: 'All Inbox',
  UNREAD: 'Unread',
  IMPORTANT: 'Important',
  STARRED: 'Starred',
  PERSONAL: 'Personal'
}

const MailList: React.FC = () => {
  const { isAuthenticated } = useAuth()
  const { 
    mails, 
    isLoading, 
    error, 
    getFilteredMails, 
    getUnreadCount,
    setMails,
    setLoading,
    setError
  } = useMailStore()

  const [activeFilter, setActiveFilter] = useState<FilterType>('PRIMARY')

  // Fetch emails when authenticated or filter changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchEmails(activeFilter)
    }
  }, [isAuthenticated, activeFilter])

  const fetchEmails = async (filterType: FilterType = activeFilter) => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('[MAIL] Fetching emails with filter:', filterType)
      const result = await window.electronAPI.gmail.getEmails({
        maxResults: 20,
        query: GMAIL_FILTERS[filterType]
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
          labels: email.labels
        }))
        
        setMails(convertedMails)
        console.log(`[MAIL] Successfully fetched ${convertedMails.length} emails with filter: ${filterType}`)
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

  const handleFilterChange = (filterType: FilterType) => {
    setActiveFilter(filterType)
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
    <div className="flex flex-col h-full">
      {/* Header with search and refresh */}
      <div className="mb-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <EnvelopeIcon className="size-5 text-gray-300" />
            <span className="text-sm text-gray-300">
              {filteredMails.length} emails
              {unreadCount > 0 && (
                <span className="ml-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs">
                  {unreadCount} unread
                </span>
              )}
            </span>
          </div>
          <button
            onClick={() => fetchEmails()}
            disabled={isLoading}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs rounded transition-colors disabled:cursor-not-allowed"
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2">
          {(Object.keys(GMAIL_FILTERS) as FilterType[]).map((filterType) => (
            <button
              key={filterType}
              onClick={() => handleFilterChange(filterType)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                activeFilter === filterType
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {FILTER_LABELS[filterType]}
            </button>
          ))}
        </div>
        
        {/* Search bar placeholder */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-3 size-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search emails..."
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Mail list */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {filteredMails.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-400 text-center">
              <EnvelopeIcon className="size-8 mx-auto mb-2 opacity-50" />
              <p>No emails found</p>
              <p className="text-xs mt-1">Filter: {FILTER_LABELS[activeFilter]}</p>
            </div>
          </div>
        ) : (
          filteredMails.map((mail) => (
            <MailItem key={mail.id} mail={mail} />
          ))
        )}
      </div>
    </div>
  )
}

export default MailList 