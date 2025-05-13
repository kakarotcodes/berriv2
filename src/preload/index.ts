// preload/index.js
const { contextBridge, ipcRenderer } = require('electron')

// CSS opacity fallback handler
ipcRenderer.on('pill:set-css-opacity', (_event, alpha) => {
  document.documentElement.style.opacity = alpha.toString()
})

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
  setResizable: (resizable) => ipcRenderer.send('set-resizable', resizable),
  savePillPosition: () => ipcRenderer.send('save-pill-position'),
  
  // Opacity control
  setPillOpacity: (alpha) => ipcRenderer.send('pill:set-opacity', alpha),
  setCssOpacity: (alpha) => {
    document.documentElement.style.opacity = alpha.toString()
  },
  
  // External links
  openExternal: (url) => ipcRenderer.send('open-external', url),
  
  // Sleep/wake handlers
  requestCurrentView: (callback) => {
    ipcRenderer.on('request-current-view', () => {
      // Call the provided callback to get the current view
      const view = callback() || 'default'
      ipcRenderer.send('persist-last-view', view)
    })
  },
  onResumeFromSleep: (callback) => {
    ipcRenderer.on('resume-view', (_event, view) => {
      callback(view)
    })
  }
})
