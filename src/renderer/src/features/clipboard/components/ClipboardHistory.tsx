// dependencies
import React, { useState } from 'react'

// components
import { Divider } from '@/components/shared'

// hooks
import { useClipboardHistory } from '../hooks/clipboardHooks'

// Define a new ClipboardItem component to handle expansion logic
const ClipboardItem: React.FC<{ content: string }> = ({ content }) => {
  const [expanded, setExpanded] = useState(false);
  
  const toggleExpand = () => {
    setExpanded(!expanded);
  };
  
  return (
    <li className={`border border-zinc-600 p-2 rounded text-white ${expanded ? 'h-auto' : 'h-10'}`}>
      {expanded ? (
        <div>
          <div className="flex justify-between items-end">
            <div className="pr-2">{content}</div>
            <button 
              onClick={toggleExpand} 
              className="flex-shrink-0 text-zinc-400 hover:text-white"
            >
              <svg 
                className="h-4 w-4" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-center h-full">
          <div className="truncate pr-2">{content}</div>
          <button 
            onClick={toggleExpand} 
            className="flex-shrink-0 text-zinc-400 hover:text-white"
          >
            <svg 
              className="h-4 w-4" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}
    </li>
  );
};

const ClipboardHistory: React.FC = () => {
  const history = useClipboardHistory()

  return (
    <div className="w-full h-full flex flex-col text-white overflow-hidden">
      {/* Fixed header */}
      <div className="flex-shrink-0">
        <p className="text-xs font-bold">Clipboard History</p>
        <Divider />
      </div>

      {/* Scrollable container - will only scroll its contents */}
      <div className="flex flex-col flex-1 min-h-0 overflow-y-auto rounded-md border border-zinc-600 p-2 mt-2">
        <ul className="space-y-2 text-sm">
          {history.map((entry) => (
            <ClipboardItem key={entry.id} content={entry.content} />
          ))}
        </ul>
      </div>
    </div>
  )
}

export default ClipboardHistory
