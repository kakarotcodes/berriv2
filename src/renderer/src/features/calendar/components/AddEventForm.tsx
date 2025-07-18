import React from 'react'
import { CalendarIcon, MapPinIcon, UserPlusIcon } from 'lucide-react'

interface EventFormData {
  title: string
  date: string
  startTime: string
  endTime: string
  description: string
  location: string
  attendees: string
}

interface AddEventFormProps {
  eventForm: EventFormData
  isCreating: boolean
  error: string | null
  onFormChange: (form: EventFormData) => void
  onCreateEvent: () => void
}

const AddEventForm: React.FC<AddEventFormProps> = ({
  eventForm,
  isCreating,
  error,
  onFormChange,
  onCreateEvent
}) => {
  return (
    <div className="flex-1 rounded-xl p-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Add Event</h2>

      <div className="space-y-3">
        {/* Date Field */}
        <div className="relative">
          <input
            type="date"
            value={eventForm.date}
            onChange={(e) => onFormChange({ ...eventForm, date: e.target.value })}
            className="w-full px-3 py-1.5 bg-gray-300 border-none rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <CalendarIcon className="absolute right-3 top-2 w-4 h-4 text-white/80 pointer-events-none" />
        </div>

        {/* Time Fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <input
              type="time"
              value={eventForm.startTime}
              onChange={(e) => onFormChange({ ...eventForm, startTime: e.target.value })}
              className="w-full px-3 py-1.5 bg-gray-300 border-none rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="text-xs text-white/80 mt-1">Start time</div>
          </div>
          <div>
            <input
              type="time"
              value={eventForm.endTime}
              onChange={(e) => onFormChange({ ...eventForm, endTime: e.target.value })}
              className="w-full px-3 py-1.5 bg-gray-300 border-none rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="text-xs text-white/80 mt-1">End time</div>
          </div>
        </div>

        {/* Event Title */}
        <input
          type="text"
          placeholder="Event title"
          value={eventForm.title}
          onChange={(e) => onFormChange({ ...eventForm, title: e.target.value })}
          className="w-full px-3 py-1.5 bg-gray-300 border-none rounded-lg text-gray-900 text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Description - hidden but maintains spacing */}
        <div className="h-[52px]"></div>

        {/* Location */}
        <div className="relative">
          <input
            type="text"
            placeholder="Location"
            value={eventForm.location}
            onChange={(e) => onFormChange({ ...eventForm, location: e.target.value })}
            className="w-full px-3 py-1.5 bg-gray-300 border-none rounded-lg text-gray-900 text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <MapPinIcon className="absolute right-3 top-2 w-4 h-4 text-white/80 pointer-events-none" />
        </div>

        {/* Add Guests */}
        <div>
          <input
            type="text"
            placeholder="Add guests (email addresses)"
            value={eventForm.attendees}
            onChange={(e) => onFormChange({ ...eventForm, attendees: e.target.value })}
            className="w-full px-3 py-1.5 bg-gray-300 border-none rounded-lg text-gray-900 text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex items-center space-x-2 text-white/80 mt-1">
            <UserPlusIcon className="w-3 h-3" />
            <span className="text-xs">Separate multiple emails with commas</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* Create Button */}
        <button
          onClick={onCreateEvent}
          disabled={!eventForm.title.trim() || isCreating}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
        >
          {isCreating ? 'Creating...' : 'Create Event'}
        </button>
      </div>
    </div>
  )
}

export default AddEventForm
