// MCP Pointer Popup Script
console.log('MCP Pointer popup loaded');

const elements = {
    serverStatus: document.getElementById('serverStatus'),
    webrtcStatus: document.getElementById('webrtcStatus'),
    targetingStatus: document.getElementById('targetingStatus'),
    startTargeting: document.getElementById('startTargeting'),
    stopTargeting: document.getElementById('stopTargeting'),
    checkServer: document.getElementById('checkServer'),
    openSettings: document.getElementById('openSettings')
};

let isTargeting = false;
let serverConfig = null;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Popup DOM loaded');
    await checkServerStatus();
    setupEventListeners();
    setupDragFunctionality();
    
    // Check if we have a selected element to show
    await checkForSelectedElement();
});

function setupEventListeners() {
    elements.startTargeting.addEventListener('click', startTargeting);
    elements.stopTargeting.addEventListener('click', stopTargeting);
    elements.checkServer.addEventListener('click', checkServerStatus);
    elements.openSettings.addEventListener('click', openSettings);
    
    // Add window button if it doesn't exist
    if (!document.getElementById('openWindow')) {
        const windowBtn = document.createElement('button');
        windowBtn.id = 'openWindow';
        windowBtn.className = 'btn';
        windowBtn.textContent = '🪟 Open as Window';
        windowBtn.addEventListener('click', openAsWindow);
        document.querySelector('.controls').appendChild(windowBtn);
    }
}

async function checkServerStatus() {
    try {
        elements.serverStatus.textContent = 'Checking...';
        elements.serverStatus.className = 'status-value';
        
        // Get server config from background script
        const response = await chrome.runtime.sendMessage({ action: 'getServerConfig' });
        serverConfig = response;
        
        console.log('Server config:', serverConfig);
        
        // Test server connection through background script
        const healthResponse = await chrome.runtime.sendMessage({ 
            action: 'testServerConnection',
            url: `${serverConfig.serverUrl}/health`
        });
        
        if (healthResponse && healthResponse.ok) {
            elements.serverStatus.textContent = 'Connected';
            elements.serverStatus.className = 'status-value status-connected';
            console.log('Server health:', healthResponse.data);
        } else {
            throw new Error('Server not responding');
        }
        
        // Test WebRTC config through background script
        const webrtcResponse = await chrome.runtime.sendMessage({ 
            action: 'testServerConnection',
            url: `${serverConfig.serverUrl}/webrtc/config`
        });
        
        if (webrtcResponse && webrtcResponse.ok) {
            elements.webrtcStatus.textContent = 'Ready';
            elements.webrtcStatus.className = 'status-value status-connected';
        } else {
            throw new Error('WebRTC not available');
        }
        
    } catch (error) {
        console.error('Server check failed:', error);
        elements.serverStatus.textContent = 'Disconnected';
        elements.serverStatus.className = 'status-value status-disconnected';
        elements.webrtcStatus.textContent = 'Unavailable';
        elements.webrtcStatus.className = 'status-value status-disconnected';
    }
}

async function startTargeting() {
    try {
        // Get current tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Check if we're on a valid webpage
        if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('moz-extension://')) {
            alert('Please navigate to a regular webpage (not a Chrome internal page) to use element targeting.');
            return;
        }
        
        // Try to inject content script if not already present
        try {
            await chrome.tabs.sendMessage(tab.id, { action: 'ping' });
        } catch (injectError) {
            console.log('Content script not found, injecting...');
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            });
            // Wait a moment for injection to complete
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Send message to content script to start targeting
        await chrome.tabs.sendMessage(tab.id, { action: 'startTargeting' });
        
        isTargeting = true;
        elements.startTargeting.classList.add('hidden');
        elements.stopTargeting.classList.remove('hidden');
        elements.targetingStatus.textContent = 'Active';
        elements.targetingStatus.className = 'status-value status-connected';
        
        console.log('Targeting started - closing popup');
        
        // Close the popup to allow element selection
        window.close();
    } catch (error) {
        console.error('Failed to start targeting:', error);
        alert('Failed to start targeting. Make sure you are on a valid webpage and the extension has permission to access it.');
    }
}

