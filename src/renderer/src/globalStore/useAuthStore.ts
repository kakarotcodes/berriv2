import { create } from 'zustand'

interface AuthTokens {
  access: string
  refresh?: string
  timestamp?: number
}

interface AuthState {
  isAuthenticated: boolean
  tokens: AuthTokens | null
  isInitialized: boolean
  error: string | null

  // Actions
  setAuthenticated: (authenticated: boolean) => void
  setTokens: (tokens: AuthTokens | null) => void
  setError: (error: string | null) => void
  setInitialized: (initialized: boolean) => void
  login: () => Promise<void>
  logout: () => Promise<void>
  initializeAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  isAuthenticated: false,
  tokens: null,
  isInitialized: false,
  error: null,

  // Simple setters
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setTokens: (tokens) => set({ tokens }),
  setError: (error) => set({ error }),
  setInitialized: (isInitialized) => set({ isInitialized }),

  // Initialize auth state from stored tokens
  initializeAuth: async () => {
    const { isInitialized } = get()
    
    if (isInitialized) {
      return // Already initialized
    }

    try {
      const response = await window.electronAPI.auth.getTokens()
      if (response.success && response.tokens) {
        set({
          isAuthenticated: true,
          tokens: response.tokens,
          isInitialized: true,
          error: null
        })
      } else {
        set({
          isAuthenticated: false,
          tokens: null,
          isInitialized: true,
          error: null
        })
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error)
      set({
        isAuthenticated: false,
        tokens: null,
        isInitialized: true,
        error: error instanceof Error ? error.message : 'Failed to initialize authentication'
      })
    }
  },

  // Login function
  login: async () => {
    try {
      set({ error: null })
      const response = await window.electronAPI.auth.openGoogleLogin()

      if (!response.success) {
        set({ error: response.error || 'Failed to open login window' })
      }
    } catch (error) {
      console.error('Login failed:', error)
      set({ error: error instanceof Error ? error.message : 'Login failed' })
    }
  },

  // Logout function
  logout: async () => {
    try {
      const response = await window.electronAPI.auth.logout()
      if (response.success) {
        set({
          isAuthenticated: false,
          tokens: null,
          error: null
        })
        console.log('User logged out successfully')
      } else {
        console.error('Logout failed:', response.error)
      }
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }
}))

// Setup auth callback listener (call this once in your app initialization)
export const setupAuthListener = () => {
  return window.electronAPI.auth.onAuthCallback((data) => {
    console.log('Auth callback received:', data)

    const store = useAuthStore.getState()

    if (data.tokens) {
      // Successful authentication
      store.setAuthenticated(true)
      store.setTokens(data.tokens)
      store.setInitialized(true)
      store.setError(null)
      console.log('User authenticated successfully')
    } else if (data.error) {
      // Authentication error
      store.setError(data.error || 'Authentication failed')
      console.error('Authentication error:', data.error)
    }
  })
}