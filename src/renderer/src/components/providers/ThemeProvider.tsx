import React, { useEffect } from 'react'
import { useThemeStore } from '@/stores/themeStore'

interface ThemeProviderProps {
  children: React.ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { mode, updateSystemTheme, applyTheme } = useThemeStore()

  useEffect(() => {
    // Initialize theme system
    const initializeTheme = () => {
      // Get system theme preference
      const getSystemTheme = (): boolean => {
        // Try Electron API first
        if (window.electronAPI?.theme?.getSystemTheme) {
          return window.electronAPI.theme.getSystemTheme()
        }
        // Fallback to browser media query
        return window.matchMedia('(prefers-color-scheme: dark)').matches
      }

      const systemIsDark = getSystemTheme()
      updateSystemTheme(systemIsDark)
      applyTheme(mode, systemIsDark)
    }

    // Initialize on mount
    initializeTheme()

    // Set up system theme change listeners
    const cleanupFunctions: Array<() => void> = []

    // Listen for browser media query changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleMediaQueryChange = (e: MediaQueryListEvent) => {
      updateSystemTheme(e.matches)
    }

    mediaQuery.addEventListener('change', handleMediaQueryChange)
    cleanupFunctions.push(() => {
      mediaQuery.removeEventListener('change', handleMediaQueryChange)
    })

    // Listen for Electron system theme changes
    if (window.electronAPI?.theme?.onSystemThemeChange) {
      const cleanup = window.electronAPI.theme.onSystemThemeChange((isDark: boolean) => {
        updateSystemTheme(isDark)
      })
      if (cleanup) {
        cleanupFunctions.push(cleanup)
      }
    }

    // Cleanup on unmount
    return () => {
      cleanupFunctions.forEach((cleanup) => cleanup())
    }
  }, [mode, updateSystemTheme, applyTheme])

  return <>{children}</>
}

export default ThemeProvider
