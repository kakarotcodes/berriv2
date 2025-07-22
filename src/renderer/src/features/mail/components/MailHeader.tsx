import { Searchbar } from '@/components/shared'
import React from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useMailStore } from '../store/mailStore'
import { GMAIL_FILTERS, FILTER_LABELS, GmailFilterType } from '../types'

const MailHeader: React.FC = () => {
  const {
    gmailFilter,
    setGmailFilter,
    searchQuery,
    setSearchQuery,
    selectedEmailIds,
    selectAllEmails,
    clearSelection,
    mails
  } = useMailStore()

  const hasSelection = selectedEmailIds.length > 0
  const isAllSelected = selectedEmailIds.length === mails.length && mails.length > 0

  const handleFilterChange = (filterType: GmailFilterType) => {
    setGmailFilter(filterType)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleSelectAll = () => {
    if (isAllSelected) {
      clearSelection()
    } else {
      selectAllEmails()
    }
  }

  return (
    <div className="w-full bg-black/40 px-4 h-14 flex items-center gap-x-4">
      {/* Selection Controls */}
      {hasSelection ? (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={handleSelectAll}
              className="w-3 h-3 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-0 focus:outline-none"
            />
            <span className="text-sm text-gray-300">{selectedEmailIds.length} selected</span>
          </div>
          <button
            onClick={clearSelection}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            title="Clear selection"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          {/* Select All Button */}
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-2 px-2 py-1 text-gray-400 hover:text-white transition-colors"
            title="Select all"
          >
            <input
              type="checkbox"
              checked={false}
              readOnly
              className="w-3 h-3 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-0 focus:outline-none"
            />
          </button>

          {/* Search */}
          <Searchbar placeholder="Search mails" value={searchQuery} onChange={handleSearchChange} />
        </>
      )}

      {/* Filters - only show when no selection */}
      {!hasSelection && (
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
      )}
    </div>
  )
}

export default MailHeader
