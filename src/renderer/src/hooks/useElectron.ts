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

  const setPillOpacity = React.useCallback((alpha: number) => {
    window.electronAPI.setPillOpacity(alpha)
  }, [])

  const setCssOpacity = React.useCallback((alpha: number) => {
    window.electronAPI.setCssOpacity(alpha)
  }, [])

  // ✅ NEW: full drag support
  const startDrag = React.useCallback((mouseX: number, mouseY: number) => {
    window.electronAPI.startDrag(mouseX, mouseY)
  }, [])

  const updateDrag = React.useCallback((mouseX: number, mouseY: number) => {
    window.electronAPI.updateDrag(mouseX, mouseY)
  }, [])

  const endDrag = React.useCallback(() => {
    window.electronAPI.endDrag()
  }, [])

  return {
    resizeWindow,
    startVerticalDrag,
    updateVerticalDrag,
    endVerticalDrag,
    setResizable,
    savePillPosition,
    setPillOpacity,
    setCssOpacity,
    startDrag,
    updateDrag,
    endDrag
  }
}
