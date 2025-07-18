// dependencies
import { useEffect, useRef, useState, memo } from 'react'
import { Copy, ChevronDown, Check } from 'lucide-react'
import { DateTime } from 'luxon'
import { toast } from 'react-toastify'

type ClipboardItemProps = {
  content: string
  timestamp: number
}

// Define the component directly, without using React.FC
const ClipboardItem = memo(({ content, timestamp }: ClipboardItemProps) => {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isTruncated, setIsTruncated] = useState(false)
  const [isHovering, setIsHovering] = useState(false)

  const textRef = useRef<HTMLDivElement>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Truncation detection
  useEffect(() => {
    const checkTruncation = () => {
      const el = textRef.current
      if (el) {
        setIsTruncated(el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight)
      }
    }

    checkTruncation()
    window.addEventListener('resize', checkTruncation)
    return () => window.removeEventListener('resize', checkTruncation)
  }, [content])

  // Check if content is likely code
  const isCode =
    content.includes('{') &&
    content.includes('}') &&
    (content.includes('function') ||
      content.includes('=>') ||
      content.includes('const') ||
      content.includes('let') ||
      content.includes('var'))

  // Handler for clicking on the item
  const handleItemClick = () => {
    // Copy content to clipboard
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)

    // Show toast notification
    toast.success('Content copied!', {
      position: 'bottom-center',
      autoClose: 2000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: false,
      style: {
        backgroundColor: 'black',
        color: 'white',
        fontSize: '12px',
        padding: '8px 12px',
        minHeight: 'auto',
        width: 'auto',
        borderRadius: '6px'
      }
    })
  }

  // Handler for mouse enter
  const handleMouseEnter = () => {
    setIsHovering(true)
    if (isTruncated) {
      hoverTimeoutRef.current = setTimeout(() => {
        setExpanded(true)
      }, 500)
    }
  }

  // Handler for mouse leave
  const handleMouseLeave = () => {
    setIsHovering(false)
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    setExpanded(false)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  return (
    <li
      className={`flex flex-col justify-center border border-zinc-600 pt-2 px-2 pb-2 rounded text-white cursor-pointer ${
        expanded ? 'h-auto' : 'h-12 overflow-hidden'
      }`}
      onClick={handleItemClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex justify-between items-start gap-2">
        <div
          ref={textRef}
          className={`pr-2 text-sm ${!expanded ? 'truncate' : ''} ${
            isCode && expanded ? 'font-mono text-xs whitespace-pre-wrap' : ''
          } max-w-full break-words ${!expanded ? 'overflow-hidden' : 'overflow-auto'}`}
          style={{
            wordBreak: 'break-word',
            overflowWrap: 'break-word'
          }}
        >
          {content}
          <p className="text-[8px] text-zinc-400 mt-1">
            {DateTime.fromMillis(timestamp).toFormat('dd MMM yyyy HH:mm')}
          </p>
        </div>

        <div className="flex-shrink-0 flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              // Copy functionality is handled by the card click
              handleItemClick()
            }}
            className={`transition-colors ${
              copied ? 'text-green-500' : 'text-zinc-400 hover:text-white'
            }`}
            title="Copy to clipboard"
          >
            {copied ? <Check size={15} /> : <Copy size={13} />}
          </button>
        </div>
      </div>
    </li>
  )
})

ClipboardItem.displayName = 'ClipboardItem'
export default ClipboardItem
