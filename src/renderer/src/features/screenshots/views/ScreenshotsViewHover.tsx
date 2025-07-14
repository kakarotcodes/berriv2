import React, { useState, useEffect } from 'react'
import { Trash2, ExternalLink, Calendar, Image, FileText, Copy, Plus, Loader } from 'lucide-react'
import { aiApi } from '../../../api/ai'

interface Screenshot {
  id: string
  name: string
  path: string
  dateAdded: Date
  size: number
  thumbnail?: string
}

interface OCRState {
  [screenshotId: string]: {
    extractedText?: string
    isExtracting: boolean
    error?: string
  }
}

const ScreenshotsViewHover: React.FC = () => {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedScreenshot, setSelectedScreenshot] = useState<Screenshot | null>(null)
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [ocrState, setOcrState] = useState<OCRState>({})
  const [showTextPanel, setShowTextPanel] = useState(false)

  useEffect(() => {
    loadScreenshots()
  }, [])

  const loadScreenshots = async () => {
    setLoading(true)
    try {
      const result = await window.electronAPI.screenshots.getScreenshots()
      if (result.success) {
        const sortedScreenshots = result.screenshots.sort((a, b) => {
          const dateA = new Date(a.dateAdded).getTime()
          const dateB = new Date(b.dateAdded).getTime()
          return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
        })
        setScreenshots(sortedScreenshots)
      }
    } catch (error) {
      console.error('Failed to load screenshots:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (screenshot: Screenshot) => {
    if (window.confirm(`Delete "${screenshot.name}"?`)) {
      try {
        const result = await window.electronAPI.screenshots.deleteScreenshot(screenshot.path)
        if (result.success) {
          setScreenshots(prev => prev.filter(s => s.id !== screenshot.id))
          if (selectedScreenshot?.id === screenshot.id) {
            setSelectedScreenshot(null)
          }
        } else {
          alert('Failed to delete screenshot')
        }
      } catch (error) {
        console.error('Failed to delete screenshot:', error)
        alert('Failed to delete screenshot')
      }
    }
  }

  const handleOpenInFinder = async (screenshot: Screenshot) => {
    try {
      await window.electronAPI.screenshots.openInFinder(screenshot.path)
    } catch (error) {
      console.error('Failed to open in Finder:', error)
    }
  }

  const handleExtractText = async (screenshot: Screenshot) => {
    // Set extracting state
    setOcrState(prev => ({
      ...prev,
      [screenshot.id]: {
        ...prev[screenshot.id],
        isExtracting: true,
        error: undefined
      }
    }))

    try {
      const result = await aiApi.extractTextFromImage(screenshot.path, {
        includeStructure: true
      })

      if (result.success && result.text) {
        setOcrState(prev => ({
          ...prev,
          [screenshot.id]: {
            ...prev[screenshot.id],
            extractedText: result.text,
            isExtracting: false,
            error: undefined
          }
        }))
        setShowTextPanel(true)
      } else {
        setOcrState(prev => ({
          ...prev,
          [screenshot.id]: {
            ...prev[screenshot.id],
            isExtracting: false,
            error: result.error || 'No text found in image'
          }
        }))
      }
    } catch (error) {
      setOcrState(prev => ({
        ...prev,
        [screenshot.id]: {
          ...prev[screenshot.id],
          isExtracting: false,
          error: error instanceof Error ? error.message : 'Failed to extract text'
        }
      }))
    }
  }

  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // Could add toast notification here
    } catch (error) {
      console.error('Failed to copy text:', error)
    }
  }

  const handleCreateNote = async (text: string, screenshotName: string) => {
    try {
      const note = {
        id: Date.now().toString(),
        title: `Text from ${screenshotName}`,
        type: 'text' as const,
        content: text,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pinned: false,
        trashed: false
      }

      await window.electronAPI.notesAPI.insertNote(note)
      // Could add toast notification here
    } catch (error) {
      console.error('Failed to create note:', error)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-zinc-400">Loading screenshots...</div>
      </div>
    )
  }

  if (screenshots.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 p-4">
        <Image size={48} className="mb-4 opacity-50" />
        <div className="text-center">
          <div className="text-lg font-medium mb-2">No screenshots found</div>
          <div className="text-sm">
            Screenshots will appear here when you take them using Cmd+Shift+3 or Cmd+Shift+4
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-zinc-700">
        <div className="flex items-center gap-2">
          <Image size={16} className="text-zinc-400" />
          <span className="text-sm font-medium text-zinc-200">
            Screenshots ({screenshots.length})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')
              loadScreenshots()
            }}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-zinc-700 hover:bg-zinc-600 rounded transition-colors"
          >
            <Calendar size={12} />
            {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
          </button>
          <button
            onClick={loadScreenshots}
            className="px-2 py-1 text-xs bg-zinc-700 hover:bg-zinc-600 rounded transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Screenshots Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 gap-3">
          {screenshots.map((screenshot) => (
            <div
              key={screenshot.id}
              className="group relative bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700 hover:border-zinc-600 transition-colors cursor-pointer"
              onClick={() => setSelectedScreenshot(screenshot)}
            >
              {/* Thumbnail */}
              <div className="aspect-video bg-zinc-900 flex items-center justify-center">
                {screenshot.thumbnail ? (
                  <img
                    src={screenshot.thumbnail}
                    alt={screenshot.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image size={24} className="text-zinc-600" />
                )}
              </div>

              {/* Info */}
              <div className="p-2">
                <div className="text-xs font-medium text-zinc-200 truncate mb-1">
                  {screenshot.name}
                </div>
                <div className="text-xs text-zinc-400 flex items-center justify-between">
                  <span>{formatDate(new Date(screenshot.dateAdded))}</span>
                  <span>{formatFileSize(screenshot.size)}</span>
                </div>
              </div>

              {/* Hover Actions */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleExtractText(screenshot)
                  }}
                  disabled={ocrState[screenshot.id]?.isExtracting}
                  className="p-1 bg-black/50 hover:bg-blue-600/70 rounded transition-colors disabled:opacity-50"
                  title="Extract Text"
                >
                  {ocrState[screenshot.id]?.isExtracting ? (
                    <Loader size={12} className="text-white animate-spin" />
                  ) : (
                    <FileText size={12} className="text-white" />
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpenInFinder(screenshot)
                  }}
                  className="p-1 bg-black/50 hover:bg-black/70 rounded transition-colors"
                  title="Open in Finder"
                >
                  <ExternalLink size={12} className="text-white" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(screenshot)
                  }}
                  className="p-1 bg-black/50 hover:bg-red-600/70 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 size={12} className="text-white" />
                </button>
              </div>

              {/* OCR Status Indicator */}
              {ocrState[screenshot.id]?.extractedText && (
                <div className="absolute top-2 left-2 bg-green-600/80 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <FileText size={10} />
                  Text
                </div>
              )}
              {ocrState[screenshot.id]?.error && (
                <div className="absolute top-2 left-2 bg-red-600/80 text-white text-xs px-2 py-1 rounded-full">
                  Error
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Selected Screenshot Modal */}
      {selectedScreenshot && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedScreenshot(null)}
        >
          <div
            className="max-w-4xl max-h-full bg-zinc-900 rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-700">
              <div>
                <div className="font-medium text-zinc-200">{selectedScreenshot.name}</div>
                <div className="text-sm text-zinc-400">
                  {formatDate(new Date(selectedScreenshot.dateAdded))} • {formatFileSize(selectedScreenshot.size)}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExtractText(selectedScreenshot)}
                  disabled={ocrState[selectedScreenshot.id]?.isExtracting}
                  className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-500 rounded transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {ocrState[selectedScreenshot.id]?.isExtracting ? (
                    <>
                      <Loader size={14} className="animate-spin" />
                      Extracting...
                    </>
                  ) : (
                    <>
                      <FileText size={14} />
                      Extract Text
                    </>
                  )}
                </button>
                {ocrState[selectedScreenshot.id]?.extractedText && (
                  <button
                    onClick={() => setShowTextPanel(!showTextPanel)}
                    className="px-3 py-1 text-sm bg-green-600 hover:bg-green-500 rounded transition-colors flex items-center gap-2"
                  >
                    <FileText size={14} />
                    {showTextPanel ? 'Hide Text' : 'Show Text'}
                  </button>
                )}
                <button
                  onClick={() => handleOpenInFinder(selectedScreenshot)}
                  className="px-3 py-1 text-sm bg-zinc-700 hover:bg-zinc-600 rounded transition-colors"
                >
                  Open in Finder
                </button>
                <button
                  onClick={() => setSelectedScreenshot(null)}
                  className="px-3 py-1 text-sm bg-zinc-700 hover:bg-zinc-600 rounded transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex">
              {/* Image Section */}
              <div className="flex-1 p-4">
                {selectedScreenshot.thumbnail ? (
                  <img
                    src={selectedScreenshot.thumbnail}
                    alt={selectedScreenshot.name}
                    className="max-w-full max-h-96 object-contain mx-auto"
                  />
                ) : (
                  <div className="flex items-center justify-center h-96 text-zinc-400">
                    <Image size={48} />
                    <span className="ml-2">Image not available</span>
                  </div>
                )}
              </div>

              {/* OCR Text Panel */}
              {showTextPanel && ocrState[selectedScreenshot.id]?.extractedText && (
                <div className="w-80 border-l border-zinc-700 p-4 bg-zinc-800">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                      <FileText size={14} />
                      Extracted Text
                    </div>
                    <button
                      onClick={() => setShowTextPanel(false)}
                      className="text-zinc-400 hover:text-zinc-200"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="bg-zinc-900 rounded p-3 mb-3 max-h-64 overflow-y-auto">
                    <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-mono">
                      {ocrState[selectedScreenshot.id]?.extractedText}
                    </pre>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopyText(ocrState[selectedScreenshot.id]?.extractedText || '')}
                      className="flex-1 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-500 rounded transition-colors flex items-center justify-center gap-2"
                    >
                      <Copy size={14} />
                      Copy
                    </button>
                    <button
                      onClick={() => handleCreateNote(
                        ocrState[selectedScreenshot.id]?.extractedText || '',
                        selectedScreenshot.name
                      )}
                      className="flex-1 px-3 py-2 text-sm bg-green-600 hover:bg-green-500 rounded transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus size={14} />
                      Note
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* OCR Error Display */}
            {ocrState[selectedScreenshot.id]?.error && (
              <div className="px-4 pb-4">
                <div className="bg-red-900/50 border border-red-700 rounded p-3 text-sm text-red-200">
                  <div className="font-medium mb-1">OCR Error</div>
                  <div>{ocrState[selectedScreenshot.id]?.error}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ScreenshotsViewHover 