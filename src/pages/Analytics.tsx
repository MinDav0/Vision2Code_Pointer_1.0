import { BarChart3, TrendingUp, Clock, Target } from 'lucide-react'

export default function Analytics() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-l-text-1 dark:text-d-text-1">
          Analytics
        </h1>
        <p className="text-l-text-2 dark:text-d-text-2">
          Monitor element targeting performance and usage metrics
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-l-bg-1 dark:bg-d-bg-1 border border-border-l dark:border-border-d rounded-lg p-6 card-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-l-text-2 dark:text-d-text-2">Elements Targeted</p>
              <p className="text-2xl font-bold text-l-text-1 dark:text-d-text-1">0</p>
            </div>
          </div>
        </div>

        <div className="bg-l-bg-1 dark:bg-d-bg-1 border border-border-l dark:border-border-d rounded-lg p-6 card-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-l-text-2 dark:text-d-text-2">AI Analyses</p>
              <p className="text-2xl font-bold text-l-text-1 dark:text-d-text-1">0</p>
            </div>
          </div>
        </div>

        <div className="bg-l-bg-1 dark:bg-d-bg-1 border border-border-l dark:border-border-d rounded-lg p-6 card-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-l-text-2 dark:text-d-text-2">Success Rate</p>
              <p className="text-2xl font-bold text-l-text-1 dark:text-d-text-1">100%</p>
            </div>
          </div>
        </div>

        <div className="bg-l-bg-1 dark:bg-d-bg-1 border border-border-l dark:border-border-d rounded-lg p-6 card-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-l-text-2 dark:text-d-text-2">Avg Response</p>
              <p className="text-2xl font-bold text-l-text-1 dark:text-d-text-1">0.2s</p>
            </div>
          </div>
        </div>
      </div>

      {/* Coming soon placeholder */}
      <div className="bg-l-bg-1 dark:bg-d-bg-1 border border-border-l dark:border-border-d rounded-lg p-12 card-shadow text-center">
        <BarChart3 className="w-16 h-16 text-l-text-3 dark:text-d-text-3 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-l-text-1 dark:text-d-text-1 mb-2">
          Advanced Analytics Coming Soon
        </h3>
        <p className="text-l-text-2 dark:text-d-text-2 max-w-md mx-auto">
          Detailed charts, performance metrics, and usage insights will be available in the next release.
          Start using element targeting to generate data for analysis.
        </p>
      </div>
    </div>
  )
}
