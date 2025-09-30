import axios from 'axios'

// Create axios instance with default config
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:7007',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching
    config.params = {
      ...config.params,
      _t: Date.now(),
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth-storage')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API endpoints
export const endpoints = {
  // Auth
  login: '/auth/login',
  refresh: '/auth/refresh',
  logout: '/auth/logout',
  
  // Health
  health: '/health',
  
  // API
  status: '/api/status',
  
  // Elements
  analyzeElement: '/api/elements/analyze',
  getElementHistory: '/api/elements/history',
  getElementStats: '/api/elements/stats',
  
  // WebRTC
  webrtcConfig: '/webrtc/config',
  
  // Users
  getUsers: '/api/users',
  updateUser: '/api/users',
  
  // Analytics
  getAnalytics: '/api/analytics',
} as const

// Helper functions
export const apiHelpers = {
  // Health check
  async healthCheck() {
    const response = await api.get(endpoints.health)
    return response.data
  },

  // Get system status
  async getStatus() {
    const response = await api.get(endpoints.status)
    return response.data
  },

  // Analyze element
  async analyzeElement(elementData: any) {
    const response = await api.post(endpoints.analyzeElement, elementData)
    return response.data
  },

  // Get WebRTC config
  async getWebRTCConfig() {
    const response = await api.get(endpoints.webrtcConfig)
    return response.data
  },

  // Get element history
  async getElementHistory(limit = 50) {
    const response = await api.get(`${endpoints.getElementHistory}?limit=${limit}`)
    return response.data
  },

  // Get analytics
  async getAnalytics(timeRange = '7d') {
    const response = await api.get(`${endpoints.getAnalytics}?range=${timeRange}`)
    return response.data
  },
}
