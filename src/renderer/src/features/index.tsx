import React, { ReactNode } from 'react'

export interface FeatureModule {
  id: string
  name: string
  icon: ReactNode
  component: React.ComponentType
  initialize?: () => Promise<void>
  cleanup?: () => void
}

// Feature imports
import ClipboardViewHover from './clipboard/views/ClipboardViewHover'
import NotesViewHover from './notes/views/NotesViewHover'
import CalendarViewHover from './calendar/views/CalendarViewHover'

// Feature definitions
export const clipboardFeature: FeatureModule = {
  id: 'clipboard',
  name: 'Clipboard',
  icon: null, // Will be set by the consuming component
  component: ClipboardViewHover
}

export const notesFeature: FeatureModule = {
  id: 'notes',
  name: 'Notes',
  icon: null, // Will be set by the consuming component
  component: NotesViewHover
}

export const calendarFeature: FeatureModule = {
  id: 'calendar',
  name: 'Calendar',
  icon: null, // Will be set by the consuming component
  component: CalendarViewHover
}

export const mailFeature: FeatureModule = {
  id: 'mail',
  name: 'Mail',
  icon: null, // Will be set by the consuming component
  component: () => <div>Mail View</div>
}

// Registry of all features
export const features: FeatureModule[] = [
  clipboardFeature,
  notesFeature,
  calendarFeature,
  mailFeature
]

// Helper to get feature by id
export function getFeatureById(id: string): FeatureModule | undefined {
  return features.find((feature) => feature.id === id)
}

// Initialize all features
export async function initializeFeatures(): Promise<void> {
  console.log('[FEATURES] Initializing all features...')

  for (const feature of features) {
    try {
      if (feature.initialize) {
        await feature.initialize()
        console.log(`[FEATURES] Initialized ${feature.name}`)
      }
    } catch (error) {
      console.error(`[FEATURES] Failed to initialize ${feature.name}:`, error)
    }
  }

  console.log('[FEATURES] All features initialized')
}

// Cleanup all features
export function cleanupFeatures(): void {
  console.log('[FEATURES] Cleaning up all features...')

  for (const feature of features) {
    try {
      if (feature.cleanup) {
        feature.cleanup()
        console.log(`[FEATURES] Cleaned up ${feature.name}`)
      }
    } catch (error) {
      console.error(`[FEATURES] Failed to cleanup ${feature.name}:`, error)
    }
  }

  console.log('[FEATURES] All features cleaned up')
}
