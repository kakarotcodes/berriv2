// hooks/useDragHandle.ts
import { useEffect, useRef } from 'react'

export function useDragHandle(savePillPosition: () => void) {
  const rafIdRef = useRef<number | null>(null)

  useEffect(() => {
    const handle = document.getElementById('drag-handle')
    if (!handle) return

    let isDragging = false,
      lastY = 0,
      isAnimating = false

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true
      lastY = e.clientY
      e.preventDefault()
      handle.classList.add('active')
      document.body.classList.add('dragging')
      window.electronAPI.startVerticalDrag(lastY)

      if (!isAnimating) {
        isAnimating = true
        requestAnimationFrame(animateDrag)
      }
    }

    const onMouseMove = (e: MouseEvent) => isDragging && (lastY = e.clientY)

    const animateDrag = () => {
      if (isDragging) {
        window.electronAPI.updateVerticalDrag(lastY)
        rafIdRef.current = requestAnimationFrame(animateDrag)
      } else {
        isAnimating = false
      }
    }

    const onMouseUp = () => {
      if (!isDragging) return
      isDragging = false
      cancelAnimationFrame(rafIdRef.current!)
      rafIdRef.current = null
      window.electronAPI.endVerticalDrag()
      handle.classList.remove('active')
      document.body.classList.remove('dragging')
      savePillPosition()
    }

    handle.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)

    return () => {
      handle.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      cancelAnimationFrame(rafIdRef.current!)
    }
  }, [savePillPosition])
}
