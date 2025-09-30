import { useState, useEffect } from 'react'
import { 
  Activity, 
  Target, 
  Users, 
  Database,
  Wifi,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react'
import { apiHelpers } from '../utils/api'

interface SystemStatus {
  status: string
  timestamp: string
  version: string
  uptime: number
  services: {
    webrtc: {
      isRunning: boolean
      connectionCount: number
      port: number
    }
    mcp: {
      isRunning: boolean
      activeContexts: number
      tools: string[]
    }
    database: {
      status: string
      connectionCount: number
    }
  }
}

export default function Dashboard() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSystemStatus()
    const interval = setInterval(fetchSystemStatus, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchSystemStatus = async () => {
    try {
      setError('')
      const [healthData, statusData] = await Promise.all([
        apiHelpers.healthCheck(),
        apiHelpers.getStatus()
      ])
      
      setSystemStatus({
        ...healthData,
        ...statusData
      })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch system status')
    } finally {
      setIsLoading(false)
    }
  }

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent-1 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-l-text-2 dark:text-d-text-2">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-l-text-1 dark:text-d-text-1">
          Dashboard
        </h1>
        <p className="text-l-text-2 dark:text-d-text-2">
          Monitor your MCP Pointer system status and performance
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Status cards */}
      {systemStatus && (
        <>
          {/* Overview cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Server Status */}
            <div className="bg-l-bg-1 dark:bg-d-bg-1 border border-border-l dark:border-border-d rounded-lg p-6 card-shadow">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-l-text-2 dark:text-d-text-2">Server Status</p>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <p className="text-lg font-semibold text-l-text-1 dark:text-d-text-1">
                      {systemStatus.status}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* WebRTC Status */}
            <div className="bg-l-bg-1 dark:bg-d-bg-1 border border-border-l dark:border-border-d rounded-lg p-6 card-shadow">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Wifi className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-l-text-2 dark:text-d-text-2">WebRTC</p>
                  <p className="text-lg font-semibold text-l-text-1 dark:text-d-text-1">
                    {systemStatus.services.webrtc.isRunning ? 'Active' : 'Inactive'}
                  </p>
                  <p className="text-xs text-l-text-3 dark:text-d-text-3">
                    {systemStatus.services.webrtc.connectionCount} connections
                  </p>
                </div>
              </div>
            </div>

            {/* Database Status */}
            <div className="bg-l-bg-1 dark:bg-d-bg-1 border border-border-l dark:border-border-d rounded-lg p-6 card-shadow">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Database className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-l-text-2 dark:text-d-text-2">Database</p>
                  <p className="text-lg font-semibold text-l-text-1 dark:text-d-text-1">
                    {systemStatus.services.database.status}
                  </p>
                  <p className="text-xs text-l-text-3 dark:text-d-text-3">
                    SQLite v3.x
                  </p>
                </div>
              </div>
            </div>

            {/* Uptime */}
            <div className="bg-l-bg-1 dark:bg-d-bg-1 border border-border-l dark:border-border-d rounded-lg p-6 card-shadow">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-l-text-2 dark:text-d-text-2">Uptime</p>
                  <p className="text-lg font-semibold text-l-text-1 dark:text-d-text-1">
                    {formatUptime(systemStatus.uptime)}
                  </p>
                  <p className="text-xs text-l-text-3 dark:text-d-text-3">
                    v{systemStatus.version}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* MCP Tools */}
          <div className="bg-l-bg-1 dark:bg-d-bg-1 border border-border-l dark:border-border-d rounded-lg p-6 card-shadow">
            <h3 className="text-lg font-semibold text-l-text-1 dark:text-d-text-1 mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2" />
              MCP Tools Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-l-text-2 dark:text-d-text-2 mb-2">Active Contexts</p>
                <p className="text-2xl font-bold text-accent-1">
                  {systemStatus.services.mcp.activeContexts}
                </p>
              </div>
              <div>
                <p className="text-sm text-l-text-2 dark:text-d-text-2 mb-2">Available Tools</p>
                <div className="flex flex-wrap gap-2">
                  {systemStatus.services.mcp.tools.map((tool, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-l-bg-2 dark:bg-d-bg-2 border border-border-l dark:border-border-d rounded text-xs text-l-text-2 dark:text-d-text-2"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-l-bg-1 dark:bg-d-bg-1 border border-border-l dark:border-border-d rounded-lg p-6 card-shadow">
            <h3 className="text-lg font-semibold text-l-text-1 dark:text-d-text-1 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="p-4 text-left bg-l-bg-2 dark:bg-d-bg-2 hover:bg-l-bg-hover dark:hover:bg-d-bg-hover border border-border-l dark:border-border-d rounded-lg transition-colors">
                <Target className="w-6 h-6 text-accent-1 mb-2" />
                <h4 className="font-medium text-l-text-1 dark:text-d-text-1">Start Targeting</h4>
                <p className="text-sm text-l-text-2 dark:text-d-text-2">Begin element selection</p>
              </button>
              
              <button className="p-4 text-left bg-l-bg-2 dark:bg-d-bg-2 hover:bg-l-bg-hover dark:hover:bg-d-bg-hover border border-border-l dark:border-border-d rounded-lg transition-colors">
                <Users className="w-6 h-6 text-accent-1 mb-2" />
                <h4 className="font-medium text-l-text-1 dark:text-d-text-1">View Analytics</h4>
                <p className="text-sm text-l-text-2 dark:text-d-text-2">Check system metrics</p>
              </button>
              
              <button className="p-4 text-left bg-l-bg-2 dark:bg-d-bg-2 hover:bg-l-bg-hover dark:hover:bg-d-bg-hover border border-border-l dark:border-border-d rounded-lg transition-colors">
                <Database className="w-6 h-6 text-accent-1 mb-2" />
                <h4 className="font-medium text-l-text-1 dark:text-d-text-1">Database Status</h4>
                <p className="text-sm text-l-text-2 dark:text-d-text-2">Monitor database health</p>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}
