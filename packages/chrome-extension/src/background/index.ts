/**
 * Background Script for MCP Pointer Chrome Extension
 * Handles extension lifecycle and message routing
 */

import type { TargetedElement } from '@mcp-pointer/shared';

// Extension installation and startup
chrome.runtime.onInstalled.addListener((details) => {
  console.log('🚀 MCP Pointer extension installed:', details.reason);
  
  if (details.reason === 'install') {
    // Set default settings
    chrome.storage.local.set({
      serverUrl: 'ws://localhost:7008',
      httpServerUrl: 'http://localhost:7007',
      autoConnect: true,
      highlightColor: '#3b82f6',
      showNotifications: true
    });
    
    // Open options page
    chrome.runtime.openOptionsPage();
  }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('🔄 MCP Pointer extension started');
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Background received message:', message.type, sender.tab?.id);
  
  switch (message.type) {
    case 'element_selected':
      handleElementSelected(message.data, sender.tab?.id);
      return true; // Keep message channel open for async response
      
    case 'toggle_targeting':
      handleToggleTargeting(message.isTargeting, sender.tab?.id);
      return true;
      
    case 'clear_element':
      handleClearElement(sender.tab?.id);
      return true;
      
    case 'get_extension_info':
      sendResponse({
        version: chrome.runtime.getManifest().version,
        id: chrome.runtime.id,
        name: chrome.runtime.getManifest().name
      });
      return true;
      
    case 'get_settings':
      chrome.storage.local.get([
        'serverUrl',
        'httpServerUrl',
        'autoConnect',
        'highlightColor',
        'showNotifications'
      ], (settings) => {
        sendResponse(settings);
      });
      return true; // Keep message channel open for async response
      
    case 'update_settings':
      chrome.storage.local.set(message.settings, () => {
        sendResponse({ success: true });
      });
      return true; // Keep message channel open for async response
      
    default:
      console.warn('Unknown message type:', message.type);
      return false;
  }
});

// Handle tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Inject content script if needed
    injectContentScript(tabId);
  }
});

// Handle tab activation
chrome.tabs.onActivated.addListener((activeInfo) => {
  // Update badge or perform other actions
  updateBadge(activeInfo.tabId);
});

// Handle extension icon click
chrome.action.onClicked.addListener(() => {
  // Open popup (handled by manifest)
  console.log('🎯 Extension icon clicked');
});

// Handle context menu (if needed)
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'mcp-pointer-select-element' && tab?.id) {
    // Trigger element selection
    chrome.tabs.sendMessage(tab.id, {
      type: 'start_targeting'
    });
  }
});

// Create context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'mcp-pointer-select-element',
    title: 'Select Element with MCP Pointer',
    contexts: ['page']
  });
});

// Helper functions
async function handleElementSelected(elementData: TargetedElement, tabId?: number) {
  console.log('🎯 Element selected:', elementData.selector);
  
  // Store element data
  const result = await chrome.storage.local.get(['elementHistory']);
  const history = result.elementHistory || [];
  
  // Add to history (limit to 100 items)
  history.unshift({
    ...elementData,
    timestamp: Date.now(),
    tabId
  });
  
  if (history.length > 100) {
    history.splice(100);
  }
  
  await chrome.storage.local.set({ elementHistory: history });
  
  // Update badge
  if (tabId) {
    updateBadge(tabId);
  }
  
  // Show notification if enabled
  const settings = await chrome.storage.local.get(['showNotifications']);
  if (settings.showNotifications) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon-48.png',
      title: 'Element Selected',
      message: `${elementData.tagName} element selected`
    });
  }
}

async function handleToggleTargeting(isTargeting: boolean, tabId?: number) {
  console.log('🎯 Targeting toggled:', isTargeting);
  
  if (tabId) {
    try {
      await chrome.tabs.sendMessage(tabId, {
        type: 'toggle_targeting',
        isTargeting
      });
    } catch (error) {
      console.error('Failed to send targeting message:', error);
    }
  }
}

async function handleClearElement(tabId?: number) {
  console.log('🧹 Element cleared');
  
  if (tabId) {
    try {
      await chrome.tabs.sendMessage(tabId, {
        type: 'clear_element'
      });
    } catch (error) {
      console.error('Failed to send clear message:', error);
    }
  }
}

async function injectContentScript(tabId: number) {
  try {
    // Check if content script is already injected
    await chrome.tabs.sendMessage(tabId, { type: 'ping' });
  } catch (error) {
    // Content script not injected, inject it
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js']
      });
      console.log('✅ Content script injected into tab', tabId);
    } catch (injectError) {
      console.error('Failed to inject content script:', injectError);
    }
  }
}

async function updateBadge(tabId?: number) {
  if (!tabId) return;
  
  try {
    const result = await chrome.storage.local.get(['elementHistory']);
    const history = result.elementHistory || [];
    const tabElements = history.filter((el: any) => el.tabId === tabId);
    
    if (tabElements.length > 0) {
      chrome.action.setBadgeText({
        text: tabElements.length.toString(),
        tabId
      });
      chrome.action.setBadgeBackgroundColor({
        color: '#3b82f6',
        tabId
      });
    } else {
      chrome.action.setBadgeText({
        text: '',
        tabId
      });
    }
  } catch (error) {
    console.error('Failed to update badge:', error);
  }
}

// Initialize
console.log('🚀 MCP Pointer background script loaded');

