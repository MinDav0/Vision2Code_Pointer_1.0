import { useAuthStore } from '../stores/authStore'
import ThemeToggle from './ThemeToggle'
import { User, LogOut, Settings } from 'lucide-react'

export default function Header() {
  const { user, logout } = useAuthStore()

  return (
    <header className="bg-l-bg-1 dark:bg-d-bg-1 border-b border-border-l dark:border-border-d px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Title */}
        <div>
          <h1 className="text-xl font-semibold text-l-text-1 dark:text-d-text-1">
            MCP Pointer v2.2
          </h1>
          <p className="text-sm text-l-text-2 dark:text-d-text-2">
            Element targeting for AI-assisted development
          </p>
        </div>

        {/* Right side - User menu */}
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          
          {user && (
            <div className="flex items-center space-x-3">
              {/* User info */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-accent-1 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-l-text-1 dark:text-d-text-1">
                    {user.name}
                  </p>
                  <p className="text-xs text-l-text-2 dark:text-d-text-2">
                    {user.role}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center space-x-2">
                <button
                  className="p-2 text-l-text-2 dark:text-d-text-2 hover:text-l-text-1 dark:hover:text-d-text-1 hover:bg-l-bg-hover dark:hover:bg-d-bg-hover rounded-lg transition-colors"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
                
                <button
                  onClick={logout}
                  className="p-2 text-l-text-2 dark:text-d-text-2 hover:text-accent-danger hover:bg-l-bg-hover dark:hover:bg-d-bg-hover rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
