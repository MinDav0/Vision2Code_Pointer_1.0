import { useState } from 'react'
import { Settings as SettingsIcon, User, Shield, Database, Zap } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useThemeStore } from '../stores/themeStore'

export default function Settings() {
  const { user } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const [activeTab, setActiveTab] = useState('profile')

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'database', name: 'Database', icon: Database },
    { id: 'ai', name: 'AI Services', icon: Zap },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-l-text-1 dark:text-d-text-1">
          Settings
        </h1>
        <p className="text-l-text-2 dark:text-d-text-2">
          Configure your MCP Pointer system preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-accent-1 text-white'
                      : 'text-l-text-2 dark:text-d-text-2 hover:text-l-text-1 dark:hover:text-d-text-1 hover:bg-l-bg-hover dark:hover:bg-d-bg-hover'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-l-bg-1 dark:bg-d-bg-1 border border-border-l dark:border-border-d rounded-lg p-6 card-shadow">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-l-text-1 dark:text-d-text-1">
                  Profile Settings
                </h3>
                
                {user && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-l-text-1 dark:text-d-text-1 mb-2">
                          Name
                        </label>
                        <input
                          type="text"
                          value={user.name}
                          readOnly
                          className="w-full px-3 py-2 border border-border-l dark:border-border-d rounded-lg bg-l-bg-2 dark:bg-d-bg-2 text-l-text-1 dark:text-d-text-1"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-l-text-1 dark:text-d-text-1 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={user.email}
                          readOnly
                          className="w-full px-3 py-2 border border-border-l dark:border-border-d rounded-lg bg-l-bg-2 dark:bg-d-bg-2 text-l-text-1 dark:text-d-text-1"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-l-text-1 dark:text-d-text-1 mb-2">
                          Role
                        </label>
                        <input
                          type="text"
                          value={user.role}
                          readOnly
                          className="w-full px-3 py-2 border border-border-l dark:border-border-d rounded-lg bg-l-bg-2 dark:bg-d-bg-2 text-l-text-1 dark:text-d-text-1"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-l-text-1 dark:text-d-text-1 mb-2">
                          Last Login
                        </label>
                        <input
                          type="text"
                          value={new Date(user.lastLoginAt).toLocaleString()}
                          readOnly
                          className="w-full px-3 py-2 border border-border-l dark:border-border-d rounded-lg bg-l-bg-2 dark:bg-d-bg-2 text-l-text-1 dark:text-d-text-1"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-l-text-1 dark:text-d-text-1 mb-2">
                        Permissions
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {user.permissions.map((permission, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-l-bg-3 dark:bg-d-bg-3 border border-border-l dark:border-border-d rounded-full text-xs text-l-text-2 dark:text-d-text-2"
                          >
                            {permission}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-l-text-1 dark:text-d-text-1">
                  Security Settings
                </h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <div>
                        <h4 className="font-medium text-green-900 dark:text-green-100">Security Status: Excellent</h4>
                        <p className="text-sm text-green-700 dark:text-green-200">
                          All security measures are properly configured
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-l-bg-2 dark:bg-d-bg-2 border border-border-l dark:border-border-d rounded-lg">
                      <h4 className="font-medium text-l-text-1 dark:text-d-text-1 mb-2">JWT Authentication</h4>
                      <p className="text-sm text-l-text-2 dark:text-d-text-2">
                        Secure token-based authentication with automatic refresh
                      </p>
                    </div>
                    
                    <div className="p-4 bg-l-bg-2 dark:bg-d-bg-2 border border-border-l dark:border-border-d rounded-lg">
                      <h4 className="font-medium text-l-text-1 dark:text-d-text-1 mb-2">Password Security</h4>
                      <p className="text-sm text-l-text-2 dark:text-d-text-2">
                        Bcrypt hashing with 12 salt rounds
                      </p>
                    </div>
                    
                    <div className="p-4 bg-l-bg-2 dark:bg-d-bg-2 border border-border-l dark:border-border-d rounded-lg">
                      <h4 className="font-medium text-l-text-1 dark:text-d-text-1 mb-2">API Security</h4>
                      <p className="text-sm text-l-text-2 dark:text-d-text-2">
                        Rate limiting and input validation
                      </p>
                    </div>
                    
                    <div className="p-4 bg-l-bg-2 dark:bg-d-bg-2 border border-border-l dark:border-border-d rounded-lg">
                      <h4 className="font-medium text-l-text-1 dark:text-d-text-1 mb-2">Environment Security</h4>
                      <p className="text-sm text-l-text-2 dark:text-d-text-2">
                        All secrets externalized to environment variables
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'database' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-l-text-1 dark:text-d-text-1">
                  Database Configuration
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-l-bg-2 dark:bg-d-bg-2 border border-border-l dark:border-border-d rounded-lg">
                      <h4 className="font-medium text-l-text-1 dark:text-d-text-1 mb-2">Type</h4>
                      <p className="text-sm text-l-text-2 dark:text-d-text-2">SQLite 3.x</p>
                    </div>
                    
                    <div className="p-4 bg-l-bg-2 dark:bg-d-bg-2 border border-border-l dark:border-border-d rounded-lg">
                      <h4 className="font-medium text-l-text-1 dark:text-d-text-1 mb-2">Mode</h4>
                      <p className="text-sm text-l-text-2 dark:text-d-text-2">WAL (Write-Ahead Logging)</p>
                    </div>
                    
                    <div className="p-4 bg-l-bg-2 dark:bg-d-bg-2 border border-border-l dark:border-border-d rounded-lg">
                      <h4 className="font-medium text-l-text-1 dark:text-d-text-1 mb-2">Size</h4>
                      <p className="text-sm text-l-text-2 dark:text-d-text-2">~184KB</p>
                    </div>
                  </div>

                  <div className="p-4 bg-l-bg-2 dark:bg-d-bg-2 border border-border-l dark:border-border-d rounded-lg">
                    <h4 className="font-medium text-l-text-1 dark:text-d-text-1 mb-3">Database Tables</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                      {['users', 'user_sessions', 'elements', 'webrtc_connections', 'mcp_tool_executions', 'security_events', 'rate_limits', 'app_config', 'migrations'].map((table) => (
                        <span key={table} className="px-2 py-1 bg-l-bg-3 dark:bg-d-bg-3 rounded text-l-text-2 dark:text-d-text-2 font-mono text-xs">
                          {table}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-l-text-1 dark:text-d-text-1">
                  AI Services Configuration
                </h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-l-bg-2 dark:bg-d-bg-2 border border-border-l dark:border-border-d rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-l-text-1 dark:text-d-text-1">Cursor AI</h4>
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 text-xs rounded-full">
                        Enabled
                      </span>
                    </div>
                    <p className="text-sm text-l-text-2 dark:text-d-text-2">
                      Primary AI service for element analysis and code suggestions
                    </p>
                  </div>

                  <div className="p-4 bg-l-bg-2 dark:bg-d-bg-2 border border-border-l dark:border-border-d rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-l-text-1 dark:text-d-text-1">Claude API</h4>
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs rounded-full">
                        Optional
                      </span>
                    </div>
                    <p className="text-sm text-l-text-2 dark:text-d-text-2">
                      Additional AI service for advanced analysis (requires API key)
                    </p>
                  </div>

                  <div className="p-4 bg-l-bg-2 dark:bg-d-bg-2 border border-border-l dark:border-border-d rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-l-text-1 dark:text-d-text-1">Local LLM</h4>
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs rounded-full">
                        Optional
                      </span>
                    </div>
                    <p className="text-sm text-l-text-2 dark:text-d-text-2">
                      Local language model support (Ollama integration)
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Theme Settings */}
      <div className="bg-l-bg-1 dark:bg-d-bg-1 border border-border-l dark:border-border-d rounded-lg p-6 card-shadow">
        <h3 className="text-lg font-semibold text-l-text-1 dark:text-d-text-1 mb-4">
          Appearance
        </h3>
        
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-l-text-1 dark:text-d-text-1">Dark Mode</h4>
            <p className="text-sm text-l-text-2 dark:text-d-text-2">
              Toggle between light and dark themes
            </p>
          </div>
          
          <button
            onClick={toggleTheme}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              theme === 'dark' ? 'bg-accent-1' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  )
}
