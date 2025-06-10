// preload/index.js
import { contextBridge, ipcRenderer } from 'electron'

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

  // Get current window bounds
  getWindowBounds: () => ipcRenderer.invoke('get-window-bounds'),

  // ------------------------------------------------------------
  // Authentication API
  // ------------------------------------------------------------

  auth: {
    openGoogleLogin: () => ipcRenderer.invoke('auth:open-google-login'),
    getTokens: () => ipcRenderer.invoke('auth:get-tokens'),
    logout: () => ipcRenderer.invoke('auth:logout'),
    onAuthCallback: (callback) => {
      // Remove existing listeners to prevent memory leaks
      ipcRenderer.removeAllListeners('protocol-url')

      // Add the new listener
      ipcRenderer.on('protocol-url', (_event, data) => {
        callback(data)
      })

      // Return a cleanup function
      return () => {
        ipcRenderer.removeAllListeners('protocol-url')
      }
    }
  },

  // ------------------------------------------------------------
  // Vertical Drag
  // ------------------------------------------------------------

  startVerticalDrag: (mouseY) => ipcRenderer.send('start-vertical-drag', mouseY),
  updateVerticalDrag: (mouseY) => ipcRenderer.send('update-vertical-drag', mouseY),
  endVerticalDrag: () => ipcRenderer.send('end-vertical-drag'),

  // ------------------------------------------------------------
  // Full Drag
  // ------------------------------------------------------------
  startDrag: (mouseX, mouseY) => ipcRenderer.send('start-drag', { mouseX, mouseY }),
  updateDrag: (mouseX, mouseY) => ipcRenderer.send('update-drag', { mouseX, mouseY }),
  endDrag: () => ipcRenderer.send('end-drag'),

  setResizable: (resizable) => ipcRenderer.send('set-resizable', resizable),

  setMainWindowResizable: (resizable) => ipcRenderer.send('set-main-window-resizable', resizable),

  savePillPosition: () => ipcRenderer.send('save-pill-position'),

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

  // ------------------------------------------------------------
  // Clipboard history
  // ------------------------------------------------------------

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
  },

  // ------------------------------------------------------------
  // Notes API
  // ------------------------------------------------------------

  notesAPI: {
    getAllNotes: () => ipcRenderer.invoke('notes:getAll'),
    getTrashedNotes: () => ipcRenderer.invoke('notes:getTrashed'),
    insertNote: (note) => ipcRenderer.invoke('notes:insert', note),
    updateNote: (id, fields) => ipcRenderer.invoke('notes:update', { id, fields }),
    trashNote: (id) => ipcRenderer.invoke('notes:trash', id),
    restoreNote: (id) => ipcRenderer.invoke('notes:restore', id),
    permanentlyDeleteNote: (id) => ipcRenderer.invoke('notes:deleteForever', id),
    saveImage: (filename, arrayBuffer) =>
      ipcRenderer.invoke('notes:saveImage', { filename, file: arrayBuffer })
  },

  // Fix hover dimensions
  fixHoverDimensions: () => ipcRenderer.send('fix-hover-dimensions'),

  // Hover size management
  saveHoverSize: (dimensions) => ipcRenderer.send('save-hover-size', dimensions),
  getSavedHoverSize: () => ipcRenderer.invoke('get-hover-size'),

  // Window visibility for flicker-free transitions
  hideWindowTemporarily: () => ipcRenderer.invoke('window:hide-temporarily'),
  showWindow: () => ipcRenderer.invoke('window:show'),

  // Listen for real transition completion events
  onViewTransitionDone: (callback) => {
    ipcRenderer.removeAllListeners('view-transition-done')
    ipcRenderer.on('view-transition-done', (_event, view) => {
      callback(view)
    })
    return () => ipcRenderer.removeAllListeners('view-transition-done')
  }
})
