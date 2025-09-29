/**
 * Options Page for MCP Pointer Chrome Extension
 * Settings and configuration interface
 */

import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Server, 
  Palette, 
  Bell, 
  Save, 
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

interface ExtensionSettings {
  serverUrl: string;
  httpServerUrl: string;
  autoConnect: boolean;
  highlightColor: string;
  showNotifications: boolean;
}

const defaultSettings: ExtensionSettings = {
  serverUrl: 'ws://localhost:7008',
  httpServerUrl: 'http://localhost:7007',
  autoConnect: true,
  highlightColor: '#3b82f6',
  showNotifications: true
};

const OptionsApp: React.FC = () => {
  const [settings, setSettings] = useState<ExtensionSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const result = await chrome.storage.local.get(Object.keys(defaultSettings));
        setSettings({ ...defaultSettings, ...result });
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Save settings
  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      await chrome.storage.local.set(settings);
      setSaveStatus('success');
      
      // Clear success status after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to defaults
  const handleReset = () => {
    setSettings(defaultSettings);
  };

  // Update setting
  const updateSetting = <K extends keyof ExtensionSettings>(
    key: K,
    value: ExtensionSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-secondary-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <div className="bg-white border-b border-secondary-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                <Settings className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-secondary-900">MCP Pointer Settings</h1>
                <p className="text-sm text-secondary-600">Configure your element targeting experience</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="px-3 py-2 text-sm font-medium text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 rounded-lg transition-colors"
              >
                <RotateCcw size={16} className="inline mr-1" />
                Reset
              </button>
              
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Save Status */}
        {saveStatus === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-success-50 border border-success-200 rounded-lg p-4 flex items-center gap-3"
          >
            <CheckCircle className="text-success-500" size={20} />
            <p className="text-success-700 font-medium">Settings saved successfully!</p>
          </motion.div>
        )}

        {saveStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-error-50 border border-error-200 rounded-lg p-4 flex items-center gap-3"
          >
            <AlertCircle className="text-error-500" size={20} />
            <p className="text-error-700 font-medium">Failed to save settings. Please try again.</p>
          </motion.div>
        )}

        <div className="grid gap-8">
          {/* Server Configuration */}
          <div className="bg-white rounded-lg border border-secondary-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Server className="text-primary-500" size={20} />
              <h2 className="text-lg font-semibold text-secondary-900">Server Configuration</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  WebRTC Server URL
                </label>
                <input
                  type="text"
                  value={settings.serverUrl}
                  onChange={(e) => updateSetting('serverUrl', e.target.value)}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="ws://localhost:7008"
                />
                <p className="text-xs text-secondary-500 mt-1">
                  WebSocket URL for real-time communication
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  HTTP Server URL
                </label>
                <input
                  type="text"
                  value={settings.httpServerUrl}
                  onChange={(e) => updateSetting('httpServerUrl', e.target.value)}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="http://localhost:7007"
                />
                <p className="text-xs text-secondary-500 mt-1">
                  HTTP API server URL for authentication and data
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="autoConnect"
                  checked={settings.autoConnect}
                  onChange={(e) => updateSetting('autoConnect', e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="autoConnect" className="text-sm font-medium text-secondary-700">
                  Auto-connect to server on extension startup
                </label>
              </div>
            </div>
          </div>

          {/* Visual Settings */}
          <div className="bg-white rounded-lg border border-secondary-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Palette className="text-primary-500" size={20} />
              <h2 className="text-lg font-semibold text-secondary-900">Visual Settings</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Highlight Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={settings.highlightColor}
                    onChange={(e) => updateSetting('highlightColor', e.target.value)}
                    className="w-12 h-10 border border-secondary-300 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.highlightColor}
                    onChange={(e) => updateSetting('highlightColor', e.target.value)}
                    className="flex-1 px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                    placeholder="#3b82f6"
                  />
                </div>
                <p className="text-xs text-secondary-500 mt-1">
                  Color used to highlight selected elements
                </p>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white rounded-lg border border-secondary-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="text-primary-500" size={20} />
              <h2 className="text-lg font-semibold text-secondary-900">Notifications</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="showNotifications"
                  checked={settings.showNotifications}
                  onChange={(e) => updateSetting('showNotifications', e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="showNotifications" className="text-sm font-medium text-secondary-700">
                  Show notifications when elements are selected
                </label>
              </div>
            </div>
          </div>

          {/* Information */}
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <Info className="text-primary-500" size={20} />
              <h2 className="text-lg font-semibold text-primary-900">About MCP Pointer</h2>
            </div>
            
            <div className="space-y-2 text-sm text-primary-700">
              <p>
                <strong>Version:</strong> 2.0.0
              </p>
              <p>
                <strong>Description:</strong> Point to browser DOM elements for agentic coding tools via MCP
              </p>
              <p>
                <strong>Features:</strong> Real-time element targeting, WebRTC communication, AI tool integration
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Initialize options page
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<OptionsApp />);
}

