// src/main/utils/prefs.ts
import Store from 'electron-store' // 👈 use Store

export const prefs = new Store<{ 
  pillY: number;
}>({
  defaults: { pillY: 130 }
})
