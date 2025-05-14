// dependencies
import React, { useState } from 'react'
import { X, ChevronsUpDown } from 'lucide-react'

// store
import { useViewStore } from '@/globalStore'

// types
import { ViewType } from 'src/types/types'

const Header: React.FC = () => {
  const { setView } = useViewStore()
  const [hoverRed, setHoverRed] = useState(false)
  const [hoverGreen, setHoverGreen] = useState(false)

  const handleResize = (view: ViewType) => {
    setView(view).catch(console.error)
  }

  return (
    <div className="relative flex items-center justify-center" id="header">
      <div
        id="resize-btn-grp"
        className="absolute left-0 top-0 flex items-center justify-center gap-2 h-full"
      >
        <button
          onClick={() => handleResize('pill')}
          onMouseEnter={() => setHoverRed(true)}
          onMouseLeave={() => setHoverRed(false)}
          className="w-3 h-3 rounded-full bg-[#FF5F57] hover:brightness-90 relative flex items-center justify-center"
        >
          {hoverRed && <X size={10} color="black" className="absolute" strokeWidth={2.5} />}
        </button>
        <button
          onClick={() => handleResize('default')}
          onMouseEnter={() => setHoverGreen(true)}
          onMouseLeave={() => setHoverGreen(false)}
          className="w-3 h-3 rounded-full bg-[#28C840] hover:brightness-90 relative flex items-center justify-center"
        >
          {hoverGreen && <ChevronsUpDown size={10} color="black" className="absolute -rotate-45" strokeWidth={2.5} />}
        </button>
      </div>
      <p className="m-0 text-white font-bold">Berri</p>
    </div>
  )
}

export default Header
