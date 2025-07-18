// preload/index.js
import { contextBridge, ipcRenderer } from 'electron'

// CSS opacity fallback handler
ipcRenderer.on('pill:set-css-opacity', (_event, alpha) => {
  document.documentElement.style.opacity = alpha.toString()
})

// Increase the max listeners limit for the 'request-current-view' event
ipcRenderer.setMaxListeners(20)

contextBridge.exposeInMainWorld('electronAPI', {
  resizeWindow: (dimensions, duration) =>
    ipcRenderer.send('resize-window', { ...dimensions, duration }),
  animateViewTransition: (view) => {
    if (['default', 'pill', 'hover'].includes(view)) {
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
    requestCalendarPermissions: () => ipcRenderer.invoke('auth:request-calendar'),
    requestGmailPermissions: () => ipcRenderer.invoke('auth:request-gmail'),
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
  // Calendar API
  // ------------------------------------------------------------

  calendar: {
    getEvents: (options) => ipcRenderer.invoke('calendar:get-events', options),
    createEvent: (event) => ipcRenderer.invoke('calendar:create-event', event)
  },

  // ------------------------------------------------------------
  // Gmail API
  // ------------------------------------------------------------

  gmail: {
    getEmails: (options) => ipcRenderer.invoke('gmail:get-emails', options)
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

  // Screen Capture
  screenCapture: {
    openToolbar: () => ipcRenderer.invoke('screen-capture:open-toolbar'),
    openSnippingTool: () => ipcRenderer.invoke('screen-capture:open-snipping-tool')
  },

  // Screenshots
  screenshots: {
    getScreenshots: () => ipcRenderer.invoke('screenshots:get-screenshots'),
    deleteScreenshot: (filePath: string) =>
      ipcRenderer.invoke('screenshots:delete-screenshot', filePath),
    openInFinder: (filePath: string) => ipcRenderer.invoke('screenshots:open-in-finder', filePath),
    watchDirectory: () => ipcRenderer.invoke('screenshots:watch-directory')
  },

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
    removeDuplicates: () => ipcRenderer.invoke('notes:removeDuplicates'),
    saveImage: (filename, arrayBuffer) =>
      ipcRenderer.invoke('notes:saveImage', { filename, file: arrayBuffer })
  },

  // ------------------------------------------------------------
  // AI API
  // ------------------------------------------------------------

  aiAPI: {
    summarizeNote: (content, title, options) =>
      ipcRenderer.invoke('ai:summarize-note', content, title, options),
    batchSummarize: (notes, options) => ipcRenderer.invoke('ai:batch-summarize', notes, options),
    checkHealth: () => ipcRenderer.invoke('ai:check-health')
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
  },

  // ------------------------------------------------------------
  // Theme API
  // ------------------------------------------------------------

  theme: {
    getSystemTheme: () => ipcRenderer.invoke('theme:get-system-theme'),
    setTheme: (theme) => ipcRenderer.send('theme:set-theme', theme),
    onSystemThemeChange: (callback) => {
      // Remove existing listeners to prevent memory leaks
      ipcRenderer.removeAllListeners('theme:system-changed')

      // Add the new listener
      ipcRenderer.on('theme:system-changed', (_event, isDark) => {
        callback(isDark)
      })

      // Return a cleanup function
      return () => {
        ipcRenderer.removeAllListeners('theme:system-changed')
      }
    }
  }
})
