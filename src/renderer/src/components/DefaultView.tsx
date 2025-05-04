import React from 'react'

/**
 * DefaultView - The primary view component for the overlay application.
 * Provides a centered, visually appealing container with GPU acceleration
 * to display content in an always-on-top Electron window.
 */
const DefaultView: React.FC = () => {
  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center">
      <div
        className="w-full h-full flex flex-col items-center justify-center
                  rounded-2xl shadow-2xl transform-gpu will-change-transform"
      >
        <h1 className="text-xl text-slate-300 font-semibold">Default View</h1>
        <p className="mt-2 text-sm text-slate-300">Main workspace area</p>
      </div>
    </div>
  )
}

export default DefaultView
