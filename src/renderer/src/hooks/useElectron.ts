// hooks/useElectron.ts
import React from 'react'

declare global {
  interface Window {
    electronAPI: {
      resizeWindow: (dimensions: { width: number; height: number }) => void
      animateViewTransition: (view: string) => Promise<void>
      startVerticalDrag: (mouseY: number) => void;
      updateVerticalDrag: (mouseY: number) => void;
      endVerticalDrag: () => void;
      setResizable: (resizable: boolean) => void;
    }
  }
}

export const useElectron = () => {
  const resizeWindow = React.useCallback((dimensions: { width: number; height: number }) => {
    window.electronAPI.resizeWindow(dimensions)
  }, [])
  
  const startVerticalDrag = React.useCallback((mouseY: number) => {
    window.electronAPI.startVerticalDrag(mouseY)
  }, [])
  
  const updateVerticalDrag = React.useCallback((mouseY: number) => {
    window.electronAPI.updateVerticalDrag(mouseY)
  }, [])
  
  const endVerticalDrag = React.useCallback(() => {
    window.electronAPI.endVerticalDrag()
  }, [])
  
  const setResizable = React.useCallback((resizable: boolean) => {
    window.electronAPI.setResizable(resizable)
  }, [])

  return { 
    resizeWindow, 
    startVerticalDrag, 
    updateVerticalDrag, 
    endVerticalDrag,
    setResizable
  }
}
