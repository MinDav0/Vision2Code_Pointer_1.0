import { create } from 'zustand'
import { api } from '../utils/api'

interface User {
  id: string
  email: string
  name: string
  role: string
  permissions: string[]
  createdAt: string
  lastLoginAt: string
  isActive: boolean
}

interface AuthToken {
  accessToken: string
  refreshToken: string
  expiresAt: string
  tokenType: string
}

interface AuthState {
  user: User | null
  token: AuthToken | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => void
  refreshToken: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await api.post('/auth/login', { email, password })
          const { user, token, permissions } = response.data
          
          const authData = {
            user: { ...user, permissions },
            token,
            isAuthenticated: true,
          }
          
          set({ ...authData, isLoading: false })
          
          // Set authorization header for future requests
          api.defaults.headers.common['Authorization'] = `Bearer ${token.accessToken}`
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        })
        
        // Remove authorization header
        delete api.defaults.headers.common['Authorization']
        
        // Clear localStorage
        localStorage.removeItem('mcp-pointer-auth')
      },

      checkAuth: () => {
        const stored = localStorage.getItem('mcp-pointer-auth')
        if (stored) {
          try {
            const parsed = JSON.parse(stored)
            if (parsed.token?.accessToken) {
              const { user, token } = parsed
              
              // Check if token is expired
              const now = new Date().getTime()
              const expiresAt = new Date(token.expiresAt).getTime()
              
              if (now < expiresAt) {
                set({
                  user,
                  token,
                  isAuthenticated: true,
                })
                
                // Set authorization header
                api.defaults.headers.common['Authorization'] = `Bearer ${token.accessToken}`
              } else {
                // Token expired, try to refresh
                get().refreshToken()
              }
            }
          } catch (e) {
            console.warn('Failed to parse stored auth:', e)
            get().logout()
          }
        }
      },

      refreshToken: async () => {
        const { token } = get()
        if (!token?.refreshToken) {
          get().logout()
          return
        }

        try {
          const response = await api.post('/auth/refresh', {
            refreshToken: token.refreshToken,
          })
          
          const newToken = response.data
          set({
            token: newToken,
            isAuthenticated: true,
          })
          
          // Update authorization header
          api.defaults.headers.common['Authorization'] = `Bearer ${newToken.accessToken}`
        } catch (error) {
          console.error('Token refresh failed:', error)
          get().logout()
        }
      },
}))

// Helper function to save auth state
const saveAuthState = (state: { user: User | null; token: AuthToken | null; isAuthenticated: boolean }) => {
  localStorage.setItem('mcp-pointer-auth', JSON.stringify(state))
}

// Override the store to add persistence manually
const originalSet = useAuthStore.setState
useAuthStore.setState = (partial, replace) => {
  const result = originalSet(partial, replace)
  const state = useAuthStore.getState()
  saveAuthState({
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
  })
  return result
}
