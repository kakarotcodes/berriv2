import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeStore {
  mode: ThemeMode
  resolvedTheme: 'light' | 'dark'
  systemTheme: 'light' | 'dark'

  // Actions
  setMode: (mode: ThemeMode) => void
  toggleTheme: () => void
  updateSystemTheme: (isDark: boolean) => void

  // Internal method for applying theme
  applyTheme: (mode?: ThemeMode, systemIsDark?: boolean) => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      mode: 'system',
      resolvedTheme: 'dark', // Will be updated on mount
      systemTheme: 'dark', // Will be updated on mount

      setMode: (mode) => {
        set({ mode })
        get().applyTheme(mode)
      },

      toggleTheme: () => {
        const { mode } = get()
        // Cycle through: light → dark → system → light
        const newMode: ThemeMode = mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light'
        get().setMode(newMode)
      },

      updateSystemTheme: (isDark) => {
        const systemTheme = isDark ? 'dark' : 'light'
        set({ systemTheme })
        get().applyTheme(undefined, isDark)
      },

      applyTheme: (mode, systemIsDark) => {
        const state = get()
        const currentMode = mode || state.mode
        const currentSystemIsDark =
          systemIsDark !== undefined ? systemIsDark : state.systemTheme === 'dark'

        // Determine resolved theme
        const resolvedTheme =
          currentMode === 'system' ? (currentSystemIsDark ? 'dark' : 'light') : currentMode

        // Apply theme to DOM
        const documentElement = document.documentElement
        if (resolvedTheme === 'dark') {
          documentElement.classList.add('dark')
        } else {
          documentElement.classList.remove('dark')
        }

        // Update state
        set({ resolvedTheme })

        // Optional: Notify Electron main process about theme change
        if (window.electronAPI?.theme?.setTheme) {
          window.electronAPI.theme.setTheme(resolvedTheme)
        }
      }
    }),
    {
      name: 'berri-theme-store',
      // Only persist the user's mode preference
      partialize: (state) => ({ mode: state.mode }),
      // Rehydrate and apply theme on load
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Apply theme after rehydration
          setTimeout(() => {
            state.applyTheme()
          }, 0)
        }
      }
    }
  )
)
