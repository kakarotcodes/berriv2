export const AI_CONFIG = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || 'AIzaSyBrWgn-PV0vTs_VbVbsQXQBbzUJby4QOAQ',
  MODEL: 'gemini-2.0-flash-exp',
  SUMMARIZATION: {
    MAX_INPUT_LENGTH: 10000,
    SUMMARY_LENGTH: 'medium', // short, medium, long
    INCLUDE_KEY_POINTS: true,
    PRESERVE_FORMAT: false
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
