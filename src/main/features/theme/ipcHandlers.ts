import { ipcMain, BrowserWindow, nativeTheme } from 'electron'

export function registerThemeHandlers(mainWindow: BrowserWindow) {
  // Theme colors matching your theme.css
  const themeColors = {
    light: '#ffffff', // rgb(255 255 255) - matches --color-surface-canvas light
    dark: '#1e1e1e'   // rgb(30 30 30) - matches --color-surface-canvas dark
  }

  // Function to update window background color
  const updateWindowBackground = (isDark: boolean) => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    
    const backgroundColor = isDark ? themeColors.dark : themeColors.light
    
    // Update the window background color
    mainWindow.setBackgroundColor(backgroundColor)
    
    console.log(`[THEME] Window background updated to: ${backgroundColor} (${isDark ? 'dark' : 'light'} theme)`)
  }

  // Get current system theme
  ipcMain.handle('theme:get-system-theme', () => {
    return nativeTheme.shouldUseDarkColors
  })

  // Set theme (called from renderer when theme changes)
  ipcMain.on('theme:set-theme', (_event, theme: 'light' | 'dark') => {
    const isDark = theme === 'dark'
    updateWindowBackground(isDark)
  })

  // Listen for system theme changes
  nativeTheme.on('updated', () => {
    const isDark = nativeTheme.shouldUseDarkColors
    
    // Send theme change to renderer
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('theme:system-changed', isDark)
    }
    
    // Update window background
    updateWindowBackground(isDark)
    
    console.log(`[THEME] System theme changed to: ${isDark ? 'dark' : 'light'}`)
  })

  // Initialize with current system theme
  const initialIsDark = nativeTheme.shouldUseDarkColors
  updateWindowBackground(initialIsDark)
  
  console.log('[THEME] Theme handlers registered successfully')
} 