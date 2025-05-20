import React, { useEffect, useRef, useState } from 'react'
import NotesSidebar from '../components/NotesSidebar'
import NotesEditor from '../components/NotesEditor'
import { useNotesStore } from '../store/notesStore'
import { useElectron } from '@/hooks/useElectron'
import { Lock, Unlock } from 'lucide-react'

const NotesViewHover: React.FC = () => {
  const [leftWidth, setLeftWidth] = useState<number>(40)
  const resizerRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef<boolean>(false)

  const [isResizable, setIsResizable] = useState(false)
  const { setMainWindowResizable } = useElectron()

  const toggleResizable = () => {
    const newState = !isResizable
    setIsResizable(newState)
    setMainWindowResizable(newState)
  }

  const { setNotes, setTrashed } = useNotesStore()

  useEffect(() => {
    async function loadNotes() {
      const [all, trash] = await Promise.all([
        window.electronAPI.notesAPI.getAllNotes(),
        window.electronAPI.notesAPI.getTrashedNotes()
      ])
      setNotes(all)
      setTrashed(trash)
    }
    loadNotes()
  }, [])

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault()
      isDraggingRef.current = true
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    const handleMouseUp = () => {
      isDraggingRef.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return
      const containerRect = containerRef.current.getBoundingClientRect()
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100
      if (newWidth >= 20 && newWidth <= 80) {
        setLeftWidth(newWidth)
      }
    }

    const resizer = resizerRef.current
    if (resizer) resizer.addEventListener('mousedown', handleMouseDown)

    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mousemove', handleMouseMove)

    return () => {
      if (resizer) resizer.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <div className="w-full h-full flex text-white text-sm bg-black" ref={containerRef}>
      <button
        onClick={toggleResizable}
        className="p-2 bg-zinc-700 rounded-full"
        title={isResizable ? 'Lock resizing' : 'Allow resizing'}
      >
        {isResizable ? <Lock size={16} /> : <Unlock size={16} />}
      </button>
      {/* Sidebar */}
      <div style={{ width: `${leftWidth}%` }} className="h-full overflow-hidden">
        <NotesSidebar />
      </div>

      {/* Resizer */}
      <div
        ref={resizerRef}
        className="w-0.5 bg-gray-600 hover:bg-blue-500 active:bg-blue-700 cursor-col-resize flex-shrink-0 relative"
        title="Drag to resize"
      >
        <div className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center">
          <div className="h-8 w-0.5 bg-gray-400 rounded-full"></div>
        </div>
      </div>

      {/* Editor */}
      <div style={{ width: `calc(100% - ${leftWidth}% - 1px)` }} className="h-full overflow-hidden">
        <NotesEditor />
      </div>
    </div>
  )
}

export default NotesViewHover
