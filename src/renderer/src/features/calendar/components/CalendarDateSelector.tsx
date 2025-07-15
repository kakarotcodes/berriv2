// dependencies
import React, { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const CalendarSelector: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date())

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  return (
    <div className="flex items-center gap-x-2">
      <button
        className="text-gray-400 hover:text-white/70 rounded transition-colors"
        title="Previous month"
        onClick={handlePreviousMonth}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <div className="w-36 py-1 flex items-center justify-center text-sm font-medium text-white bg-white/10 rounded border border-white/20">
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

export default CalendarSelector
