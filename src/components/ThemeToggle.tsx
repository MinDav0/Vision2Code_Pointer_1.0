import { Sun, Moon } from 'lucide-react'
import { useThemeStore } from '../stores/themeStore'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore()

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-l-bg-2 dark:bg-d-bg-2 border border-border-l dark:border-border-d hover:bg-l-bg-hover dark:hover:bg-d-bg-hover transition-colors"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon className="w-4 h-4 text-l-text-1 dark:text-d-text-1" />
      ) : (
        <Sun className="w-4 h-4 text-l-text-1 dark:text-d-text-1" />
      )}
    </button>
  )
}
