// components/pill/PillNotification.tsx
import React from 'react'

interface PillNotificationProps {
  count: number
  onClick: () => void
}

const PillNotification: React.FC<PillNotificationProps> = ({ count, onClick }) => (
  <div className="flex-1 w-full px-1.5 flex items-center justify-center" onClick={onClick}>
    <span
      style={{
        WebkitTextStroke: '0.1px black',
        color: 'white',
        cursor: 'pointer',
        transform: 'scale(1)',
        transition: 'transform 0.2s ease'
      }}
      className="bg-[#D92D20] rounded-full w-5 h-5 text-[10px] font-extrabold flex items-center justify-center"
    >
      {count}
    </span>
  </div>
)

export default PillNotification
