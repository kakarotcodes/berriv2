// components/DefaultView.tsx
import { useViewStore } from '@/globalStore'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const DefaultView = () => {
  const { setView } = useViewStore()
  const [isVisible, setIsVisible] = useState(false)

  // Trigger the fade-in effect after component mounts
  useEffect(() => {
    // Short delay to ensure the component is ready before starting animation
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 50)
    
    return () => clearTimeout(timer)
  }, [])

  return (
    <motion.div 
      className="w-full h-full cursor-pointer bg-[#00000000] p-4 transform-gpu will-change-transform"
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Your existing workspace content */}
      <div className="text-white text-center">
        <button onClick={() => setView('pill')}>Switch to Pill View</button>
      </div>
    </motion.div>
  )
}

export default DefaultView
