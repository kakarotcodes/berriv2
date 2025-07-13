import { ipcMain, BrowserWindow, nativeTheme } from 'electron'

export function registerThemeHandlers(mainWindow: BrowserWindow) {
  // Function to update window background color (now transparent for frosted glass effect)
  const updateWindowBackground = (isDark: boolean) => {
    if (!mainWindow || mainWindow.isDestroyed()) return

    // Keep background transparent for frosted glass effect
    mainWindow.setBackgroundColor('#00000000')

    console.log(
      `[THEME] Window background kept transparent for frosted glass effect (${isDark ? 'dark' : 'light'} theme)`
    )
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
