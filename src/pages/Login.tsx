import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useThemeStore } from '../stores/themeStore'
import ThemeToggle from '../components/ThemeToggle'
import { Zap, Mail, Lock, AlertCircle } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('admin@mcp-pointer.local')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  
  const { login, isAuthenticated, isLoading } = useAuthStore()
  const { theme } = useThemeStore()
  const location = useLocation()
  
  const from = location.state?.from?.pathname || '/'

  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      await login(email, password)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex bg-l-bg-1 dark:bg-d-bg-1">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-12 bg-accent-1">
        <div className="text-center">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-8">
            <Zap className="w-10 h-10 text-accent-1" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            MCP Pointer v2.2
          </h1>
          <p className="text-xl text-blue-100 mb-8">
            Element targeting for AI-assisted web development
          </p>
          <div className="space-y-4 text-blue-100">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Real-time element selection</span>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>AI-powered analysis</span>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Production-ready security</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-8 max-w-md mx-auto lg:mx-0">
        {/* Theme toggle */}
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <div className="flex justify-center lg:hidden mb-8">
            <div className="w-16 h-16 bg-accent-1 rounded-xl flex items-center justify-center">
              <Zap className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-l-text-1 dark:text-d-text-1">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-l-text-2 dark:text-d-text-2">
            Access your MCP Pointer dashboard
          </p>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium leading-6 text-l-text-1 dark:text-d-text-1">
                Email address
              </label>
              <div className="mt-2 relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-l-text-3 dark:text-d-text-3" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-border-l dark:border-border-d rounded-lg bg-l-bg-1 dark:bg-d-bg-1 text-l-text-1 dark:text-d-text-1 placeholder-l-text-3 dark:placeholder-d-text-3 focus:outline-none focus:ring-2 focus:ring-accent-1 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium leading-6 text-l-text-1 dark:text-d-text-1">
                Password
              </label>
              <div className="mt-2 relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-l-text-3 dark:text-d-text-3" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-border-l dark:border-border-d rounded-lg bg-l-bg-1 dark:bg-d-bg-1 text-l-text-1 dark:text-d-text-1 placeholder-l-text-3 dark:placeholder-d-text-3 focus:outline-none focus:ring-2 focus:ring-accent-1 focus:border-transparent"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center rounded-lg bg-accent-1 px-3 py-2 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-accent-2 focus:outline-none focus:ring-2 focus:ring-accent-1 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-l-text-3 dark:text-d-text-3">
              MCP Pointer v2.2 - Production Ready
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
