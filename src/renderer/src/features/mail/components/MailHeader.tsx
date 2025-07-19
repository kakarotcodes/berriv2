import { Searchbar } from '@/components/shared'
import React from 'react'

const FILTER_LABELS: Record<FilterType, string> = {
  PRIMARY: 'Primary',
  ALL_INBOX: 'All Inbox',
  UNREAD: 'Unread',
  IMPORTANT: 'Important',
  STARRED: 'Starred',
  PERSONAL: 'Personal'
}

// Gmail filter options
const GMAIL_FILTERS = {
  PRIMARY: 'category:primary',
  ALL_INBOX: 'in:inbox',
  UNREAD: 'in:inbox is:unread',
  IMPORTANT: 'in:inbox is:important',
  STARRED: 'in:inbox is:starred',
  PERSONAL:
    'category:primary -from:noreply -from:no-reply -from:newsletter -from:donotreply -from:notifications -subject:unsubscribe'
} as const

type FilterType = keyof typeof GMAIL_FILTERS

const MailHeader: React.FC = () => {
  const activeFilter = 'PRIMARY' // This should be managed by state in the parent component

  return (
    <div className="w-full bg-black/40 px-4 h-14 flex items-center gap-x-4">
      <Searchbar placeholder="Search mails" />
      <div className="flex gap-2 overflow-x-auto hide-scrollbar" id="mail-filters">
        {(Object.keys(GMAIL_FILTERS) as FilterType[]).map((filterType) => (
          <button
            key={filterType}
            // onClick={() => handleFilterChange(filterType)}
            className={`px-3 py-1 text-xs rounded-full transition-colors whitespace-nowrap flex-shrink-0 ${
              activeFilter === filterType
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {FILTER_LABELS[filterType]}
          </button>
        ))}
      </div>
    </div>
  )
}

export default MailHeader
