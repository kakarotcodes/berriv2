import React from 'react'

/**
 * DefaultView - The primary view component for the overlay application.
 * Provides a centered, visually appealing container with GPU acceleration
 * to display content in an always-on-top Electron window.
 */
const DefaultView: React.FC = () => {
  return (
    <div className="flex items-center justify-center w-[512px] h-[512px]">
      <div
        className="w-full h-full flex flex-col items-center justify-center
                  bg-white/80 rounded-2xl shadow-2xl border border-gray-200
                  transform-gpu will-change-transform"
      >
        <h1 className="text-xl font-semibold text-gray-800">Default View</h1>
        <p className="mt-2 text-sm text-gray-500">Main workspace area</p>
      </div>
    </div>
  )
}

export default DefaultView
