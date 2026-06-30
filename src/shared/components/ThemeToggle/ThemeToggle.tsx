import { memo, useState, useCallback } from 'react'
import { Sun, Moon } from 'lucide-react'

function getCurrentTheme(): 'light' | 'dark' {
  return (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') ?? 'light'
}

/**
 * Toggles between light and dark theme.
 * Writes to both the DOM attribute (instant visual change) and localStorage (persists across sessions).
 * No React context needed — the CSS variable system handles propagation.
 * aria-label updates dynamically so screen readers announce the current action, not the current state.
 */
export const ThemeToggle = memo(function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(getCurrentTheme)

  const toggle = useCallback(() => {
    const next = theme === 'light' ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('theme', next)
    setTheme(next)
  }, [theme])

  const ariaLabel = theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'

  return (
    <button type="button" className="theme-toggle" onClick={toggle} aria-label={ariaLabel}>
      {theme === 'light' ? (
        <Moon size={15} aria-hidden="true" />
      ) : (
        <Sun size={15} aria-hidden="true" />
      )}
    </button>
  )
})
