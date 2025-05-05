export {}

declare global {
  interface Window {
    electron: typeof import('@electron-toolkit/preload').electronAPI
  }
}
