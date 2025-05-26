import { useEffect, useRef } from 'react'
import { useElectron } from '@/hooks/useElectron'

export function useHoverHeaderDrag() {
  const { startDrag, updateDrag, endDrag } = useElectron()

  const rafIdRef = useRef<number | null>(null)
  const isDraggingRef = useRef(false)
  const lastMouseRef = useRef({ x: 0, y: 0 })
  const cleanupFnRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const hoverHeader = document.getElementById('hover-header')

      if (
        !hoverHeader?.contains(target) ||
        target.closest('#resize-btn-grp') ||
        target.closest('.cursor-pointer')
      ) {
        return
      }

      if (isDraggingRef.current) return

      isDraggingRef.current = true
      lastMouseRef.current = { x: e.screenX, y: e.screenY }
      e.preventDefault()
      e.stopPropagation()

      hoverHeader.classList.add('dragging')
      document.body.classList.add('dragging')

      startDrag(e.screenX, e.screenY)
      animateDrag()
    }

    const onMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        lastMouseRef.current = { x: e.screenX, y: e.screenY }
      }
    }

    const animateDrag = () => {
      if (isDraggingRef.current) {
        updateDrag(lastMouseRef.current.x, lastMouseRef.current.y)
        rafIdRef.current = requestAnimationFrame(animateDrag)
      }
    }

    const onMouseUp = () => {
      if (!isDraggingRef.current) return

      isDraggingRef.current = false

      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }

      endDrag()

      const handle = document.getElementById('hover-header')
      if (handle) {
        handle.classList.remove('dragging')
      }
      document.body.classList.remove('dragging')
    }

    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)

    cleanupFnRef.current = () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)

      isDraggingRef.current = false
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
    }

    return () => {
      if (cleanupFnRef.current) {
        cleanupFnRef.current()
        cleanupFnRef.current = null
      }
    }
  }, [startDrag, updateDrag, endDrag])
}
