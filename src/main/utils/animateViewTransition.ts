// main/utils/animateViewTransition.ts
import { BrowserWindow, ipcMain, screen } from 'electron'
import { animateWindowResize } from './windowResize'

export function registerViewHandlers(mainWindow: BrowserWindow) {
  ipcMain.handle('animate-view-transition', async (_event, view: string) => {
    const viewDimensions = {
      default: { width: 512, height: 288 },
      pill: { width: 100, height: 48 },
      hover: { width: 240, height: 240 },
      expanded: { width: 800, height: 600 }
    }

    const dimensions = viewDimensions[view as keyof typeof viewDimensions]
    if (!dimensions || !mainWindow) return

    // Get display metrics
    const primaryDisplay = screen.getPrimaryDisplay()
    const { workArea } = primaryDisplay

    // Calculate positions
    let targetX = workArea.x + workArea.width - dimensions.width // Right edge
    let targetY = workArea.y + 130 // 130px top margin

    // Special handling for default view (keep original positioning)
    if (view === 'default') {
      targetX = workArea.x + workArea.width - dimensions.width - 20 // 20px right margin
      targetY = workArea.y + workArea.height - dimensions.height - 20 // 20px bottom margin
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

      // Screen change handler for right-edge sticking
      const handleScreenChange = () => {
        const updatedDisplay = screen.getPrimaryDisplay()
        const newX = updatedDisplay.workArea.x + updatedDisplay.workArea.width - dimensions.width
        mainWindow.setPosition(newX, targetY)
      }

      // Add event listeners for display changes
      screen.on('display-metrics-changed', handleScreenChange)
      screen.on('display-added', handleScreenChange)
      screen.on('display-removed', handleScreenChange)

      // Completion check
      const verifyPosition = () => {
        const [currentX, currentY] = mainWindow.getPosition()
        const expectedX =
          screen.getPrimaryDisplay().workArea.x +
          screen.getPrimaryDisplay().workArea.width -
          dimensions.width

        if (Math.abs(currentX - expectedX) <= 2 && currentY === targetY) {
          screen.off('display-metrics-changed', handleScreenChange)
          screen.off('display-added', handleScreenChange)
          screen.off('display-removed', handleScreenChange)
          resolve(true)
        } else {
          setTimeout(verifyPosition, 50)
        }
      }

      verifyPosition()
    })
  })
}
