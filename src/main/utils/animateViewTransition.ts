// main/utils/animateViewTransition.ts
import { BrowserWindow, ipcMain, screen } from 'electron'
import { prefs } from './prefs'

// types
import { ViewType } from '../../types/types'

export function registerViewHandlers(mainWindow: BrowserWindow) {
  // View dimensions
  const viewDimensions = {
    default: { width: 512, height: 288 },
    pill: { width: 100, height: 48 },
    hover: { width: 240, height: 240 },
    expanded: { width: 800, height: 600 }
  };
  
  // Handle IPC calls for view transitions
  ipcMain.handle('animate-view-transition', async (_event, view: ViewType) => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      return false;
    }
    
    try {
      // 1. Get target dimensions
      const dimensions = viewDimensions[view];
      if (!dimensions) {
        console.error('Invalid view type:', view);
        return false;
      }
      
      // 2. Get current cursor position to determine current display
      const cursorPos = screen.getCursorScreenPoint();
      const currentDisplay = screen.getDisplayNearestPoint(cursorPos);
      const workArea = currentDisplay.workArea;
      
      console.log(`Transitioning to ${view} view on display:`, currentDisplay.id);
      
      // 3. Calculate target position based on view type
      let targetX, targetY;
      
      if (view === 'default') {
        // Default view: Bottom right with 20px margins
        targetX = workArea.x + workArea.width - dimensions.width - 20;
        targetY = workArea.y + workArea.height - dimensions.height - 20;
      } 
      else if (view === 'pill') {
        // Pill view: Right edge with significant offset to hide most of it
        // We want most of the pill to be off-screen, with just a portion visible
        const pillOffset = 80; // Increase offset so more of pill is off-screen
        targetX = workArea.x + workArea.width - pillOffset; // This puts most of pill off-screen
        
        // Use saved Y position if available and valid
        const savedY = prefs.get('pillY') as number | undefined;
        const minY = workArea.y;
        const maxY = workArea.y + workArea.height - dimensions.height;
        
        targetY = savedY !== undefined 
          ? Math.min(maxY, Math.max(minY, savedY)) 
          : workArea.y + 130;
      }
      else if (view === 'hover') {
        // Hover view: Position it so it's fully visible on screen
        // Starting from the same position as the pill, but adjusted to be fully visible
        
        // For X position: Position it so it's fully within the screen
        // Offset from right edge by its full width
        targetX = workArea.x + workArea.width - dimensions.width - 20;
        
        // Use the same Y position as the pill
        const savedY = prefs.get('pillY') as number | undefined;
        const minY = workArea.y;
        const maxY = workArea.y + workArea.height - dimensions.height;
        
        targetY = savedY !== undefined 
          ? Math.min(maxY, Math.max(minY, savedY)) 
          : workArea.y + 130;
          
        console.log("Hover view positioned fully on screen:", {targetX, targetY});
      }
      else {
        // Other views: Centered in display
        targetX = workArea.x + (workArea.width - dimensions.width) / 2;
        targetY = workArea.y + (workArea.height - dimensions.height) / 2;
      }
      
      console.log(`Target position: x=${targetX}, y=${targetY}, width=${dimensions.width}, height=${dimensions.height}`);
      
      // 4. Set the window size and position (animation handled by the OS)
      mainWindow.setBounds({
        x: Math.round(targetX),
        y: Math.round(targetY),
        width: dimensions.width,
        height: dimensions.height
      }, true); // true = animate
      
      return true;
    }
    catch (error) {
      console.error('Error during view transition:', error);
      return false;
    }
  });
}
