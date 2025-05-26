import React from 'react'

interface DividerProps {
  height?: number
}

const Divider: React.FC<DividerProps> = ({ height = 6 }) => {
  return <div style={{ height: `${height}px` }} className={`w-full`} />
}

export default Divider
