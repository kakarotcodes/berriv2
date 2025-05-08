// hooks/useElectron.ts
import React from 'react'

declare global {
  interface Window {
    electronAPI: {
      resizeWindow: (dimensions: { width: number; height: number }) => void
      animateViewTransition: (view: string) => Promise<void>
    }
  }
}

export const useElectron = () => {
  const resizeWindow = React.useCallback((dimensions: { width: number; height: number }) => {
    window.electronAPI.resizeWindow(dimensions)
  }, [])

  return { resizeWindow }
}
