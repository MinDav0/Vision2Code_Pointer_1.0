import { NavLink, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Target, 
  BarChart3, 
  Settings,
  Zap
} from 'lucide-react'
import { cn } from '../utils/cn'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Element Targeting', href: '/targeting', icon: Target },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <div className="w-64 bg-l-bg-1 dark:bg-d-bg-1 border-r border-border-l dark:border-border-d">
      {/* Logo */}
      <div className="p-6 border-b border-border-l dark:border-border-d">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-accent-1 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-l-text-1 dark:text-d-text-1">
              MCP Pointer
            </h2>
            <p className="text-xs text-l-text-2 dark:text-d-text-2">
              v2.2 Production
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-3">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            const Icon = item.icon

            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? 'bg-accent-1 text-white'
                    : 'text-l-text-2 dark:text-d-text-2 hover:text-l-text-1 dark:hover:text-d-text-1 hover:bg-l-bg-hover dark:hover:bg-d-bg-hover'
                )}
              >
                <Icon
                  className={cn(
                    'mr-3 h-5 w-5',
                    isActive
                      ? 'text-white'
                      : 'text-l-text-3 dark:text-d-text-3 group-hover:text-l-text-1 dark:group-hover:text-d-text-1'
                  )}
                />
                {item.name}
              </NavLink>
            )
          })}
        </div>
      </nav>

      {/* Status indicator */}
      <div className="absolute bottom-6 left-3 right-3">
        <div className="bg-l-bg-2 dark:bg-d-bg-2 border border-border-l dark:border-border-d rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-accent-success rounded-full animate-pulse"></div>
              <span className="text-xs text-l-text-2 dark:text-d-text-2">Server Online</span>
            </div>
            <span className="text-xs text-l-text-3 dark:text-d-text-3">v2.2</span>
          </div>
        </div>
      </div>
    </div>
  )
}
