// src/main/utils/prefs.ts
import Store from 'electron-store' // 👈 use Store

export const prefs = new Store<{
  pillY: number
  pillX?: number
  pillReturnX?: number
  pillReturnY?: number
  hoverWidth?: number
  hoverHeight?: number
  smartHoverX?: number
  smartHoverY?: number
}>({
  defaults: {
    pillY: 130,
    hoverWidth: 500,
    hoverHeight: 500
  }
})
