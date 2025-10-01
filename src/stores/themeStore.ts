import { create } from 'zustand'

export type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  initializeTheme: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'dark',
  
  toggleTheme: () => {
    const newTheme = get().theme === 'light' ? 'dark' : 'light'
    set({ theme: newTheme })
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('mcp-pointer-theme', newTheme)
  },
  
  setTheme: (theme: Theme) => {
    set({ theme })
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('mcp-pointer-theme', theme)
  },
  
  initializeTheme: () => {
    // Always start with dark mode for cyber theme
    const defaultTheme: Theme = 'dark'
    set({ theme: defaultTheme })
    document.documentElement.classList.add('dark')
    localStorage.setItem('mcp-pointer-theme', defaultTheme)
    
    // Check if there's a stored preference
    const stored = localStorage.getItem('mcp-pointer-theme') as Theme | null
    if (stored && (stored === 'light' || stored === 'dark')) {
      set({ theme: stored })
      if (stored === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  },
}))
