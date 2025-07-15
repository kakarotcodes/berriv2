# Theme System Documentation

## Overview

The theme system provides a scalable, Apple HIG-compliant theming solution using Tailwind CSS 4.x with semantic color tokens. It uses space-separated RGB values for maximum compatibility with opacity utilities and supports light/dark themes with system preference detection and user preference persistence.

## Architecture

### Core Components

1. **Theme CSS** (`src/renderer/src/styles/theme.css`) - Defines semantic color tokens
2. **Theme Store** (`src/renderer/src/stores/themeStore.ts`) - Zustand store for theme state
3. **Theme Provider** (`src/renderer/src/components/providers/ThemeProvider.tsx`) - React context provider
4. **Theme Toggle** (`src/renderer/src/components/ui/ThemeToggle.tsx`) - UI component for theme switching
5. **Utilities** (`src/renderer/src/styles/utilities.css`) - Pre-built semantic utility classes

### Color System

The theme uses semantic color tokens based on Apple's Human Interface Guidelines with space-separated RGB values for optimal Tailwind CSS 4.x integration:

#### Surface Colors
- `--color-surface-canvas` - Main window background
- `--color-surface-primary` - Cards, panels, secondary backgrounds
- `--color-surface-secondary` - Tertiary backgrounds
- `--color-surface-elevated` - Modals, tooltips, floating elements

#### Text Colors
- `--color-text-primary` - Main content text
- `--color-text-secondary` - Supporting text
- `--color-text-tertiary` - Placeholder text
- `--color-text-secondary-60` - 60% opacity secondary text
- `--color-text-tertiary-24` - 24% opacity tertiary text

#### Border Colors
- `--color-border-primary` - Main borders and separators
- `--color-border-subtle` - Subtle dividers

#### Accent Colors
- `--color-accent-blue` - Primary actions (consistent across themes)
- `--color-accent-purple` - Secondary actions
- `--color-accent-pink` - Tertiary actions

#### Status Colors
- `--color-status-success` - Success states
- `--color-status-warning` - Warning states
- `--color-status-destructive` - Error/destructive actions

## Usage

### Basic Tailwind Classes

```tsx
// Surface backgrounds
<div className="bg-surface-canvas">     // Main window background
<div className="bg-surface-primary">    // Card background
<div className="bg-surface-secondary">  // Secondary background
<div className="bg-surface-elevated">   // Modal background

// Text colors
<h1 className="text-text-primary">      // Main heading
<p className="text-text-secondary">     // Supporting text
<span className="text-text-tertiary">   // Placeholder text

// Borders
<div className="border-border-primary">  // Main border
<div className="border-border-subtle">   // Subtle border

// Accents
<button className="bg-accent-blue">     // Primary button
<a className="text-accent-purple">      // Secondary link
<span className="text-accent-pink">     // Highlight text

// Status colors
<div className="bg-status-success">     // Success message
<div className="bg-status-warning">     // Warning message
<div className="bg-status-destructive"> // Error message
```

### Dynamic Opacity Utilities

With space-separated RGB values, you can use opacity modifiers:

```tsx
// Surface backgrounds with opacity
<div className="bg-surface-canvas/90">    // 90% opacity background
<div className="bg-surface-primary/50">   // 50% opacity background
<div className="bg-accent-blue/10">       // 10% opacity blue background

// Text colors with opacity
<p className="text-text-primary/80">      // 80% opacity text
<span className="text-accent-purple/60">  // 60% opacity accent text

// Border colors with opacity
<div className="border-border-primary/30"> // 30% opacity border
```

### Pre-built Utility Classes

```tsx
// Interactive elements
<button className="interactive btn-primary">Primary Button</button>
<button className="interactive btn-secondary">Secondary Button</button>
<button className="interactive btn-ghost">Ghost Button</button>
<button className="interactive btn-destructive">Destructive Button</button>

// Surface types
<div className="surface-base">      // Base surface
<div className="surface-raised">    // Raised surface with border
<div className="surface-elevated">  // Elevated surface with shadow
<div className="surface-card">      // Card with subtle shadow
<div className="surface-modal">     // Modal with prominent shadow

// Text hierarchy
<h1 className="text-heading">       // Heading text
<p className="text-body">           // Body text
<small className="text-caption">   // Caption text
<span className="text-disabled">   // Disabled text

// Form elements
<input className="input-base" />    // Base input styling

// Status messages
<div className="status-success">Success message</div>
<div className="status-warning">Warning message</div>
<div className="status-error">Error message</div>

// Accent text
<span className="accent-blue">Blue accent text</span>
<span className="accent-purple">Purple accent text</span>
<span className="accent-pink">Pink accent text</span>

// Separators
<div className="separator">         // Horizontal separator
<div className="separator-vertical"> // Vertical separator

// Scrollbars
<div className="scrollbar-thin">    // Thin themed scrollbar
```

