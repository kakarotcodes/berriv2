interface AppConfig {
  isDevelopment: boolean
  isProduction: boolean
  version: string
  features: {
    notes: boolean
    clipboard: boolean
    calendar: boolean
    mail: boolean
  }
  ui: {
    defaultView: string
    animationDuration: number
  }
}

const config: AppConfig = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  version: process.env.npm_package_version || '1.0.0',
  features: {
    notes: true,
    clipboard: true,
    calendar: true,
    mail: false // Not implemented yet
  },
  ui: {
    defaultView: 'pill',
    animationDuration: 300
  }
}

export default config

// Helper functions
export function isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
  return config.features[feature]
}

// Window dimensions are managed in src/constants/constants.ts
