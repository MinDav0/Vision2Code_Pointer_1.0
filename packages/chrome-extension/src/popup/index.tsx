/**
 * Popup Component for MCP Pointer Chrome Extension
 * Main interface for the extension popup
 */

import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { motion } from 'framer-motion';
import { 
  Target, 
  Settings, 
  Activity, 
  Info, 
  CheckCircle, 
  AlertCircle,
  Wifi,
  WifiOff,
  Clock
} from 'lucide-react';
import { useElementStore } from '../stores/element-store';
import { useWebRTCStore } from '../stores/webrtc-store';

const PopupApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'settings'>('overview');
  
  const { 
    currentElement, 
    elementHistory, 
    isTargeting, 
    clearHistory 
  } = useElementStore();
  
  const { 
    connectionStatus, 
    getConnectionDuration,
    getMessageCount 
  } = useWebRTCStore();

  const connectionDuration = getConnectionDuration();
  const messageCount = getMessageCount();

  const handleToggleTargeting = async () => {
    try {
      // Send message to content script
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.id) {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'toggle_targeting',
          isTargeting: !isTargeting
        });
      }
    } catch (error) {
      console.error('Failed to toggle targeting:', error);
    }
  };

  const handleClearElement = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.id) {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'clear_element'
        });
      }
    } catch (error) {
      console.error('Failed to clear element:', error);
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getConnectionStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-success-500';
      case 'connecting': return 'text-warning-500';
      case 'error': return 'text-error-500';
      default: return 'text-secondary-500';
    }
  };

  const getConnectionStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <Wifi size={16} />;
      case 'connecting': return <Activity size={16} />;
      case 'error': return <WifiOff size={16} />;
      default: return <WifiOff size={16} />;
    }
  };

  return (
    <div className="w-80 h-96 bg-white">
      {/* Header */}
      <div className="bg-primary-500 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target size={20} />
            <h1 className="font-semibold text-lg">MCP Pointer</h1>
          </div>
          <div className="flex items-center gap-1">
            <div className={`${getConnectionStatusColor(connectionStatus)}`}>
              {getConnectionStatusIcon(connectionStatus)}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-secondary-200">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'history', label: 'History', icon: Clock },
          { id: 'settings', label: 'Settings', icon: Settings }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 px-3 text-sm font-medium transition-colors ${
              activeTab === id
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'overview' && (
          <div className="p-4 space-y-4">
            {/* Connection Status */}
            <div className="bg-secondary-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-secondary-900">Connection</h3>
                <div className={`flex items-center gap-1 text-sm ${getConnectionStatusColor(connectionStatus)}`}>
                  {getConnectionStatusIcon(connectionStatus)}
                  <span className="capitalize">{connectionStatus}</span>
                </div>
              </div>
              {connectionDuration && (
                <div className="text-xs text-secondary-600">
                  Connected for {formatDuration(connectionDuration)}
                </div>
              )}
              <div className="text-xs text-secondary-600">
                Messages: {messageCount}
              </div>
            </div>

            {/* Current Element */}
            {currentElement ? (
              <div className="bg-success-50 border border-success-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="text-success-500" size={16} />
                  <h3 className="font-medium text-success-900">Element Selected</h3>
                </div>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="text-secondary-600">Tag:</span>
                    <span className="ml-1 font-mono text-xs bg-white px-1 rounded">
                      {currentElement.tagName}
                    </span>
                  </div>
                  <div>
                    <span className="text-secondary-600">Selector:</span>
                    <div className="font-mono text-xs bg-white px-1 rounded mt-1 break-all">
                      {currentElement.selector}
                    </div>
                  </div>
                  {currentElement.innerText && (
                    <div>
                      <span className="text-secondary-600">Text:</span>
                      <div className="text-xs bg-white px-1 rounded mt-1 max-h-12 overflow-y-auto">
                        {currentElement.innerText.length > 50 
                          ? `${currentElement.innerText.substring(0, 50)}...`
                          : currentElement.innerText
                        }
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleClearElement}
                  className="mt-2 w-full bg-success-500 hover:bg-success-600 text-white text-xs py-1 px-2 rounded transition-colors"
                >
                  Clear Element
                </button>
              </div>
            ) : (
              <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="text-secondary-500" size={16} />
                  <h3 className="font-medium text-secondary-900">No Element Selected</h3>
                </div>
                <p className="text-sm text-secondary-600">
                  Click the target button to start selecting elements.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={handleToggleTargeting}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                  isTargeting
                    ? 'bg-error-500 hover:bg-error-600 text-white'
                    : 'bg-primary-500 hover:bg-primary-600 text-white'
                }`}
              >
                {isTargeting ? 'Stop Targeting' : 'Start Targeting'}
              </button>
              
              {elementHistory.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="w-full py-2 px-4 rounded-lg font-medium bg-secondary-500 hover:bg-secondary-600 text-white transition-colors"
                >
                  Clear History
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-secondary-900">Element History</h3>
              <span className="text-xs text-secondary-600">
                {elementHistory.length} elements
              </span>
            </div>
            
            {elementHistory.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {elementHistory.map((element) => (
                  <motion.div
                    key={element.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-secondary-50 border border-secondary-200 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs bg-white px-1 rounded">
                        {element.tagName}
                      </span>
                      <span className="text-xs text-secondary-500">
                        {new Date(element.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-xs text-secondary-600 break-all">
                      {element.selector}
                    </div>
                    {element.innerText && (
                      <div className="text-xs text-secondary-700 mt-1 max-h-8 overflow-y-auto">
                        {element.innerText.length > 40 
                          ? `${element.innerText.substring(0, 40)}...`
                          : element.innerText
                        }
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-secondary-500">
                <Clock size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No elements selected yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-4 space-y-4">
            <div className="bg-secondary-50 rounded-lg p-3">
              <h3 className="font-medium text-secondary-900 mb-2">Server Configuration</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-secondary-600">WebRTC Server:</span>
                  <div className="font-mono text-xs bg-white px-1 rounded mt-1">
                    ws://localhost:7008
                  </div>
                </div>
                <div>
                  <span className="text-secondary-600">HTTP Server:</span>
                  <div className="font-mono text-xs bg-white px-1 rounded mt-1">
                    http://localhost:7007
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-secondary-50 rounded-lg p-3">
              <h3 className="font-medium text-secondary-900 mb-2">Statistics</h3>
              <div className="space-y-1 text-sm text-secondary-600">
                <div>Elements Selected: {elementHistory.length}</div>
                <div>Messages Sent: {messageCount}</div>
                <div>Connection Status: <span className="capitalize">{connectionStatus}</span></div>
              </div>
            </div>

            <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="text-warning-500" size={16} />
                <h3 className="font-medium text-warning-900">About</h3>
              </div>
              <p className="text-xs text-warning-700">
                MCP Pointer v2.0 - Element targeting for AI tools
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Initialize popup
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<PopupApp />);
}

