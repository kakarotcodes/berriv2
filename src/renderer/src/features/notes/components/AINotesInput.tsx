import React, { useState, useEffect, useRef } from 'react'
import { useNotesStore } from '../store/notesStore'
import { aiApi } from '@/api/ai'
import { Loader2, Sparkles, X } from 'lucide-react'

interface AINotesInputProps {
  isVisible: boolean
  onClose: () => void
}

const AINotesInput: React.FC<AINotesInputProps> = ({ isVisible, onClose }) => {
  const [input, setInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { addNote, setSelectedNoteId } = useNotesStore()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isVisible])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isGenerating) return

    const prompt = input.trim()
    setIsGenerating(true)
    setError(null)

    try {
      const response = await aiApi.generateNotes(prompt)
      
      if (response.success && response.notes) {
        // Format the AI response into proper structured notes
        const formattedContent = formatAIResponse(response.notes)
        
        const newNote = {
          id: crypto.randomUUID(),
          title: `${prompt}`,
          type: 'richtext' as const,
          content: formattedContent,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        await addNote(newNote)
        setSelectedNoteId(newNote.id)
        setInput('')
        onClose()
      } else {
        setError(response.error || 'Failed to generate notes')
      }
    } catch (error) {
      console.error('AI generation error:', error)
      setError(error instanceof Error ? error.message : 'Unknown error occurred')
    } finally {
      setIsGenerating(false)
    }
  }

  const formatAIResponse = (aiText: string): string => {
    // Clean up the AI response and format it properly
    let formatted = aiText.trim()
    
    // Remove excessive headers and clean up formatting
    formatted = formatted.replace(/^#{1,6}\s*/gm, '## ')
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // Convert bullet points to proper HTML
    formatted = formatted.replace(/^\* (.*$)/gim, '<li>$1</li>')
    formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    
    // Convert numbered lists
    formatted = formatted.replace(/^\d+\.\s+(.*$)/gim, '<li>$1</li>')
    
    // Add proper paragraph tags
    const lines = formatted.split('\n')
    const processedLines = lines.map(line => {
      if (line.trim() === '') return '<br>'
      if (line.startsWith('##')) return `<h3>${line.replace(/^## /, '')}</h3>`
      if (line.startsWith('<ul>') || line.startsWith('</ul>') || line.startsWith('<li>')) return line
      return `<p>${line}</p>`
    })
    
    return processedLines.join('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isVisible) return null

  return (
    <div className="w-full bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 
                    border-l-4 border-blue-500 p-4 mb-4 rounded-r-lg">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
            Generate AI Notes
          </span>
        </div>
        
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What would you like to generate notes about?"
            className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 
                     rounded-md text-gray-900 dark:text-white text-sm
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     placeholder-gray-400 dark:placeholder-gray-500"
            disabled={isGenerating}
          />
          
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center gap-1.5 min-w-[100px] justify-center"
            disabled={!input.trim() || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate</span>
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={onClose}
            className="px-2 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 
                     dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 
                     rounded-md"
            disabled={isGenerating}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="text-red-600 dark:text-red-400 text-xs">
            {error}
          </div>
        )}
      </form>
    </div>
  )
}

export default AINotesInput