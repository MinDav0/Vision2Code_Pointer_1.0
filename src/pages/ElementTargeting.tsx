import { useState, useEffect } from 'react'
import { Target, Monitor, Code, Zap } from 'lucide-react'
import { apiHelpers } from '../utils/api'

interface TargetedElement {
  id: string
  tagName: string
  selector: string
  textContent: string
  attributes: Record<string, string>
  timestamp: string
  analysis?: {
    suggestions: string[]
    codeExamples: string[]
    accessibility: string[]
  }
}

export default function ElementTargeting() {
  const [isTargeting, setIsTargeting] = useState(false)
  const [selectedElement, setSelectedElement] = useState<TargetedElement | null>(null)
  const [elementHistory, setElementHistory] = useState<TargetedElement[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchElementHistory()
  }, [])

  const fetchElementHistory = async () => {
    try {
      const history = await apiHelpers.getElementHistory(10)
      setElementHistory(history)
    } catch (error) {
      console.error('Failed to fetch element history:', error)
    }
  }

  const handleStartTargeting = () => {
    setIsTargeting(true)
    // In a real implementation, this would communicate with the Chrome extension
    console.warn('Starting element targeting mode...')
  }

  const handleStopTargeting = () => {
    setIsTargeting(false)
    console.warn('Stopping element targeting mode...')
  }

  const analyzeElement = async (element: TargetedElement) => {
    setIsLoading(true)
    try {
      const analysis = await apiHelpers.analyzeElement({
        element: {
          tagName: element.tagName,
          selector: element.selector,
          textContent: element.textContent,
          attributes: element.attributes,
        },
        analysisType: 'comprehensive',
        includeSuggestions: true,
        includeCodeExamples: true,
      })
      
      setSelectedElement({
        ...element,
        analysis: analysis,
      })
    } catch (error) {
      console.error('Element analysis failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-l-text-1 dark:text-d-text-1">
          Element Targeting
        </h1>
        <p className="text-l-text-2 dark:text-d-text-2">
          Select and analyze DOM elements for AI-assisted development
        </p>
      </div>

      {/* Targeting Controls */}
      <div className="bg-l-bg-1 dark:bg-d-bg-1 border border-border-l dark:border-border-d rounded-lg p-6 card-shadow">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-l-text-1 dark:text-d-text-1 flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Targeting Mode
            </h3>
            <p className="text-sm text-l-text-2 dark:text-d-text-2 mt-1">
              {isTargeting 
                ? 'Targeting is active. Use the Chrome extension to select elements.'
                : 'Start targeting mode to begin element selection.'
              }
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${isTargeting ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-sm text-l-text-2 dark:text-d-text-2">
              {isTargeting ? 'Active' : 'Inactive'}
            </span>
            <button
              onClick={isTargeting ? handleStopTargeting : handleStartTargeting}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isTargeting
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-accent-1 hover:bg-accent-2 text-white'
              }`}
            >
              {isTargeting ? 'Stop Targeting' : 'Start Targeting'}
            </button>
          </div>
        </div>
      </div>

      {/* Chrome Extension Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Monitor className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100">Chrome Extension Required</h4>
            <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
              To use element targeting, make sure you have the MCP Pointer Chrome extension installed and enabled.
              The extension will communicate with this dashboard to show selected elements.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Selected Element */}
        <div className="bg-l-bg-1 dark:bg-d-bg-1 border border-border-l dark:border-border-d rounded-lg p-6 card-shadow">
          <h3 className="text-lg font-semibold text-l-text-1 dark:text-d-text-1 mb-4">
            Selected Element
          </h3>
          
          {selectedElement ? (
            <div className="space-y-4">
              <div className="p-4 bg-l-bg-2 dark:bg-d-bg-2 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-1 bg-accent-1 text-white text-xs font-mono rounded">
                    {selectedElement.tagName}
                  </span>
                  <span className="text-xs text-l-text-3 dark:text-d-text-3">
                    {new Date(selectedElement.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                <p className="text-sm text-l-text-1 dark:text-d-text-1 font-mono mb-2">
                  {selectedElement.selector}
                </p>
                
                {selectedElement.textContent && (
                  <p className="text-sm text-l-text-2 dark:text-d-text-2 truncate">
                    &ldquo;{selectedElement.textContent}&rdquo;
                  </p>
                )}
              </div>

              {/* AI Analysis */}
              {selectedElement.analysis && (
                <div className="space-y-3">
                  <h4 className="font-medium text-l-text-1 dark:text-d-text-1 flex items-center">
                    <Zap className="w-4 h-4 mr-2" />
                    AI Analysis
                  </h4>
                  
                  {selectedElement.analysis.suggestions.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-l-text-1 dark:text-d-text-1 mb-2">Suggestions</h5>
                      <ul className="space-y-1">
                        {selectedElement.analysis.suggestions.map((suggestion, index) => (
                          <li key={index} className="text-sm text-l-text-2 dark:text-d-text-2 flex items-start">
                            <span className="w-1.5 h-1.5 bg-accent-1 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {selectedElement.analysis.codeExamples.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-l-text-1 dark:text-d-text-1 mb-2">Code Examples</h5>
                      <div className="space-y-2">
                        {selectedElement.analysis.codeExamples.map((example, index) => (
                          <pre key={index} className="text-xs bg-l-bg-3 dark:bg-d-bg-3 p-3 rounded border overflow-x-auto">
                            <code className="text-l-text-1 dark:text-d-text-1">{example}</code>
                          </pre>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => analyzeElement(selectedElement)}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-accent-1 hover:bg-accent-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Analyzing...' : 'Analyze with AI'}
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-l-text-3 dark:text-d-text-3 mx-auto mb-4" />
              <p className="text-l-text-2 dark:text-d-text-2">
                No element selected. Use the Chrome extension to select an element.
              </p>
            </div>
          )}
        </div>

        {/* Element History */}
        <div className="bg-l-bg-1 dark:bg-d-bg-1 border border-border-l dark:border-border-d rounded-lg p-6 card-shadow">
          <h3 className="text-lg font-semibold text-l-text-1 dark:text-d-text-1 mb-4">
            Recent Elements
          </h3>
          
          {elementHistory.length > 0 ? (
            <div className="space-y-3">
              {elementHistory.map((element, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedElement(element)}
                  className="p-3 bg-l-bg-2 dark:bg-d-bg-2 hover:bg-l-bg-hover dark:hover:bg-d-bg-hover border border-border-l dark:border-border-d rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-1 bg-l-bg-3 dark:bg-d-bg-3 text-xs font-mono rounded">
                      {element.tagName}
                    </span>
                    <span className="text-xs text-l-text-3 dark:text-d-text-3">
                      {new Date(element.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-l-text-1 dark:text-d-text-1 font-mono mt-1 truncate">
                    {element.selector}
                  </p>
                  {element.textContent && (
                    <p className="text-xs text-l-text-2 dark:text-d-text-2 mt-1 truncate">
                      &ldquo;{element.textContent}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Code className="w-12 h-12 text-l-text-3 dark:text-d-text-3 mx-auto mb-4" />
              <p className="text-l-text-2 dark:text-d-text-2">
                No elements targeted yet. Start targeting to see history.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
