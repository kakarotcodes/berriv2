import React from 'react'
import { openScreenCapture } from '@/utils/appActions'

export const ScreenCaptureFeature: React.FC = () => {

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Screen Capture</h2>
      <p className="text-sm text-gray-600 mb-4">
        Open the macOS screen capture toolbar to take screenshots or record your screen.
      </p>
      <button
        onClick={openScreenCapture}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Open Screen Capture
      </button>
    </div>
  )
} 