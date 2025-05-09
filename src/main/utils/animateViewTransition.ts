// main/utils/animateViewTransition.ts
import { BrowserWindow, ipcMain, screen } from 'electron'
import { animateWindowResize } from './windowResize'

export function registerViewHandlers(mainWindow: BrowserWindow) {
  ipcMain.handle('animate-view-transition', async (_event, view: string) => {
    const dimensions = {
      default: { width: 512, height: 288 },
      pill: { width: 100, height: 48 },
      hover: { width: 240, height: 240 },
      expanded: { width: 800, height: 600 }
    }[view]

    if (!dimensions || !mainWindow) return

    // Calculate position based on view
    const display = screen.getDisplayMatching(mainWindow.getBounds())
    const { workArea } = display
    let targetX = mainWindow.getPosition()[0]
    let targetY = mainWindow.getPosition()[1]

    if (view === 'default') {
      // Position for default view (20px from right, original Y position)
      targetX = workArea.x + workArea.width - dimensions.width - 20
      targetY = workArea.y + workArea.height - dimensions.height - 20
    } else if (view === 'pill') {
      // Center vertically for pill view
      targetY = workArea.y + (workArea.height - dimensions.height) / 2
    }

    return new Promise((resolve) => {
      animateWindowResize({
        window: mainWindow,
        targetWidth: dimensions.width,
        targetHeight: dimensions.height,
        targetX,
        targetY,
        duration: 300
      })

      // More accurate completion detection
      const checkCompletion = () => {
        const [currentWidth, currentHeight] = mainWindow!.getSize()
        if (currentWidth === dimensions.width && currentHeight === dimensions.height) {
          resolve(true)
        } else {
          setTimeout(checkCompletion, 50)
        }
      }
      checkCompletion()
    })
  })
}
