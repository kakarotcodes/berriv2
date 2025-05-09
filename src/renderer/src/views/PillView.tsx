// views/PillView.tsx
import { memo, useEffect } from 'react'
import { useElectron } from '@/hooks/useElectron'
import { useViewStore } from '@/globalStore'

const PillView = memo(() => {
  const { resizeWindow } = useElectron()
  const { dimensions, setView } = useViewStore()

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
    
    const onMouseDown = (e) => {
      // Start the drag
      isDragging = true;
      
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
      
      // Send the current mouse position to the main process
      window.electronAPI.updateVerticalDrag(e.clientY);
    };
    
    const onMouseUp = () => {
      if (!isDragging) return;
      
      // End the drag
      isDragging = false;
      
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
