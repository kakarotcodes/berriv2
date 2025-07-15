import React from 'react'
import { useAIStore } from '../../ai/store/aiStore'
import { X, Sparkles, AlertCircle } from 'lucide-react'

interface NoteSummaryProps {
  noteId: string
}

const NoteSummary: React.FC<NoteSummaryProps> = ({ noteId }) => {
  const { getSummary, getSummaryError, clearSummary } = useAIStore()

  const summary = getSummary(noteId)
  const error = getSummaryError(noteId)

  if (!summary && !error) return null

  return (
    <div className="mb-4 p-3 bg-zinc-900 border border-zinc-700 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-blue-400" />
          <span className="text-sm font-medium text-zinc-300">AI Summary</span>
        </div>
        <button
          onClick={() => clearSummary(noteId)}
          className="p-1 rounded hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-zinc-200"
          title="Clear summary"
        >
          <X size={14} />
        </button>
      </div>

      {error ? (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      ) : (
        <div className="text-sm text-zinc-300 leading-relaxed">{summary}</div>
      )}
    </div>
  )
}

export default NoteSummary
