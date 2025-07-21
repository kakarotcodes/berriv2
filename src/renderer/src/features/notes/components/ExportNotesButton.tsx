import React, { useState } from 'react'
import { FileText, Download } from 'lucide-react'

interface ExportNotesButtonProps {
  selectedNoteId: string | null
}

const ExportNotesButton: React.FC<ExportNotesButtonProps> = ({
  selectedNoteId
}) => {
  const [isExporting, setIsExporting] = useState<'pdf' | 'docx' | null>(null)

  const handleExport = async (format: 'pdf' | 'docx') => {
    try {
      setIsExporting(format)

      if (!selectedNoteId) {
        alert('Please select a note to export')
        return
      }

      const result = format === 'pdf' 
        ? await window.electronAPI.notesAPI.exportPDF([selectedNoteId])
        : await window.electronAPI.notesAPI.exportDOCX([selectedNoteId])

      if (result.success) {
        alert(`Note exported successfully!`)
      } else {
        alert(`Export failed: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Export error:', error)
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsExporting(null)
    }
  }

  const buttonClass = "p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-all duration-200"

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleExport('pdf')}
        disabled={!selectedNoteId || isExporting !== null}
        className={buttonClass}
        title="Export note as PDF"
      >
        {isExporting === 'pdf' ? (
          <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <FileText size={16} />
        )}
      </button>
      
      <button
        onClick={() => handleExport('docx')}
        disabled={!selectedNoteId || isExporting !== null}
        className={buttonClass}
        title="Export note as DOCX"
      >
        {isExporting === 'docx' ? (
          <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <Download size={16} />
        )}
      </button>
    </div>
  )
}

export default ExportNotesButton