import React, { useState, useEffect } from 'react'
import {
  Trash2,
  ExternalLink,
  Calendar,
  Image,
  FileText,
  Download,
  Archive,
  Video,
  Music,
  Code,
  File
} from 'lucide-react'

interface DownloadFile {
  id: string
  name: string
  path: string
  dateAdded: Date
  size: number
  extension: string
  type: string
  thumbnail?: string
}

interface FileTypeCategory {
  name: string
  extensions: string[]
  count: number
}

const DownloadsViewHover: React.FC = () => {
  const [files, setFiles] = useState<DownloadFile[]>([])
  const [categories, setCategories] = useState<FileTypeCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState<DownloadFile | null>(null)
  const [activeFilter, setActiveFilter] = useState<string>('All')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')

  useEffect(() => {
    loadFiles()
  }, [])

  // Refresh files when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadFiles()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const loadFiles = async () => {
    try {
      setLoading(true)
      const result = await window.electronAPI.screenshots.getScreenshots()

      if (result.success) {
        setFiles(result.files || result.screenshots || [])
        setCategories(result.categories || [])
      } else {
        console.error('Failed to load files:', result.error)
      }
    } catch (error) {
      console.error('Error loading files:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteFile = async (filePath: string) => {
    try {
      const result = await window.electronAPI.screenshots.deleteScreenshot(filePath)
      if (result.success) {
        await loadFiles() // Refresh the list
      } else {
        console.error('Failed to delete file:', result.error)
      }
    } catch (error) {
      console.error('Error deleting file:', error)
    }
  }

  const openInFinder = async (filePath: string) => {
    try {
      await window.electronAPI.screenshots.openInFinder(filePath)
    } catch (error) {
      console.error('Error opening in Finder:', error)
    }
  }

  const startFileDrag = (e: React.DragEvent, filePath: string) => {
    e.preventDefault() // prevent Chromium's own HTML5 drag
    window.electronAPI.screenshots.startDrag(filePath)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'Images':
        return <Image className="w-4 h-4" />
      case 'PDFs':
        return <FileText className="w-4 h-4" />
      case 'Documents':
        return <FileText className="w-4 h-4" />
      case 'Spreadsheets':
        return <FileText className="w-4 h-4" />
      case 'Presentations':
        return <FileText className="w-4 h-4" />
      case 'Text Files':
        return <FileText className="w-4 h-4" />
      case 'Archives':
        return <Archive className="w-4 h-4" />
      case 'Videos':
        return <Video className="w-4 h-4" />
      case 'Audio':
        return <Music className="w-4 h-4" />
      case 'Applications':
        return <Download className="w-4 h-4" />
      case 'Code Files':
        return <Code className="w-4 h-4" />
      default:
        return <File className="w-4 h-4" />
    }
  }

  const filteredFiles = files.filter((file) => 
    file.name !== '.DS_Store' && (activeFilter === 'All' || file.type === activeFilter)
  )

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    if (sortOrder === 'newest') {
      return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
    } else {
      return new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime()
    }
  })

  // Create filter categories with "All" option
  const filterCategories = [{ name: 'All', count: files.length }, ...categories]

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-400">Loading files...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white min-h-0">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Files</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
              className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded flex items-center gap-1"
            >
              <Calendar className="w-3 h-3" />
              {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
            </button>
          </div>
        </div>

        {/* Filter Categories */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {filterCategories.map((category) => (
            <button
              key={category.name}
              onClick={() => setActiveFilter(category.name)}
              className={`flex-shrink-0 px-3 py-1 text-xs rounded-full flex items-center gap-1 transition-colors ${
                activeFilter === category.name
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              {getFileIcon(category.name)}
              <span>{category.name}</span>
              <span className="text-xs opacity-75">({category.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-4">
        {sortedFiles.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <Download className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No files found</p>
            {activeFilter !== 'All' && (
              <button
                onClick={() => setActiveFilter('All')}
                className="text-blue-400 hover:text-blue-300 text-sm mt-2"
              >
                Show all files
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {sortedFiles.map((file) => (
              <div
                key={file.id}
                className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors group cursor-pointer"
                draggable
                onDragStart={(e) => startFileDrag(e, file.path)}
                onClick={() => setSelectedFile(file)}
              >
                {/* File Thumbnail/Icon */}
                <div className="aspect-square bg-gray-700 flex items-center justify-center relative">
                  {file.thumbnail ? (
                    <img
                      src={file.thumbnail}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 text-gray-400">{getFileIcon(file.type)}</div>
                  )}

                  {/* Actions overlay */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        openInFinder(file.path)
                      }}
                      className="p-1 bg-black/50 hover:bg-black/70 rounded text-white"
                      title="Show in Finder"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteFile(file.path)
                      }}
                      className="p-1 bg-black/50 hover:bg-red-600/70 rounded text-white"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* File Info */}
                <div className="p-2">
                  <div className="font-medium text-xs text-white truncate mb-1">{file.name}</div>
                  <div className="text-xs text-gray-400 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      {getFileIcon(file.type)}
                      <span className="truncate">{file.type}</span>
                    </span>
                    <span>{formatFileSize(file.size)}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{formatDate(file.dateAdded)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* File Detail Modal */}
      {selectedFile && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedFile(null)}
        >
          <div
            className="bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold truncate">{selectedFile.name}</h3>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Type:</span>
                <span className="flex items-center gap-1">
                  {getFileIcon(selectedFile.type)}
                  {selectedFile.type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Size:</span>
                <span>{formatFileSize(selectedFile.size)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Modified:</span>
                <span>{formatDate(selectedFile.dateAdded)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Extension:</span>
                <span>.{selectedFile.extension}</span>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => openInFinder(selectedFile.path)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Show in Finder
              </button>
              <button
                onClick={() => {
                  deleteFile(selectedFile.path)
                  setSelectedFile(null)
                }}
                className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DownloadsViewHover
