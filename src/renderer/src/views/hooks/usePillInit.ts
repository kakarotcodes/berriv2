import { useEffect } from 'react'

export function usePillInit(
  savePillPosition: () => void,
  resizeWindow: (dims: any) => void,
  dimensions: any
) {
  useEffect(() => {
    setTimeout(savePillPosition, 100)
  }, [savePillPosition])

  useEffect(() => {
    try {
      resizeWindow(dimensions)
    } catch (e) {
      console.error('Window resize error:', e)
    }
  }, [dimensions, resizeWindow])
}
