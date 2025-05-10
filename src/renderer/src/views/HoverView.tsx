import { memo, useCallback, useEffect, useRef } from 'react';
import { useViewStore } from '@/globalStore';

const HoverView = memo(() => {
  const { setView } = useViewStore();
  const leaveTimerRef = useRef<number | null>(null);
  
  // Constant for leave delay
  const LEAVE_DELAY = 500;
  
  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (leaveTimerRef.current !== null) {
        clearTimeout(leaveTimerRef.current);
      }
    };
  }, []);
  
  // Handle mouse leave - start timer to go back to pill view
  const handleMouseLeave = useCallback(() => {
    // Start timer to transition back to pill view
    leaveTimerRef.current = window.setTimeout(() => {
      setView('pill').catch(console.error);
    }, LEAVE_DELAY);
  }, [setView]);
  
  // Cancel leave timer when mouse enters again
  const handleMouseEnter = useCallback(() => {
    if (leaveTimerRef.current !== null) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  }, []);
  
  return (
    <div 
      className="w-full h-full bg-gray-800 p-4 rounded-lg"
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
    >
      <div className="bg-white/20 rounded-lg p-4 h-full flex flex-col">
        <h2 className="text-xl font-semibold text-white mb-4">Hover Panel</h2>
        
        <div className="flex flex-col gap-3 flex-grow">
          <button 
            className="bg-white/30 hover:bg-white/40 transition-colors text-white py-2 px-4 rounded-lg"
            onClick={() => {
              setView('default').catch(console.error);
            }}
          >
            Go to Default View
          </button>
          
          <button 
            className="bg-white/30 hover:bg-white/40 transition-colors text-white py-2 px-4 rounded-lg"
            onClick={() => {
              setView('pill').catch(console.error);
            }}
          >
            Back to Pill
          </button>
        </div>
        
        <div className="text-xs text-white/60 mt-4">
          Move mouse out to collapse back to pill after {LEAVE_DELAY/1000}s
        </div>
      </div>
    </div>
  );
});

export default HoverView; 