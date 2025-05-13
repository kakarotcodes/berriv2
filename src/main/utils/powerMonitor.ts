import { BrowserWindow, powerMonitor } from 'electron'

// utils
import { prefs } from './prefs'

// types
import { ViewType } from '../../types/types'

// Handle sleep/wake events to preserve view state
export function setupPowerMonitoring(window: BrowserWindow) {
  // Listen for system about to sleep
  powerMonitor.on('suspend', () => {
    if (!window || window.isDestroyed()) return

    // Save window position
    const [x, y] = window.getPosition()
    prefs.set('windowPosition', { x, y })

    // Request current view from renderer
    window.webContents.send('request-current-view')
    console.log('System suspending: requesting current view')
  })

  // Listen for system wake up
  powerMonitor.on('resume', () => {
    if (!window || window.isDestroyed()) return

    // Restore view after sleep
    const view = prefs.get('lastViewAfterSleep') as ViewType | undefined
    if (view) {
      console.log('System resuming: restoring view', view)
      window.webContents.send('resume-view', view)
    }
  })
}
