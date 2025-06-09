/**
 * Shared API utilities for IPC communication
 */

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Helper to wrap API calls with error handling
 */
export async function withErrorHandling<T>(operation: () => Promise<T>): Promise<ApiResponse<T>> {
  try {
    const data = await operation()
    return { success: true, data }
  } catch (error) {
    console.error('API Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}
