// dependencies
import React, { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DateTime } from 'luxon'

interface CalendarDateSelectorProps {
  onDateChange?: (date: DateTime) => void
}

const CalendarDateSelector: React.FC<CalendarDateSelectorProps> = ({ onDateChange }) => {
  const [currentDate, setCurrentDate] = useState(DateTime.now())

  const handlePreviousMonth = () => {
    const newDate = currentDate.minus({ months: 1 }).startOf('month')
    setCurrentDate(newDate)
    onDateChange?.(newDate)
  }

  const handleNextMonth = () => {
    const newDate = currentDate.plus({ months: 1 }).startOf('month')
    setCurrentDate(newDate)
    onDateChange?.(newDate)
  }

  const formatMonth = (date: DateTime) => {
    return date.toFormat('MMMM yyyy')
  }

  return (
    <div className="flex items-center gap-x-2 px-4">
      <button
        className="text-gray-400 hover:text-white/70 rounded transition-colors"
        title="Previous month"
        onClick={handlePreviousMonth}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <div className="w-44 py-1 flex items-center justify-center text-xl font-bold text-white/90">
        {formatMonth(currentDate)}
      </div>
      <button
        className="p-1 text-gray-400 hover:text-white/70 rounded transition-colors"
        title="Next month"
        onClick={handleNextMonth}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

export default CalendarDateSelector
