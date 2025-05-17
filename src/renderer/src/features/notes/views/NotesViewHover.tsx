// dependencies
import React, { useState, useRef, useEffect } from 'react'

const NotesViewHover: React.FC = () => {
  const [leftWidth, setLeftWidth] = useState<number>(40); // Default 40% width
  const resizerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      isDraggingRef.current = true;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      
      // Set limits - min 20%, max 80%
      if (newWidth >= 20 && newWidth <= 80) {
        setLeftWidth(newWidth);
      }
    };

    const resizer = resizerRef.current;
    if (resizer) {
      resizer.addEventListener('mousedown', handleMouseDown);
    }

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      if (resizer) {
        resizer.removeEventListener('mousedown', handleMouseDown);
      }
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="w-full h-full flex text-white text-sm" ref={containerRef}>
      <div 
        className="bg-red-400 truncate overflow-hidden" 
        id="note-heading"
        style={{ width: `${leftWidth}%` }}
      >
        A framework that can directly connect to ERP Next
      </div>
      
      {/* Resizer */}
      <div 
        ref={resizerRef}
        className="w-1 bg-gray-600 hover:bg-blue-500 active:bg-blue-700 cursor-col-resize flex-shrink-0 relative"
        title="Drag to resize"
      >
        {/* Visual handle for better visibility */}
        <div className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center">
          <div className="h-8 w-1 bg-gray-400 rounded-full"></div>
        </div>
      </div>
      
      <div 
        className="bg-blue-400 overflow-auto" 
        id="note-content"
        style={{ width: `calc(100% - ${leftWidth}% - 1px)` }}
      >
        <pre className="p-2">Matrix app Use ssg frameworks - svelte wheels Slack clone - Turso DB</pre>
      </div>
    </div>
  )
}

export default NotesViewHover
