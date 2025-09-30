import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { useThemeStore } from './stores/themeStore'
import { useAuthStore } from './stores/authStore'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import ElementTargeting from './pages/ElementTargeting'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  const { theme, initializeTheme } = useThemeStore()
  const { checkAuth } = useAuthStore()

  useEffect(() => {
    initializeTheme()
    checkAuth()
  }, [initializeTheme, checkAuth])

  useEffect(() => {
    document.body.className = theme
  }, [theme])

  return (
    <div className="min-h-screen bg-l-bg-1 dark:bg-d-bg-1 text-l-text-1 dark:text-d-text-1">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="targeting" element={
            <ProtectedRoute>
              <ElementTargeting />
            </ProtectedRoute>
          } />
          <Route path="analytics" element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          } />
          <Route path="settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </div>
  )
}

export default App
