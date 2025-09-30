import { create } from 'zustand'

export type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  initializeTheme: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',
  
  toggleTheme: () => {
    const newTheme = get().theme === 'light' ? 'dark' : 'light'
    set({ theme: newTheme })
    document.body.className = newTheme
    localStorage.setItem('mcp-pointer-theme', newTheme)
  },
  
  setTheme: (theme: Theme) => {
    set({ theme })
    document.body.className = theme
    localStorage.setItem('mcp-pointer-theme', theme)
  },
  
  initializeTheme: () => {
    const stored = localStorage.getItem('mcp-pointer-theme') as Theme | null
    if (stored && (stored === 'light' || stored === 'dark')) {
      set({ theme: stored })
      document.body.className = stored
      return
    }
    
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const systemTheme: Theme = prefersDark ? 'dark' : 'light'
    set({ theme: systemTheme })
    document.body.className = systemTheme
    localStorage.setItem('mcp-pointer-theme', systemTheme)
  },
}))
