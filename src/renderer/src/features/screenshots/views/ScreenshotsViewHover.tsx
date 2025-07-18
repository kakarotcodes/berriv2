import React, { useState, useEffect } from 'react'
import { Trash2, ExternalLink, Calendar, Image } from 'lucide-react'

interface Screenshot {
  id: string
  name: string
  path: string
  dateAdded: Date
  size: number
  thumbnail?: string
}

const ScreenshotsViewHover: React.FC = () => {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedScreenshot, setSelectedScreenshot] = useState<Screenshot | null>(null)
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')

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
            <div className="p-4">
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
          </div>
        </div>
      )}
    </div>
  )
}

export default ScreenshotsViewHover 