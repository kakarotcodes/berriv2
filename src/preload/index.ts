// preload/index.js
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  resizeWindow: (dimensions) => ipcRenderer.send('resize-window', dimensions),
  animateViewTransition: (view) => {
    if (['default', 'pill', 'hover', 'expanded'].includes(view)) {
      return ipcRenderer.invoke('animate-view-transition', view)
    }
    return Promise.reject('Invalid view type')
  },
  startVerticalDrag: (mouseY) => ipcRenderer.send('start-vertical-drag', mouseY),
  updateVerticalDrag: (mouseY) => ipcRenderer.send('update-vertical-drag', mouseY),
  endVerticalDrag: () => ipcRenderer.send('end-vertical-drag'),
  setResizable: (resizable) => ipcRenderer.send('set-resizable', resizable)
})
