import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useModal } from '@/hooks/useModal'
import CalendarEventForm from './CalendarEventForm'

interface ModalEventFormProps {
  selectedDate?: Date
  onCreateEvent: (eventData: {
    title: string
    start: string
    end: string
    description: string
    location: string
    attendees: string[]
  }) => Promise<{ success: boolean; error?: string }>
}

const ModalEventForm: React.FC<ModalEventFormProps> = ({
  selectedDate,
  onCreateEvent
}) => {
  const { closeModal } = useModal()
  const [eventType, setEventType] = useState<'event' | 'meeting'>('event')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Format selected date for form (avoiding timezone issues)
  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const [eventForm, setEventForm] = useState({
    title: '',
    date: selectedDate ? formatDateForInput(selectedDate) : formatDateForInput(new Date()),
    startTime: '09:00',
    endTime: '10:00',
    description: '',
    location: '',
    attendees: ''
  })

  // Update form date when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      setEventForm(prev => ({
        ...prev,
        date: formatDateForInput(selectedDate)
      }))
    }
  }, [selectedDate])

  const handleCreateEvent = async () => {
    if (!eventForm.title.trim()) return

    setIsCreating(true)
    setError(null)

    try {
      // Combine date and time for start/end
      const startDateTime = `${eventForm.date}T${eventForm.startTime}:00`
      const endDateTime = `${eventForm.date}T${eventForm.endTime}:00`

      // Prepare event data
      const eventData = {
        title: eventForm.title,
        start: startDateTime,
        end: endDateTime,
        description:
          eventType === 'meeting'
            ? `${eventForm.description ? eventForm.description + '\n\n' : ''}Meeting scheduled via Berri`
            : eventForm.description,
        location: eventForm.location,
        attendees: eventForm.attendees
          ? eventForm.attendees
              .split(',')
              .map((email) => email.trim())
              .filter((email) => email)
          : []
      }

      const result = await onCreateEvent(eventData)

      if (result.success) {
        closeModal()
      } else {
        setError(result.error || 'Failed to create event')
      }
    } catch (err) {
      console.error('Error creating event:', err)
      setError('Failed to create event')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl overflow-hidden max-w-md w-full mx-4">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h2 className="text-lg font-semibold text-white">
          {eventType === 'event' ? 'Add New Event' : 'Schedule New Meeting'}
        </h2>
        <button
          onClick={closeModal}
          className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <CalendarEventForm
          eventType={eventType}
          eventForm={eventForm}
          isCreating={isCreating}
          error={error}
          onEventTypeChange={setEventType}
          onFormChange={setEventForm}
          onCreateEvent={handleCreateEvent}
        />
      </div>
    </div>
  )
}

export default ModalEventForm