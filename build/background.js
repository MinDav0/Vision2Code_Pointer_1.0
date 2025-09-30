// MCP Pointer Background Script
console.log('MCP Pointer background script loaded');

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('MCP Pointer extension installed:', details);
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  
  if (request.action === 'getServerConfig') {
    // Return server configuration
    sendResponse({
      serverUrl: 'http://localhost:7007',
      webrtcUrl: 'ws://localhost:7008'
    });
  }
  
  if (request.action === 'testServerConnection') {
    // Test server connection from background script
    fetch(request.url)
      .then(response => response.json())
      .then(data => {
        sendResponse({ ok: true, data: data });
      })
      .catch(error => {
        console.error('Server connection test failed:', error);
        sendResponse({ ok: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  }
  
  // Note: Chrome extensions cannot programmatically open popups
  // The popup will show element info when manually opened
  
  if (request.action === 'elementSelected') {
    // Handle element selection - store it and send to server
    console.log('Element selected:', request.element);
    
    // Store the selected element for the popup to display
    chrome.storage.local.set({ lastSelectedElement: request.element });
    
    // Send to server (optional - for AI analysis)
    fetch('http://localhost:7007/api/elements/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        element: request.element,
        url: sender.tab?.url,
        timestamp: new Date().toISOString()
      })
    }).catch(error => {
      console.log('Server not available for element analysis:', error);
    });
    
    sendResponse({ success: true });
  }
  
  return true; // Keep message channel open for async response
});
