import { Searchbar } from '@/components/shared'
import React from 'react'
import { useMailStore } from '../store/mailStore'
import { GMAIL_FILTERS, FILTER_LABELS, GmailFilterType } from '../types'

const MailHeader: React.FC = () => {
  const { gmailFilter, setGmailFilter } = useMailStore()

  const handleFilterChange = (filterType: GmailFilterType) => {
    setGmailFilter(filterType)
  }

  return (
    <div className="w-full bg-black/40 px-4 h-14 flex items-center gap-x-4">
      <Searchbar placeholder="Search mails" />
      <div className="flex gap-2 overflow-x-auto hide-scrollbar" id="mail-filters">
        {(Object.keys(GMAIL_FILTERS) as GmailFilterType[]).map((filterType) => (
          <button
            key={filterType}
            onClick={() => handleFilterChange(filterType)}
            className={`px-3 py-1 text-xs cursor-pointer rounded-full transition-colors whitespace-nowrap flex-shrink-0 ${
              gmailFilter === filterType
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
