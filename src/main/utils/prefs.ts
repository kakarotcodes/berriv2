// src/main/utils/prefs.ts
import Store from 'electron-store' // 👈 use Store

export const prefs = new Store<{
  pillY: number
  hoverWidth?: number
  hoverHeight?: number
}>({
  defaults: {
    pillY: 130,
    hoverWidth: 500,
    hoverHeight: 500
  }
})
