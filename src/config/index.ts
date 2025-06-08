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
    windowSizes: {
      pill: { width: number; height: number }
      hover: { width: number; height: number }
      default: { width: number; height: number }
    }
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
    animationDuration: 300,
    windowSizes: {
      pill: { width: 50, height: 200 },
      hover: { width: 800, height: 500 },
      default: { width: 400, height: 288 }
    }
  }
}

export default config

// Helper functions
export function isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
  return config.features[feature]
}

export function getWindowSize(type: keyof AppConfig['ui']['windowSizes']) {
  return config.ui.windowSizes[type]
}
