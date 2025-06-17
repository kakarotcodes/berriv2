import { BrowserWindow, app } from 'electron'
import { PROTOCOL } from '../../../constants/constants'

export interface ProtocolData {
  url: string
  tokens?: { access: string; refresh?: string } | null
  error?: string
}

// Handle deeplink URLs for OAuth authentication
export function handleProtocolUrl(url: string, mainWindow: BrowserWindow | null): void {
  console.log('Protocol URL received:', url)

  try {
    // ① Parse tokens from the URL
    const parsed = new URL(url)
    const access = parsed.searchParams.get('access')
    const refresh = parsed.searchParams.get('refresh')
    const error = parsed.searchParams.get('error')

    console.log('access', access)
    console.log('refresh', refresh)
    console.log('error', error)

    // ② Handle authentication response
    if (access || error) {
      console.log('Authentication response received')

      // ③ Persist tokens securely (for now, store in memory - TODO: use keytar/secure storage)
      if (access) {
        ;(
          global as { authTokens?: { access: string; refresh?: string; timestamp: number } }
        ).authTokens = {
          access,
          refresh: refresh || undefined,
          timestamp: Date.now()
        }
        console.log('Tokens stored successfully')
      }

      // ④ Forward to renderer so React can update UI
      if (mainWindow) {
        mainWindow.webContents.send('protocol-url', {
          url,
          tokens: access ? { access, refresh } : null,
          error
        })
      }

      // Note: No need to close auth window since we're using external browser
    } else {
      // Handle other protocol URLs (non-auth)
      if (mainWindow) {
        mainWindow.webContents.send('protocol-url', { url })
      }
    }
  } catch (parseError) {
    console.error('Error parsing protocol URL:', parseError)
    if (mainWindow) {
      mainWindow.webContents.send('protocol-url', {
        url,
        error: 'Failed to parse authentication response'
      })
    }
  }

  // ⑤ Focus the main window
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
}

// Helper function to setup protocol handling for the app
export function setupProtocolHandling(mainWindow: BrowserWindow | null): void {
  // Handle protocol URLs on Windows/Linux
  app.on('second-instance', (_event: any, commandLine: string[]) => {
    // Find protocol URL in command line arguments
    const protocolUrl = commandLine.find((arg) => arg.startsWith(`${PROTOCOL}://`))
    if (protocolUrl) {
      handleProtocolUrl(protocolUrl, mainWindow)
    }

    // Focus the main window
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  // Handle protocol URLs on macOS
  app.on('open-url', (event: any, url: string) => {
    event.preventDefault()
    handleProtocolUrl(url, mainWindow)
  })

  console.log('[AUTH] Protocol handlers registered')
}
