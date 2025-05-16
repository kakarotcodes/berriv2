// preload/index.js
const { contextBridge, ipcRenderer } = require('electron')

// CSS opacity fallback handler
ipcRenderer.on('pill:set-css-opacity', (_event, alpha) => {
  document.documentElement.style.opacity = alpha.toString()
})

// Increase the max listeners limit for the 'request-current-view' event
ipcRenderer.setMaxListeners(20)

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
  saveHoverPosition: () => ipcRenderer.send('save-hover-position'),

  // Opacity control
  setPillOpacity: (alpha) => ipcRenderer.send('pill:set-opacity', alpha),
  setCssOpacity: (alpha) => {
    document.documentElement.style.opacity = alpha.toString()
  },

  // External links
  openExternal: (url) => ipcRenderer.send('open-external', url),

  // Google Meet
  startGoogleMeet: () => ipcRenderer.invoke('start-google-meet'),

  // Sleep/wake handlers
  requestCurrentView: (callback) => {
    // Remove any existing listeners to prevent memory leaks
    ipcRenderer.removeAllListeners('request-current-view')

    // Add the new listener
    ipcRenderer.on('request-current-view', () => {
      // Call the provided callback to get the current view
      const view = callback() || 'default'
      ipcRenderer.send('persist-last-view', view)
    })

    // Return a cleanup function that can be called to remove the listener
    return () => {
      ipcRenderer.removeAllListeners('request-current-view')
    }
  },
  onResumeFromSleep: (callback) => {
    // Remove any existing listeners to prevent memory leaks
    ipcRenderer.removeAllListeners('resume-view')

    // Add the new listener
    ipcRenderer.on('resume-view', (_event, view) => {
      callback(view)
    })

    // Return a cleanup function
    return () => {
      ipcRenderer.removeAllListeners('resume-view')
    }
  },

  // Clipboard history
  clipboard: {
    getHistory: () => ipcRenderer.invoke('clipboard:get-history'),
    onUpdate: (callback) => {
      // Remove existing listeners to prevent memory leaks
      ipcRenderer.removeAllListeners('clipboard:update')
      
      // Add the new listener
      ipcRenderer.on('clipboard:update', (_event, entry) => {
        callback(entry)
      })
      
      // Return a cleanup function
      return () => {
        ipcRenderer.removeAllListeners('clipboard:update')
      }
    }
  }
})
