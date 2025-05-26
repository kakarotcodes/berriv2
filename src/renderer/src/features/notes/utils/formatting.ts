export function formatDateLabel(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()

  const isToday = date.toDateString() === now.toDateString()

  const yesterday = new Date()
  yesterday.setDate(now.getDate() - 1)
  const isYesterday = date.toDateString() === yesterday.toDateString()

  if (isToday) return 'Today'
  if (isYesterday) return 'Yesterday'

  const sameYear = date.getFullYear() === now.getFullYear()

  return sameYear
    ? date.toLocaleDateString(undefined, {
        day: '2-digit',
        month: 'short'
      })
    : date.toLocaleDateString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
}
