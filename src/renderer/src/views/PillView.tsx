// views/PillView.tsx
import { memo, useEffect, useRef } from 'react'
import { useElectron } from '@/hooks/useElectron'
import { useViewStore } from '@/globalStore'

const PillView = memo(() => {
  const { resizeWindow } = useElectron()
  const { dimensions, setView } = useViewStore()
  const rafIdRef = useRef<number | null>(null)

  useEffect(() => {
    try {
      resizeWindow(dimensions)
    } catch (error) {
      console.error('Error resizing window:', error)
    }
  }, [dimensions, resizeWindow])

  useEffect(() => {
    const handle = document.getElementById('drag-handle');
    if (!handle) return;
    
    // Simple drag handler with mouse events only
    let isDragging = false;
    let lastY = 0;
    
    const onMouseDown = (e) => {
      // Start the drag
      isDragging = true;
      lastY = e.clientY;
      
      // Prevent default behaviors
      e.preventDefault();
      
      // Tell the main process we're starting a drag
      window.electronAPI.startVerticalDrag(e.clientY);
      
      // Add visual feedback
      handle.classList.add('active');
      document.body.classList.add('dragging');
    };
    
    const onMouseMove = (e) => {
      if (!isDragging) return;
      
      // Store the current Y position
      lastY = e.clientY;
      
      // If we already have an animation frame pending, don't request another
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(() => {
          // Send the position to the main process
          window.electronAPI.updateVerticalDrag(lastY);
          rafIdRef.current = null;
        });
      }
    };
    
    const onMouseUp = () => {
      if (!isDragging) return;
      
      // End the drag
      isDragging = false;
      
      // Cancel any pending animation frame
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      
      // Tell the main process we're done
      window.electronAPI.endVerticalDrag();
      
      // Remove visual feedback
      handle.classList.remove('active');
      document.body.classList.remove('dragging');
    };
    
    // Add the event listeners
    handle.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    
    // Clean up
    return () => {
      handle.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      
      // Make sure to cancel any pending animation frame
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full h-full bg-red-400 text-white flex justify-start items-center pl-2 gap-x-3">
      <button
        onClick={() => {
          useViewStore.setState({ currentView: 'default' })
          setView('default').catch(console.error)
        }}
        className="bg-green-500 rounded-full w-10 h-10 cursor-pointer"
      />
      <div 
        className="w-8 h-full bg-blue-500 cursor-grab hover:bg-blue-600 flex items-center justify-center" 
        id="drag-handle" 
      >
        <span className="text-white select-none">⋮</span>
      </div>
    </div>
  )
})

export default PillView
