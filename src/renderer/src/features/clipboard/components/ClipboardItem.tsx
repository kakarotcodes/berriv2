// dependencies
import { useEffect, useRef, useState, memo } from 'react'
import { Copy, ChevronDown, Check } from 'lucide-react'
import { DateTime } from 'luxon'

type ClipboardItemProps = {
  content: string
  timestamp: number
}

// Define the component directly, without using React.FC
const ClipboardItem = memo(({ content, timestamp }: ClipboardItemProps) => {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isTruncated, setIsTruncated] = useState(false)

  const textRef = useRef<HTMLDivElement>(null)

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

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

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
    // If not expanded yet, expand it
    if (!expanded) {
      setExpanded(true)
      return
    }

    // If expanded and text is selected, don't collapse
    const selection = window.getSelection()
    if (selection && selection.toString().trim() !== '') {
      // User is selecting text, don't collapse
      return
    }

    // Otherwise toggle expanded state
    setExpanded((prev) => !prev)
  }

  return (
    <li
      className={`flex flex-col justify-center border border-zinc-600 p-2 rounded text-white transition-all ${
        expanded ? 'h-auto' : 'h-10 overflow-hidden'
      }`}
      onClick={handleItemClick}
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
          {isTruncated && !expanded && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setExpanded(true)
              }}
              className="text-zinc-400 hover:text-white"
              title="Expand"
            >
              <ChevronDown size={15} />
            </button>
          )}

          <button
            onClick={handleCopy}
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
