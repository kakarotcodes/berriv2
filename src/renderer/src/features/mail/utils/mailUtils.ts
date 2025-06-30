// Mail utility functions

import { MailItem } from '../types'

export const formatEmailAddress = (email: string): string => {
  // Extract display name from email if present
  const match = email.match(/^(.+)<(.+)>$/)
  if (match) {
    return match[1].trim()
  }
  return email
}

export const getEmailDomain = (email: string): string => {
  const match = email.match(/@(.+)$/)
  return match ? match[1] : ''
}

export const sortMailsByDate = (mails: MailItem[], ascending = false): MailItem[] => {
  return [...mails].sort((a, b) => {
    const aTime = a.timestamp.getTime()
    const bTime = b.timestamp.getTime()
    return ascending ? aTime - bTime : bTime - aTime
  })
}

export const filterMailsByLabel = (mails: MailItem[], label: string): MailItem[] => {
  return mails.filter(mail => mail.labels.includes(label))
}

export const searchMails = (mails: MailItem[], query: string): MailItem[] => {
  const lowerQuery = query.toLowerCase()
  return mails.filter(mail => 
    mail.subject.toLowerCase().includes(lowerQuery) ||
    mail.sender.toLowerCase().includes(lowerQuery) ||
    mail.body.toLowerCase().includes(lowerQuery)
  )
} 