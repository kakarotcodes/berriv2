import React from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useThemeStore, type ThemeMode } from '@/stores/themeStore'

interface ThemeToggleProps {
  variant?: 'dropdown' | 'segmented' | 'button'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'segmented',
  size = 'md',
  className = ''
}) => {
  const { mode, setMode } = useThemeStore()

  const themes: Array<{
    key: ThemeMode
    label: string
    icon: typeof Sun
  }> = [
    { key: 'light', label: 'Light', icon: Sun },
    { key: 'dark', label: 'Dark', icon: Moon },
    { key: 'system', label: 'System', icon: Monitor }
  ]

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  }

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18
  }

  if (variant === 'button') {
    return (
      <button
        onClick={() => {
          const { toggleTheme } = useThemeStore.getState()
          toggleTheme()
        }}
        className={`
          flex items-center gap-2 rounded-lg font-medium transition-colors
          bg-surface-primary hover:bg-surface-secondary text-text-primary
          ${sizeClasses[size]} ${className}
        `}
        title="Toggle theme"
      >
        {React.createElement(themes.find((t) => t.key === mode)?.icon || Sun, {
          size: iconSizes[size]
        })}
        <span className="capitalize">{mode}</span>
      </button>
    )
  }

  if (variant === 'dropdown') {
    return (
      <div className={`relative ${className}`}>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as ThemeMode)}
          className={`
            appearance-none rounded-lg border font-medium transition-colors
            bg-surface-primary hover:bg-surface-secondary text-text-primary
            border-border-primary focus:border-accent-blue focus:outline-none
            ${sizeClasses[size]} pr-8
          `}
        >
          {themes.map(({ key, label }) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    )
  }

  // Default segmented control
  return (
    <div className={`flex bg-surface-secondary rounded-lg p-1 ${className}`}>
      {themes.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => setMode(key)}
          className={`
            flex items-center gap-2 rounded-md font-medium transition-colors
            ${sizeClasses[size]}
            ${
              mode === key
                ? 'bg-surface-elevated text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-primary/50'
            }
          `}
          title={`Switch to ${label} theme`}
        >
          <Icon size={iconSizes[size]} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  )
}

export default ThemeToggle
