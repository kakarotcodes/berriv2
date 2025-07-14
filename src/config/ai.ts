export const AI_CONFIG = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || 'AIzaSyBXSsWs7DV3xopNjvHQI0uLA7LxYueR83A',
  MODEL: 'gemini-2.0-flash-exp',
  SUMMARIZATION: {
    MAX_INPUT_LENGTH: 10000,
    SUMMARY_LENGTH: 'medium', // short, medium, long
    INCLUDE_KEY_POINTS: true,
    PRESERVE_FORMAT: false
  },
  OCR: {
    MAX_IMAGE_SIZE: 20 * 1024 * 1024, // 20MB
    SUPPORTED_FORMATS: ['png', 'jpg', 'jpeg', 'webp', 'gif'],
    CREATE_NOTE_FROM_TEXT: true,
    MIN_TEXT_LENGTH: 10
  },
  RATE_LIMITING: {
    REQUESTS_PER_MINUTE: 15,
    CONCURRENT_REQUESTS: 3
  }
} as const

export type AISummaryLength = 'short' | 'medium' | 'long'

export interface SummarizationOptions {
  length?: AISummaryLength
  includeKeyPoints?: boolean
  preserveFormat?: boolean
}

export interface OCROptions {
  createNote?: boolean
  language?: string
  includeStructure?: boolean
}

export interface OCRResult {
  success: boolean
  text?: string
  confidence?: number
  error?: string
}