# 🌐 Cross-Platform Setup: Windows 11 Chrome → Ubuntu VM

## 📋 **Your Setup**
- **App Server:** Ubuntu VM (IP: 10.0.2.15)
- **Chrome Browser:** Windows 11 Host
- **Network:** VM Host Network

---

## 🔧 **Step 1: Network Configuration**

### **✅ Server Status (Already Done)**
Your server is already configured correctly:
- **Server:** `0.0.0.0:7007` ✅ (accessible from host)
- **Web Interface:** `0.0.0.0:3001` ✅ (accessible from host)
- **WebRTC:** `*:7008` ✅ (accessible from host)

### **🔍 Test Connectivity from Windows**
Open Command Prompt on Windows 11 and test:
```cmd
# Test server connectivity
curl http://10.0.2.15:7007/health

# Test web interface
curl http://10.0.2.15:3001
```

---

## 🧩 **Step 2: Chrome Extension Setup**

### **📁 Copy Extension to Windows**
1. **Copy extension folder** from VM to Windows:
   ```bash
   # On Ubuntu VM, create a zip file
   cd /home/sysadmin/Vision2Code_Pointer_1.0/packages/chrome-extension
   zip -r mcp-pointer-extension.zip build/
   ```

2. **Transfer to Windows** (via shared folder, SCP, or USB)

### **🔧 Load Extension in Chrome**
1. **Open Chrome** on Windows 11
2. **Go to:** `chrome://extensions/`
3. **Enable:** "Developer mode" (top right toggle)
4. **Click:** "Load unpacked"
5. **Select:** The `build/` folder you copied from VM

---

## 🌐 **Step 3: Update Extension Configuration**

### **📝 Update Manifest Permissions**
The extension needs to know about your VM IP. Update the manifest:

```json
{
  "host_permissions": [
    "http://localhost:7007/*",
    "http://10.0.2.15:7007/*",  // ← Add this line
    "https://*/*"
  ]
}
```

### **🔧 Update Extension Code**
In the extension's WebRTC client, update the server URL:
```typescript
// Change from localhost to VM IP
const SERVER_URL = 'ws://10.0.2.15:7008';
const API_BASE = 'http://10.0.2.15:7007';
```

---

## 🧪 **Step 4: Testing**

### **1️⃣ Test Web Interface**
Open in Chrome on Windows:
```
http://10.0.2.15:3001
```
- Login: `admin@mcp-pointer.local`
- Password: `admin123`

### **2️⃣ Test Extension**
1. **Load extension** in Chrome
2. **Go to any website** (e.g., google.com)
3. **Click extension icon** in toolbar
4. **Try element selection** (Option+Click or extension button)

### **3️⃣ Test API Connection**
Open Chrome DevTools (F12) and test:
```javascript
// Test API connection
fetch('http://10.0.2.15:7007/health')
  .then(r => r.json())
  .then(console.log);
```

---

## 🔥 **Step 5: Firewall Configuration**

### **Windows 11 Firewall**
1. **Open:** Windows Defender Firewall
2. **Allow:** Outbound connections to `10.0.2.15:7007`
3. **Allow:** Outbound connections to `10.0.2.15:7008`

### **VM Network Settings**
Ensure your VM network allows:
- **Port 7007** (HTTP API)
- **Port 7008** (WebRTC)
- **Port 3001** (Web Interface)

---

## 🚨 **Troubleshooting**

### **❌ Connection Refused**
```bash
# Check if server is accessible from Windows
ping 10.0.2.15
telnet 10.0.2.15 7007
```

### **❌ Extension Not Loading**
- Check Chrome console for errors
- Verify manifest.json syntax
- Ensure all files copied correctly

### **❌ Extension Shows "Disconnected" Despite Server Running**
**This is a Chrome extension caching issue!** 🔧

**Solution:**
1. **Remove the old extension** completely from Chrome
2. **Update extension name/version** in manifest.json:
   ```json
   {
     "name": "MCP Pointer v2.1",  // ← Change name
     "version": "2.1.0"           // ← Change version
   }
   ```
3. **Reload the extension** as a "new" extension
4. **Test connection** - should now work!

**Why this happens:** Chrome caches extension configurations and may continue using old IP addresses even after code updates.

### **❌ WebRTC Not Working**
- Check WebRTC port (7008) is open
- Verify WebSocket connection in DevTools
- Check for CORS issues

### **❌ CORS Errors**
Update server CORS configuration:
```typescript
cors: {
  origin: [
    'http://localhost:3000',
    'http://10.0.2.15:3001',
    'chrome-extension://*'  // ← Add this
  ]
}
```

---

## 🎯 **Quick Test Commands**

### **From Windows Command Prompt:**
```cmd
# Test server health
curl http://10.0.2.15:7007/health

# Test web interface
start http://10.0.2.15:3001

# Test API login
curl -X POST http://10.0.2.15:7007/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@mcp-pointer.local\",\"password\":\"admin123\"}"
```

### **From Chrome DevTools:**
```javascript
// Test extension connection
chrome.runtime.sendMessage({action: 'test-connection'});

// Test API
fetch('http://10.0.2.15:7007/api/elements/history')
  .then(r => r.json())
  .then(console.log);
```

---

## ✅ **Success Indicators**

You'll know it's working when:
- ✅ Web interface loads in Chrome on Windows
- ✅ Extension loads without errors
- ✅ Element selection works on webpages
- ✅ AI analysis appears in extension popup
- ✅ WebRTC connection established

---

## 🎉 **Final Setup**

Once everything works:
1. **Bookmark:** `http://10.0.2.15:3001` in Chrome
2. **Pin extension** to Chrome toolbar
3. **Test on multiple websites**
4. **Verify AI analysis** is working

**Your cross-platform setup is complete!** 🚀
