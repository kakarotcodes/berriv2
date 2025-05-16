import { useEffect, useRef, useState } from 'react'

// Define a new ClipboardItem component to handle expansion logic
const ClipboardItem: React.FC<{ content: string }> = ({ content }) => {
  const [expanded, setExpanded] = useState(false)
  const [isTruncated, setIsTruncated] = useState(false)
  const textRef = useRef<HTMLDivElement>(null)

  // Check if text is truncated
  useEffect(() => {
    const checkIfTruncated = () => {
      if (textRef.current) {
        const isOverflowing = textRef.current.scrollWidth > textRef.current.clientWidth
        setIsTruncated(isOverflowing)
      }
    }

    checkIfTruncated()

    // Also check on window resize
    window.addEventListener('resize', checkIfTruncated)
    return () => window.removeEventListener('resize', checkIfTruncated)
  }, [content])

  const toggleExpand = () => {
    setExpanded(!expanded)
  }

  return (
    <li className={`border border-zinc-600 p-2 rounded text-white ${expanded ? 'h-auto' : 'h-10'}`}>
      {expanded ? (
        <div>
          <div className="flex justify-between items-start">
            <div className="pr-2">{content}</div>
            <button onClick={toggleExpand} className="flex-shrink-0 text-zinc-400 hover:text-white">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 15l7-7 7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-center h-full">
          <div ref={textRef} className="truncate pr-2">
            {content}
          </div>
          {isTruncated && (
            <button onClick={toggleExpand} className="flex-shrink-0 text-zinc-400 hover:text-white">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          )}
        </div>
      )}
    </li>
  )
}

export default ClipboardItem
