// preload/index.js
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  resizeWindow: (dimensions) => ipcRenderer.send('resize-window', dimensions),
  animateViewTransition: (view) => ipcRenderer.send('animate-view-transition', view)
})
