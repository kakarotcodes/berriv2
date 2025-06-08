/**
 * Shared validation utilities
 */

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * Validation state for chaining validations
 */
export interface ValidationState {
  errors: string[]
}

/**
 * Create a new validation state
 */
export function createValidationState(): ValidationState {
  return { errors: [] }
}

/**
 * Check if value is required (not null, undefined, or empty string)
 */
export function required(state: ValidationState, value: unknown, fieldName: string): ValidationState {
  if (value === null || value === undefined || value === '') {
    state.errors.push(`${fieldName} is required`)
  }
  return state
}

/**
 * Check string length
 */
export function stringLength(state: ValidationState, value: string, min: number, max: number, fieldName: string): ValidationState {
  if (typeof value === 'string') {
    if (value.length < min) {
      state.errors.push(`${fieldName} must be at least ${min} characters`)
    }
    if (value.length > max) {
      state.errors.push(`${fieldName} must be no more than ${max} characters`)
    }
  }
  return state
}

/**
 * Check if value is a valid email
 */
export function email(state: ValidationState, value: string, fieldName: string): ValidationState {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (typeof value === 'string' && !emailRegex.test(value)) {
    state.errors.push(`${fieldName} must be a valid email address`)
  }
  return state
}

/**
 * Check if value is a valid URL
 */
export function url(state: ValidationState, value: string, fieldName: string): ValidationState {
  try {
    new URL(value)
  } catch {
    state.errors.push(`${fieldName} must be a valid URL`)
  }
  return state
}

/**
 * Custom validation function
 */
export function custom(state: ValidationState, predicate: boolean, errorMessage: string): ValidationState {
  if (!predicate) {
    state.errors.push(errorMessage)
  }
  return state
}

/**
 * Get validation result from state
 */
export function getResult(state: ValidationState): ValidationResult {
  return {
    isValid: state.errors.length === 0,
    errors: [...state.errors]
  }
}

/**
 * Quick validation functions
 */
export const validate = {
  /**
   * Validate note content
   */
  noteContent(content: string): ValidationResult {
    const state = createValidationState()
    required(state, content, 'Content')
    stringLength(state, content, 1, 50000, 'Content')
    return getResult(state)
  },

  /**
   * Validate note title
   */
  noteTitle(title: string): ValidationResult {
    const state = createValidationState()
    stringLength(state, title, 0, 200, 'Title')
    return getResult(state)
  },

  /**
   * Validate clipboard content
   */
  clipboardContent(content: string): ValidationResult {
    const state = createValidationState()
    required(state, content, 'Clipboard content')
    stringLength(state, content, 1, 10000, 'Clipboard content')
    return getResult(state)
  }
} 