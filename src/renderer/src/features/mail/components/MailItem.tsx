// MailItem.tsx — Main mail item component using smaller sub-components

import React, { useState, useEffect, useRef } from 'react'
import { MailItem as MailItemType } from '../types'
import { useMailStore } from '../store'
import { useModalStore } from '../../../globalStore/useModalStore'
import ComposeModal from './ComposeModal'
import MailItemHeader from './MailItemHeader'
import MailItemExpandedContent from './MailItemExpandedContent'
import MailItemActions from './MailItemActions'
import DeleteConfirmModal from './DeleteConfirmModal'
import { useDraftDeletion } from '../hooks/useDraftDeletion'
import { toast } from 'react-toastify'

interface MailItemProps {
  mail: MailItemType
}

interface ExpandedMailData {
  body: string
  fullHeaders: Record<string, string>
  date: string
  to: string[]
  cc: string[]
  bcc: string[]
}

const MailItem: React.FC<MailItemProps> = ({ mail }) => {
  const { updateMail, selectedEmailIds, toggleEmailSelection, gmailFilter } = useMailStore()
  const { openModal } = useModalStore()
  const { isDeletingDraft, deleteDraft } = useDraftDeletion(mail)

  const isSelected = selectedEmailIds.includes(mail.id)
  const isDraft =
    gmailFilter === 'DRAFTS' || mail.labels.includes('LOCAL_DRAFT') || mail.labels.includes('DRAFT')

  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedData, setExpandedData] = useState<ExpandedMailData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const handleToggleStar = () => updateMail(mail.id, { isStarred: !mail.isStarred })
  const handleCheckboxChange = () => toggleEmailSelection(mail.id)

  const handleDeleteDraft = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowDeleteConfirm(true)
  }

  const confirmDeleteDraft = async (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setShowDeleteConfirm(false)
    await deleteDraft()
  }

  const cancelDeleteDraft = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setShowDeleteConfirm(false)
  }

  useEffect(() => {
    const handleLinkClick = (e: Event) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'A') {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        const href = (target as HTMLAnchorElement).href
        if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
          window.electronAPI.openExternal(href)
        }
      }
    }

    if (ref.current && isExpanded) {
      ref.current.addEventListener('click', handleLinkClick, true)
    }

    return () => {
      if (ref.current) {
        ref.current.removeEventListener('click', handleLinkClick, true)
      }
    }
  }, [isExpanded])

  const handleMailClick = async () => {
    // Check if this is a draft and we're in the drafts filter
    const isDraft =
      gmailFilter === 'DRAFTS' ||
      mail.labels.includes('LOCAL_DRAFT') ||
      mail.labels.includes('DRAFT')

    if (isDraft) {
      // Open draft in compose modal
      if (mail.labels.includes('LOCAL_DRAFT')) {
        // This is a local draft, get the draft data from the store
        // For now, open with basic info from the mail item
        openModal(
          <ComposeModal
            draft={{
              to: mail.recipient ? mail.recipient.split(', ') : [],
              subject: mail.subject,
              body: mail.snippet // This is not ideal, but we'll improve it later
            }}
          />,
          {
            shouldCloseOnOverlayClick: false,
            shouldCloseOnEsc: false
          }
        )
      } else {
        // This is a Gmail draft, fetch full content and open in compose modal
        try {
          const res = await window.electronAPI.gmail.getFullEmail(mail.id)
          if (res.success && res.email) {
            openModal(
              <ComposeModal
                draft={{
                  to: res.email.to || [],
                  cc: res.email.cc || [],
                  bcc: res.email.bcc || [],
                  subject: mail.subject,
                  body: res.email.body || ''
                }}
              />,
              {
                shouldCloseOnOverlayClick: false,
                shouldCloseOnEsc: false
              }
            )
          } else {
            toast.error('Failed to load draft content')
          }
        } catch (e) {
          console.error(e)
          toast.error('Error loading draft')
        }
      }
      return
    }

    // Regular email handling
    if (isExpanded) return setIsExpanded(false)

    // Expand immediately
    setIsExpanded(true)

    // Mark as read when expanded
    if (!mail.isRead) {
      updateMail(mail.id, { isRead: true })
    }

    setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)

    if (!expandedData) {
      setIsLoading(true)
      try {
        const res = await window.electronAPI.gmail.getFullEmail(mail.id)
        if (res.success && res.email) {
          setExpandedData(res.email)
        } else toast.error('Failed to load email content')
      } catch (e) {
        console.error(e)
        toast.error('Error loading email')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleAttachmentClick = async (att: any) => {
    try {
      const res = await window.electronAPI.gmail.downloadAttachment(
        mail.id,
        att.attachmentId,
        att.filename
      )
      if (res.success) {
        const fileName = res.filePath?.split('/').pop() || att.filename
        toast.success(
          <div>
            <div>Downloaded: {fileName}</div>
            <button
              onClick={() =>
                res.filePath &&
                window.electronAPI.openExternal(
                  `file://${res.filePath.split('/').slice(0, -1).join('/')}`
                )
              }
              className="text-blue-300 underline text-xs mt-1"
            >
              Open Downloads folder
            </button>
          </div>
        )
      } else toast.error(`Failed to download attachment: ${res.error}`)
    } catch (e) {
      toast.error('Error downloading attachment')
      console.error(e)
    }
  }

  const formatTime = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const m = Math.floor(diff / 60000)
    const h = Math.floor(diff / 3600000)
    const d = Math.floor(diff / 86400000)
    if (m < 60) return `${m}m`
    if (h < 24) return `${h}h`
    return `${d}d`
  }

  return (
    <>
      <div
        ref={ref}
        className={`
          px-3 py-5 transition-colors cursor-pointer ${isExpanded ? '' : 'hover:bg-[#393939]'}
          ${isSelected ? 'bg-blue-900 hover:bg-blue-900' : mail.isRead ? 'bg-black/50 ' : 'bg-transparent'}
          ${isExpanded ? 'bg-[#2a2a2a]' : ''}
          ${!isExpanded ? 'border-b border-gray-700' : ''}
        `}
        onClick={handleMailClick}
      >
        {/* Collapsed Mail Item Header */}
        {!isExpanded && (
          <MailItemHeader
            mail={mail}
            isSelected={isSelected}
            isDraft={isDraft}
            isExpanded={isExpanded}
            isDeletingDraft={isDeletingDraft}
            onCheckboxChange={handleCheckboxChange}
            onToggleStar={handleToggleStar}
            onDeleteDraft={handleDeleteDraft}
            onAttachmentClick={handleAttachmentClick}
            formatTime={formatTime}
          />
        )}

        {/* Expanded area */}
        <div
          className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}
        >
          {expandedData && (
            <MailItemExpandedContent
              mail={mail}
              expandedData={expandedData}
              isDraft={isDraft}
              isLoading={isLoading}
              onToggleStar={handleToggleStar}
              onCollapse={() => setIsExpanded(false)}
            />
          )}

          {/* Reply and Forward Buttons */}
          {isExpanded && <MailItemActions mail={mail} expandedData={expandedData} />}
        </div>
      </div>

      {/* Delete Confirmation Modal - Outside the clickable area */}
      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onConfirm={confirmDeleteDraft}
        onCancel={cancelDeleteDraft}
      />
    </>
  )
}

export default MailItem
