/**
 * Content Script for MCP Pointer Chrome Extension
 * Handles element detection, targeting, and WebRTC communication
 */

import React, { useEffect, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { ElementTargeter } from './components/ElementTargeter';
import { WebRTCClient } from './utils/webrtc-client';
import { ElementDetector } from './utils/element-detector';
import { useElementStore } from '../stores/element-store';
import { useWebRTCStore } from '../stores/webrtc-store';
import type { TargetedElement, WebRTCMessage } from '@mcp-pointer/shared';

// Global state for the content script
let webrtcClient: WebRTCClient | null = null;
let elementDetector: ElementDetector | null = null;
let isInitialized = false;

const ContentApp: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [currentElement, setCurrentElement] = useState<TargetedElement | null>(null);
  const [isTargeting, setIsTargeting] = useState(false);
  
  const { setCurrentElement: setStoreElement, clearElement } = useElementStore();
  const { setConnectionStatus, setLastMessage } = useWebRTCStore();

  // Initialize WebRTC connection
  const initializeWebRTC = useCallback(async () => {
    try {
      if (webrtcClient) {
        await webrtcClient.disconnect();
      }

      webrtcClient = new WebRTCClient({
        serverUrl: 'ws://localhost:7008',
        userId: 'content-script-user' // This would come from authentication
      });

      webrtcClient.on('connected', () => {
        console.log('🔗 WebRTC connected from content script');
        setIsConnected(true);
        setConnectionStatus('connected');
      });

      webrtcClient.on('disconnected', () => {
        console.log('🔌 WebRTC disconnected from content script');
        setIsConnected(false);
        setConnectionStatus('disconnected');
      });

      webrtcClient.on('message', (message: WebRTCMessage) => {
        console.log('📨 WebRTC message received:', message);
        setLastMessage(message);
      });

      await webrtcClient.connect();
    } catch (error) {
      console.error('Failed to initialize WebRTC:', error);
      setConnectionStatus('error');
    }
  }, [setConnectionStatus, setLastMessage]);

  // Initialize element detector
  const initializeElementDetector = useCallback(() => {
    if (elementDetector) {
      elementDetector.destroy();
    }

    elementDetector = new ElementDetector({
      onElementHover: (element: TargetedElement) => {
        setCurrentElement(element);
        setStoreElement(element);
      },
      onElementSelect: async (element: TargetedElement) => {
        setCurrentElement(element);
        setStoreElement(element);
        
        // Send element data to server via WebRTC
        if (webrtcClient && isConnected) {
          await webrtcClient.sendElementData(element);
        }
      }
    });

    elementDetector.initialize();
  }, [setStoreElement]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Option+Click for element selection (handled by ElementDetector)
    if (event.key === 'Escape') {
      setIsTargeting(false);
      clearElement();
      if (elementDetector) {
        elementDetector.stopTargeting();
      }
    }
  }, [clearElement]);

  // Initialize everything
  useEffect(() => {
    if (isInitialized) return;

    const init = async () => {
      try {
        await initializeWebRTC();
        initializeElementDetector();
        
        // Add keyboard event listeners
        document.addEventListener('keydown', handleKeyDown);
        
        isInitialized = true;
        console.log('✅ MCP Pointer content script initialized');
      } catch (error) {
        console.error('Failed to initialize content script:', error);
      }
    };

    init();

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (webrtcClient) {
        webrtcClient.disconnect();
      }
      if (elementDetector) {
        elementDetector.destroy();
      }
    };
  }, [initializeWebRTC, initializeElementDetector, handleKeyDown]);

  // Handle targeting mode toggle
  const toggleTargeting = useCallback(() => {
    if (!elementDetector) return;

    if (isTargeting) {
      setIsTargeting(false);
      elementDetector.stopTargeting();
    } else {
      setIsTargeting(true);
      elementDetector.startTargeting();
    }
  }, [isTargeting]);

  return (
    <ElementTargeter
      isConnected={isConnected}
      currentElement={currentElement}
      isTargeting={isTargeting}
      onToggleTargeting={toggleTargeting}
      onClearElement={clearElement}
    />
  );
};

// Initialize the content script
const initContentScript = () => {
  // Create a container for our React app
  const container = document.createElement('div');
  container.id = 'mcp-pointer-content';
  container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  
  document.body.appendChild(container);
  
  // Render the React app
  const root = createRoot(container);
  root.render(<ContentApp />);
  
  console.log('🚀 MCP Pointer content script loaded');
};

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initContentScript);
} else {
  initContentScript();
}

