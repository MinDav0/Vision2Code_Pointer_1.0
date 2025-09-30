// MCP Pointer Content Script
console.log('MCP Pointer content script loaded');

// Element targeting functionality
let isTargeting = false;
let highlightedElement = null;

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ping') {
    sendResponse({ success: true, message: 'Content script is ready' });
  } else if (request.action === 'startTargeting') {
    startElementTargeting();
    sendResponse({ success: true });
  } else if (request.action === 'stopTargeting') {
    stopElementTargeting();
    sendResponse({ success: true });
  } else if (request.action === 'getElementInfo') {
    const element = document.elementFromPoint(request.x, request.y);
    if (element) {
      sendResponse({
        tagName: element.tagName,
        id: element.id,
        className: element.className,
        textContent: element.textContent?.substring(0, 100),
        selector: generateSelector(element)
      });
    }
  }
});

function startElementTargeting() {
  isTargeting = true;
  document.addEventListener('mouseover', highlightElement);
  document.addEventListener('click', selectElement);
  document.body.style.cursor = 'crosshair';
}

function stopElementTargeting() {
  isTargeting = false;
  document.removeEventListener('mouseover', highlightElement);
  document.removeEventListener('click', selectElement);
  document.body.style.cursor = 'default';
  if (highlightedElement) {
    highlightedElement.style.outline = '';
  }
}

function highlightElement(event) {
  if (!isTargeting) return;
  
  if (highlightedElement) {
    highlightedElement.style.outline = '';
  }
  
  highlightedElement = event.target;
  highlightedElement.style.outline = '2px solid #007bff';
}

function selectElement(event) {
  if (!isTargeting) return;
  
  event.preventDefault();
  event.stopPropagation();
  
  const element = event.target;
  const elementInfo = {
    tagName: element.tagName,
    id: element.id,
    className: element.className,
    textContent: element.textContent?.substring(0, 100),
    selector: generateSelector(element),
    xpath: getXPath(element)
  };
  
  // Send element info to background script
  chrome.runtime.sendMessage({
    action: 'elementSelected',
    element: elementInfo
  });
  
  stopElementTargeting();
  
  // Show a notification that element was selected
  showElementSelectedNotification(elementInfo);
}

function generateSelector(element) {
  if (element.id) {
    return `#${element.id}`;
  }
  
  let selector = element.tagName.toLowerCase();
  if (element.className) {
    selector += '.' + element.className.split(' ').join('.');
  }
  
  return selector;
}

function getXPath(element) {
  if (element.id) {
    return `//*[@id="${element.id}"]`;
  }
  
  const path = [];
  while (element && element.nodeType === Node.ELEMENT_NODE) {
    let selector = element.nodeName.toLowerCase();
    if (element.previousElementSibling) {
      let index = 1;
      let sibling = element.previousElementSibling;
      while (sibling) {
        if (sibling.nodeName === element.nodeName) {
          index++;
        }
        sibling = sibling.previousElementSibling;
      }
      selector += `[${index}]`;
    }
    path.unshift(selector);
    element = element.parentElement;
  }
  
  return '/' + path.join('/');
}

function showElementSelectedNotification(elementInfo) {
  // Create a temporary notification overlay
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #007bff;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    max-width: 300px;
    cursor: pointer;
  `;
  
  notification.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 4px;">🎯 Element Selected!</div>
    <div style="font-size: 12px; opacity: 0.9;">
      <strong>${elementInfo.tagName}</strong>
      ${elementInfo.id ? `<br>ID: ${elementInfo.id}` : ''}
      ${elementInfo.className ? `<br>Class: ${elementInfo.className}` : ''}
    </div>
    <div style="font-size: 11px; margin-top: 8px; opacity: 0.8;">
      Click extension icon to see details
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Auto-remove after 4 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 4000);
  
  // Click to remove
  notification.addEventListener('click', () => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  });
}
