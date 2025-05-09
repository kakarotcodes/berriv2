// main/utils/animateViewTransition.ts
import { BrowserWindow, ipcMain, screen } from 'electron'
import { animateWindowResize } from './windowResize'

// types
import { ViewType } from '../../types/types'
import { prefs } from './prefs'

export function registerViewHandlers(mainWindow: BrowserWindow) {
  const PILL_OFFSET = 20

  ipcMain.handle('animate-view-transition', async (_event, view: ViewType) => {
    const viewDimensions = {
      default: { width: 512, height: 288 },
      pill: { width: 100, height: 48 },
      hover: { width: 240, height: 240 },
      expanded: { width: 800, height: 600 }
    }

    const dimensions = viewDimensions[view as keyof typeof viewDimensions]
    if (!dimensions || !mainWindow) return

    // Clear log to see only relevant output
    console.clear();
    console.log(`Transitioning to ${view} view`);

    // Get the mouse cursor position (most reliable for multi-monitor)
    const cursorPosition = screen.getCursorScreenPoint();
    console.log("Cursor position:", cursorPosition);

    // Find the display the cursor is currently on
    const currentDisplay = screen.getDisplayNearestPoint(cursorPosition);
    console.log("Current display:", currentDisplay.id, "with bounds:", currentDisplay.bounds);

    // Get the work area (screen minus taskbar/dock)
    const { workArea } = currentDisplay;
    console.log("Work area:", workArea);

    let targetX: number
    let targetY: number

    switch (view) {
      case 'pill':
        const pillWidth = dimensions.width
        const offset = pillWidth - PILL_OFFSET
        targetX = workArea.x + workArea.width - offset
        const savedY = prefs.get('pillY') as number
        const minY = workArea.y
        const maxY = workArea.y + workArea.height - dimensions.height
        targetY = Math.min(maxY, Math.max(minY, savedY || workArea.y + 130))
        break

      case 'default':
        // Force to bottom right of current display with exactly 20px margin
        targetX = workArea.x + workArea.width - dimensions.width - 20
        targetY = workArea.y + workArea.height - dimensions.height - 20
        
        // Log the target position
        console.log("Default view target position:", {targetX, targetY});
        break

      default:
        targetX = workArea.x + workArea.width - dimensions.width
        targetY = workArea.y + 130
        break
    }

    return new Promise((resolve) => {
      // Execute the resize and position change immediately
      mainWindow.setBounds({
        x: targetX,
        y: targetY,
        width: dimensions.width,
        height: dimensions.height
      }, false); // false = don't animate

      // For debugging - log the window position after setting
      const newBounds = mainWindow.getBounds();
      console.log("Window actual position after setting:", newBounds);

      // Very simple display change handler that just repositions
      const handleDisplayChanges = () => {
        try {
          // Get current cursor position
          const cursorPos = screen.getCursorScreenPoint();
          const display = screen.getDisplayNearestPoint(cursorPos);
          const area = display.workArea;
          
          if (view === 'default') {
            // Default view - bottom right with 20px margins
            mainWindow.setPosition(
              area.x + area.width - dimensions.width - 20,
              area.y + area.height - dimensions.height - 20
            );
          } else if (view === 'pill') {
            // Pill - right edge with slight offset
            mainWindow.setPosition(
              area.x + area.width - (dimensions.width - PILL_OFFSET),
              Math.min(
                area.y + area.height - dimensions.height,
                Math.max(area.y, prefs.get('pillY') as number || area.y + 130)
              )
            );
          }
        } catch (error) {
          console.error('Error in display change handler:', error);
        }
      };

      // Add event listeners for display changes
      screen.on('display-metrics-changed', handleDisplayChanges);
      screen.on('display-added', handleDisplayChanges);
      screen.on('display-removed', handleDisplayChanges);

      // Resolve immediately rather than trying to verify position
      resolve(true);
      
      // Remove event listeners after a short delay (they'll be re-added on next transition)
      setTimeout(() => {
        screen.off('display-metrics-changed', handleDisplayChanges);
        screen.off('display-added', handleDisplayChanges);
        screen.off('display-removed', handleDisplayChanges);
      }, 500);
    });
  });
}
