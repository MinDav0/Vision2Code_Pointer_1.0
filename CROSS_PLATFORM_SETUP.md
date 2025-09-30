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

### **📁 Copy Extension to Windows via SSH/SCP**

**Method 1: Direct SCP Transfer (Recommended)**
```bash
# Run this command from Windows Command Prompt or PowerShell
# This uses SSH port forwarding (port 2222) to connect to Ubuntu VM
scp -P 2222 sysadmin@127.0.0.1:/home/sysadmin/Vision2Code_Pointer_1.0/mcp-pointer-extension-v2.2-fresh.tar.gz "C:\Users\Workspace\Desktop\VM Ubunut Dev\Extension"
```

**Method 2: Manual Transfer**
1. **On Ubuntu VM**, create a zip file:
   ```bash
   cd /home/sysadmin/Vision2Code_Pointer_1.0/packages/chrome-extension
   zip -r mcp-pointer-extension.zip build/
   ```

2. **Transfer to Windows** via:
   - **SSH/SCP** (using port 2222)
   - **Shared folder** (if configured)
   - **USB drive** (manual copy)

**SSH Connection Details:**
- **VM IP:** 127.0.0.1 (localhost from Windows perspective)
- **SSH Port:** 2222 (forwarded from VM port 22)
- **Username:** sysadmin
- **Authentication:** Password or SSH key

### **🔧 Load Extension in Chrome**
1. **Open Chrome** on Windows 11
2. **Go to:** `chrome://extensions/`
3. **Enable:** "Developer mode" (top right toggle)
4. **⚠️ IMPORTANT:** Remove any existing MCP Pointer extension first
5. **Click:** "Load unpacked"
6. **Select:** The `build/` folder you copied from VM

### **🔄 Extension Update Workflow**
**When updating the extension:**

1. **Remove old extension** from Chrome completely
2. **Create new extension package** on Ubuntu VM with "fresh" naming
3. **Transfer new package** to Windows via SCP
4. **Load as "new" extension** in Chrome

**Naming Convention:**
- Use `mcp-pointer-extension-v2.2-fresh.tar.gz` for new builds
- The "fresh" suffix helps avoid caching issues
- Each update gets a new "fresh" package name

**Why this is necessary:**
- Chrome caches extension configurations
- Old connections may persist even after code updates
- Version conflicts can cause connection issues
- Fresh installation ensures clean state

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

### **0️⃣ Test SSH Connection First**
Before transferring files, verify SSH connectivity:
```cmd
# Test SSH connection from Windows Command Prompt
ssh -p 2222 sysadmin@127.0.0.1

# Test SCP file transfer
scp -P 2222 sysadmin@127.0.0.1:/home/sysadmin/Vision2Code_Pointer_1.0/README.md "C:\Users\Workspace\Desktop\VM Ubunut Dev\Extension\test.txt"
```

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

### **VirtualBox Port Forwarding Configuration**
Your VirtualBox VM should have the following port forwarding rules configured:

| Name | Protocol | Host IP | Host Port | Guest IP | Guest Port |
|------|----------|---------|-----------|----------|------------|
| **API Server** | TCP | (empty) | 7007 | (empty) | 7007 |
| **NextJS** | TCP | 127.0.0.1 | 3000 | (empty) | 3000 |
| **SSH** | TCP | 127.0.0.1 | 2222 | (empty) | 22 |
| **Web Interface** | TCP | (empty) | 3001 | (empty) | 3001 |
| **WebRTC** | TCP | (empty) | 7008 | (empty) | 7008 |

**To configure these rules in VirtualBox:**
1. **Open VirtualBox Manager**
2. **Select your Ubuntu VM**
3. **Go to:** Settings → Network → Adapter 1 → Advanced → Port Forwarding
4. **Add each rule** as shown in the table above
5. **Click OK** to save the configuration

**Note:** The SSH rule (port 2222) is used for the SCP deployment command:
```bash
scp -P 2222 sysadmin@127.0.0.1:/home/sysadmin/Vision2Code_Pointer_1.0/mcp-pointer-extension-v2.2-fresh.tar.gz "C:\Users\Workspace\Desktop\VM Ubunut Dev\Extension"
```

---

## 🚨 **Troubleshooting**

### **❌ SSH/SCP Connection Issues**
```cmd
# Test SSH connection
ssh -p 2222 sysadmin@127.0.0.1

# If SSH fails, check VirtualBox port forwarding
# Verify port 2222 is forwarded to VM port 22

# Test SCP with verbose output
scp -v -P 2222 sysadmin@127.0.0.1:/home/sysadmin/Vision2Code_Pointer_1.0/README.md "C:\temp\test.txt"
```

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

### **🔄 Extension Update Process (Important!)**
**For every extension update, you MUST:**

1. **Remove old extension** from Chrome completely
2. **Create new extension package** with updated version
3. **Transfer new package** to Windows via SCP
4. **Load as "new" extension** in Chrome

**This prevents caching issues and ensures:**
- ✅ New code changes are applied
- ✅ Updated server connections work
- ✅ No conflicts with old configurations
- ✅ Fresh extension state

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
