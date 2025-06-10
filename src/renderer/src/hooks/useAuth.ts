import { useState, useEffect, useCallback } from 'react'

interface AuthTokens {
  access: string
  refresh?: string
  timestamp?: number
}

interface AuthState {
  isAuthenticated: boolean
  tokens: AuthTokens | null
  isLoading: boolean
  error: string | null
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    tokens: null,
    isLoading: true,
    error: null
  })

  // Initialize auth state from stored tokens
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const response = await window.electronAPI.auth.getTokens()
        if (response.success && response.tokens) {
          setAuthState({
            isAuthenticated: true,
            tokens: response.tokens,
            isLoading: false,
            error: null
          })
        } else {
          setAuthState((prev) => ({
            ...prev,
            isLoading: false
          }))
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error)
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to initialize authentication'
        }))
      }
    }

    initializeAuth()
  }, [])

  // Listen for auth callbacks (deep links)
  useEffect(() => {
    const cleanup = window.electronAPI.auth.onAuthCallback((data) => {
      console.log('Auth callback received:', data)

      if (data.tokens) {
        // Successful authentication
        setAuthState({
          isAuthenticated: true,
          tokens: data.tokens,
          isLoading: false,
          error: null
        })
        console.log('User authenticated successfully')
      } else if (data.error) {
        // Authentication error
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: data.error || 'Authentication failed'
        }))
        console.error('Authentication error:', data.error)
      }
    })

    return cleanup
  }, [])

  // Login function
  const login = useCallback(async () => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }))
      const response = await window.electronAPI.auth.openGoogleLogin()

      if (!response.success) {
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: response.error || 'Failed to open login window'
        }))
      }
      // Note: isLoading will be set to false when the auth callback is received
    } catch (error) {
      console.error('Login failed:', error)
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed'
      }))
    }
  }, [])

  // Logout function
  const logout = useCallback(async () => {
    try {
      const response = await window.electronAPI.auth.logout()
      if (response.success) {
        setAuthState({
          isAuthenticated: false,
          tokens: null,
          isLoading: false,
          error: null
        })
        console.log('User logged out successfully')
      } else {
        console.error('Logout failed:', response.error)
      }
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }, [])

  return {
    ...authState,
    login,
    logout
  }
}
