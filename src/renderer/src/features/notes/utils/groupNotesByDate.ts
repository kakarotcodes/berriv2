import { Note } from '../types/noteTypes'

interface GroupedNotes {
  label: string
  notes: Note[]
}

export function groupNotesByDate(notes: Note[]): GroupedNotes[] {
  const now = new Date()
  const result: Record<string, Note[]> = {}

  const getWeekStart = (d: Date) => {
    const date = new Date(d)
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Monday as first day
    return new Date(date.setDate(diff))
  }

  const thisWeekStart = getWeekStart(now)
  const lastWeekStart = new Date(thisWeekStart)
  lastWeekStart.setDate(thisWeekStart.getDate() - 7)

  const thisMonth = now.getMonth()
  const thisYear = now.getFullYear()
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear

  for (const note of notes) {
    const updated = new Date(note.updatedAt)

    let label = ''

    if (updated >= thisWeekStart) {
      label = 'This Week'
    } else if (updated >= lastWeekStart) {
      label = 'Last Week'
    } else if (updated.getMonth() === lastMonth && updated.getFullYear() === lastMonthYear) {
      label = 'Last Month'
    } else {
      const month = updated.toLocaleString('default', { month: 'long' })
      label = `${month} ${updated.getFullYear()}`
    }

    if (!result[label]) result[label] = []
    result[label].push(note)
  }

  // Convert to array with label
  return Object.entries(result).map(([label, notes]) => ({
    label,
    notes: notes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }))
}