async function checkForSelectedElement() {
    try {
        // Check if we have a recent element selection
        const result = await chrome.storage.local.get(['lastSelectedElement']);
        if (result.lastSelectedElement) {
            showSelectedElement(result.lastSelectedElement);
            // Clear the stored element after showing it
            chrome.storage.local.remove(['lastSelectedElement']);
        }
    } catch (error) {
        console.error('Error checking for selected element:', error);
    }
}

function showSelectedElement(element) {
    // Update the targeting status to show selected element
    elements.targetingStatus.textContent = 'Element Selected';
    elements.targetingStatus.className = 'status-value status-connected';
    
    // Show element info in a simple way
    const elementInfo = document.createElement('div');
    elementInfo.className = 'element-info';
    elementInfo.innerHTML = `
        <h4>🎯 Selected Element:</h4>
        <p><strong>Tag:</strong> ${element.tagName}</p>
        <p><strong>ID:</strong> ${element.id || 'None'}</p>
        <p><strong>Class:</strong> ${element.className || 'None'}</p>
        <p><strong>Text:</strong> ${element.textContent?.substring(0, 50)}${element.textContent?.length > 50 ? '...' : ''}</p>
        <p><strong>Selector:</strong> ${element.selector}</p>
    `;
    
    // Insert after the targeting status
    elements.targetingStatus.parentNode.insertBefore(elementInfo, elements.targetingStatus.nextSibling);
    
    // Reset targeting state
    isTargeting = false;
    elements.startTargeting.classList.remove('hidden');
    elements.stopTargeting.classList.add('hidden');
}

async function stopTargeting() {
    try {
        // Send message to content script to stop targeting
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        await chrome.tabs.sendMessage(tab.id, { action: 'stopTargeting' });
        
        isTargeting = false;
        elements.startTargeting.classList.remove('hidden');
        elements.stopTargeting.classList.add('hidden');
        elements.targetingStatus.textContent = 'Ready';
        elements.targetingStatus.className = 'status-value';
        
        console.log('Targeting stopped');
    } catch (error) {
        console.error('Failed to stop targeting:', error);
    }
}

function openSettings() {
    // Open extension options page
    chrome.runtime.openOptionsPage();
}

// Open as overlay on webpage
function openAsWindow() {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.scripting.executeScript({
            target: {tabId: tabs[0].id},
            func: injectOverlay
        });
    });
}

function injectOverlay() {
    // Remove existing overlay if any
    const existing = document.getElementById('mcp-pointer-overlay');
    if (existing) {
        existing.remove();
        return;
    }
    
    // Create iframe for the overlay
    const iframe = document.createElement('iframe');
    iframe.id = 'mcp-pointer-overlay';
    iframe.src = chrome.runtime.getURL('overlay.html');
    iframe.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 350px;
        height: 500px;
        border: none;
        border-radius: 15px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        z-index: 999999;
        background: transparent;
    `;
    
    document.body.appendChild(iframe);
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'elementSelected') {
        console.log('Element selected:', request.element);
        // Here you could send the element info to the MCP server
        // or display it in the popup
    }
});

// Drag functionality
function setupDragFunctionality() {
    const dragHandle = document.querySelector('.drag-handle');
    const body = document.body;
    let isDragging = false;
    let startX, startY, startLeft, startTop;

    dragHandle.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        
        // Get current position
        const rect = body.getBoundingClientRect();
        startLeft = rect.left;
        startTop = rect.top;
        
        body.style.position = 'fixed';
        body.style.left = startLeft + 'px';
        body.style.top = startTop + 'px';
        body.style.zIndex = '9999';
        
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        body.style.left = (startLeft + deltaX) + 'px';
        body.style.top = (startTop + deltaY) + 'px';
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
}
