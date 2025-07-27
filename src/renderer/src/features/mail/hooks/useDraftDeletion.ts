import { useState } from 'react'
import { toast } from 'react-toastify'
import { useMailStore } from '../store'
import { MailItem as MailItemType } from '../types'

export const useDraftDeletion = (mail: MailItemType) => {
  const [isDeletingDraft, setIsDeletingDraft] = useState(false)
  const { setMails, updateCache } = useMailStore()

  const deleteDraft = async () => {
    setIsDeletingDraft(true)
    try {
      // Check if it's a local draft or Gmail draft
      if (mail.labels.includes('LOCAL_DRAFT')) {
        // Delete local draft from store
        const { deleteDraft } = useMailStore.getState()
        deleteDraft(mail.id)
      } else {
        // Delete Gmail draft - try both draft deletion and message deletion
        let deleteSuccess = false
        let lastError = ''

        // First try to delete as a draft
        try {
          const draftDeleteResult = await window.electronAPI.gmail.deleteDraft(mail.id)
          if (draftDeleteResult.success) {
            deleteSuccess = true
          } else {
            lastError = draftDeleteResult.error || 'Draft deletion failed'
          }
        } catch (error) {
          console.log('Draft deletion failed, will try message deletion:', error)
          lastError = error instanceof Error ? error.message : 'Draft deletion failed'
        }

        // If draft deletion failed, try deleting as a message
        if (!deleteSuccess) {
          try {
            console.log('Attempting message deletion for:', mail.id)
            const messageDeleteResult = await window.electronAPI.gmail.deleteMessage(mail.id)
            if (messageDeleteResult.success) {
              deleteSuccess = true
            } else {
              lastError = messageDeleteResult.error || 'Message deletion failed'
            }
          } catch (error) {
            console.error('Message deletion also failed:', error)
            lastError = error instanceof Error ? error.message : 'Message deletion failed'
          }
        }

        if (!deleteSuccess) {
          throw new Error(`Failed to delete Gmail item: ${lastError}`)
        }
      }

      // Refresh the drafts list by fetching updated data
      const result = await window.electronAPI.gmail.getEmails({
        maxResults: 20,
        query: 'in:drafts'
      })

      if (result.success && result.emails) {
        // Get local drafts
        const { getDrafts } = useMailStore.getState()
        const localDrafts = getDrafts()

        // Convert Gmail drafts
        const gmailDrafts = result.emails.map((email, index) => ({
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

        // Convert local drafts to mail items
        const localDraftMails = localDrafts.map((draft) => ({
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
        const allDrafts = [...gmailDrafts, ...localDraftMails].sort(
          (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
        )

        setMails(allDrafts)
        updateCache('DRAFTS', allDrafts)
      }

      toast.success('Draft deleted')
    } catch (error) {
      console.error('Failed to delete draft:', error)
      toast.error('Failed to delete draft')
    } finally {
      setIsDeletingDraft(false)
    }
  }

  return {
    isDeletingDraft,
    deleteDraft
  }
}