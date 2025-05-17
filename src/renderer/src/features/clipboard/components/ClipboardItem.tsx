// dependencies
import { useEffect, useRef, useState, memo } from 'react'
import { Copy, ChevronDown, ChevronUp, Check } from 'lucide-react'

type ClipboardItemProps = {
  content: string
}

// Define the component directly, without using React.FC
const ClipboardItem = memo(({ content }: ClipboardItemProps) => {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isTruncated, setIsTruncated] = useState(false)

  const textRef = useRef<HTMLDivElement>(null)

  // Truncation detection
  useEffect(() => {
    const checkTruncation = () => {
      const el = textRef.current
      if (el) {
        setIsTruncated(el.scrollWidth > el.clientWidth)
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

  return (
    <li
      className={`flex flex-col justify-center border border-zinc-600 p-2 rounded text-white transition-all ${
        expanded ? 'h-auto' : 'h-10 overflow-hidden'
      }`}
      onClick={() => setExpanded((prev) => !prev)}
    >
      <div className="flex justify-between items-start gap-2">
        <div ref={textRef} className={`pr-2 text-sm ${!expanded ? 'truncate' : ''}`}>
          {content}
        </div>

        <div className="flex-shrink-0 flex items-center gap-2">
          {isTruncated && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setExpanded((prev) => !prev)
              }}
              className="text-zinc-400 hover:text-white"
              title={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
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
