// hooks/useElectron.ts
import React from 'react'

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

  const savePillPosition = React.useCallback(() => {
    window.electronAPI.savePillPosition()
  }, [])

  return {
    resizeWindow,
    startVerticalDrag,
    updateVerticalDrag,
    endVerticalDrag,
    setResizable,
    savePillPosition
  }
}