### Theme Store Usage

```tsx
import { useThemeStore } from '@/globalStore'

function MyComponent() {
  const { mode, resolvedTheme, setMode, toggleTheme } = useThemeStore()
  
  return (
    <div>
      <p>Current mode: {mode}</p>
      <p>Resolved theme: {resolvedTheme}</p>
      
      <button onClick={() => setMode('light')}>Light</button>
      <button onClick={() => setMode('dark')}>Dark</button>
      <button onClick={() => setMode('system')}>System</button>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  )
}
```

### Theme Toggle Component

```tsx
import { ThemeToggle } from '@/components/ui'

function MyComponent() {
  return (
    <div>
      {/* Segmented control (default) */}
      <ThemeToggle />
      
      {/* Single toggle button */}
      <ThemeToggle variant="button" />
      
      {/* Dropdown selector */}
      <ThemeToggle variant="dropdown" />
      
      {/* Different sizes */}
      <ThemeToggle size="sm" />
      <ThemeToggle size="md" />
      <ThemeToggle size="lg" />
    </div>
  )
}
```

## Migration Guide

### Step 1: Replace Hardcoded Colors

**Before:**
```tsx
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
```

**After:**
```tsx
<div className="bg-surface-canvas text-text-primary">
```

### Step 2: Use Semantic Utilities

**Before:**
```tsx
<button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
```

**After:**
```tsx
<button className="btn-primary px-4 py-2 rounded">
```

### Step 3: Update Border and Shadow Colors

**Before:**
```tsx
<div className="border border-gray-300 dark:border-gray-700 shadow-md">
```

**After:**
```tsx
<div className="surface-card">
```

### Step 4: Use Status Colors

**Before:**
```tsx
<div className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
```

**After:**
```tsx
<div className="status-success">
```

## Best Practices

1. **Use Semantic Colors**: Always use semantic tokens instead of hardcoded colors
2. **Consistent Hierarchy**: Use text hierarchy classes for proper information architecture
3. **Interactive States**: Use the `interactive` class for hover/focus states
4. **Surface Elevation**: Use appropriate surface classes for visual hierarchy
5. **Accessibility**: The theme system maintains WCAG contrast ratios automatically

## Electron Integration

The theme system automatically:
- Detects system theme preference on startup
- Listens for system theme changes
- Persists user theme preference
- Notifies the Electron main process of theme changes

## Customization

### Adding New Colors

To add new semantic colors, update the theme CSS using space-separated RGB values:

```css
@theme {
  --color-brand-primary: 255 107 53;   /* #FF6B35 */
  --color-brand-secondary: 0 78 137;   /* #004E89 */
}
```

This enables opacity utilities like `bg-brand-primary/20` automatically.

### Creating Custom Utilities

Add custom utility classes in `utilities.css`:

```css
.btn-brand {
  @apply bg-brand-primary hover:bg-brand-primary/90 text-white font-medium interactive;
}
```

### Theme Variants

The system supports easy extension for new theme variants:

```css
.theme-high-contrast {
  --color-text-secondary: var(--color-text-primary);
  --color-border-primary: var(--color-text-primary);
}
```

## Troubleshooting

### Theme Not Applying
- Ensure `ThemeProvider` wraps your app
- Check that theme CSS is imported before component CSS
- Verify browser/system theme detection is working

### Colors Not Updating
- Confirm you're using semantic color classes
- Check that the theme store is properly initialized
- Verify no hardcoded colors are overriding theme colors

### Performance Issues
- Theme switching is CSS-only and should be instant
- If experiencing lag, check for JavaScript-based style updates
- Ensure no unnecessary re-renders on theme changes

## Support

For questions or issues with the theme system:
1. Check this documentation
2. Review the theme store implementation
3. Verify color token definitions
4. Test theme switching functionality

The theme system is designed to be scalable and maintainable. Follow the semantic naming conventions and use the provided utilities for consistent theming across your application. 