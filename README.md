<img width="1440" height="480" alt="MCP Pointer banner" src="https://github.com/user-attachments/assets/a36d2666-e848-4a80-97b3-466897b244f7" />

[![CI](https://github.com/etsd-tech/mcp-pointer/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/etsd-tech/mcp-pointer/actions/workflows/ci.yml)
[![Release](https://github.com/etsd-tech/mcp-pointer/actions/workflows/release.yml/badge.svg?branch=main)](https://github.com/etsd-tech/mcp-pointer/actions/workflows/release.yml)
[![npm version](https://img.shields.io/npm/v/@mcp-pointer/server?label=Server)](https://www.npmjs.com/package/@mcp-pointer/server)
[![Chrome Extension](https://img.shields.io/github/package-json/v/etsd-tech/mcp-pointer?filename=packages%2Fchrome-extension%2Fpackage.json&label=Chrome-Extension)](https://github.com/etsd-tech/mcp-pointer/releases)
[![License: MIT](https://img.shields.io/github/license/etsd-tech/mcp-pointer?label=License)](https://github.com/etsd-tech/mcp-pointer/blob/main/LICENSE)

# 👆 MCP Pointer v2.0

**Secure, modern element targeting for agentic coding tools via MCP!**

MCP Pointer v2.0 is a **security-first**, production-ready tool combining an MCP Server with a Chrome Extension:

1. **🖥️ MCP Server** (Bun + TypeScript) - Secure server with database, authentication, and WebRTC
2. **🌐 Chrome Extension** - Modern extension with React and real-time communication
3. **🗄️ Database System** - SQLite with migrations, user management, and audit logging
4. **🔒 Security Framework** - Comprehensive security with ESLint, input validation, and monitoring

The system provides **secure, real-time element targeting** for AI tools like Claude Code, Cursor, and Windsurf through the Model Context Protocol.

## ✨ Features

### **Core Functionality**
- 🎯 **`Option+Click` Selection** - Visual element targeting in browser
- 📋 **Complete Element Data** - Text, CSS, attributes, positioning, and styling
- ⚛️ **React Component Detection** - Component names and source files
- 🔗 **WebRTC Communication** - Real-time, low-latency data transfer
- 🤖 **MCP Compatible** - Works with Claude Code, Cursor, and Windsurf

### **Security & Production Features**
- 🔒 **Authentication System** - JWT-based user authentication
- 🗄️ **Database Management** - SQLite with migrations and seeding
- 📊 **Audit Logging** - Complete security event tracking
- 🛡️ **Input Validation** - Zod schemas for all data validation
- 🔍 **Security Scanning** - ESLint with 20+ security rules
- ⚡ **Performance** - Bun runtime with optimized builds

## 📊 **Current Status**

**Phase 4: 100% Complete** - Full AI integration with Cursor AI and end-to-end testing complete

### ✅ **Completed**
- **Phase 1:** Foundation, security setup, ESLint configuration
- **Phase 2:** All core services implemented
- **Phase 3:** Chrome extension with React components and WebRTC client
- **Phase 4:** AI integration with Cursor AI and comprehensive testing
- **Database System:** SQLite with migrations, user management, audit logging
- **Authentication:** JWT-based user authentication with role-based access
- **WebRTC System:** Real-time communication with WebSocket server
- **MCP System:** AI tool integration with 5 comprehensive tools
- **API System:** 20+ secure endpoints with full CRUD operations
- **AI Integration:** Cursor AI service with real-time element analysis
- **End-to-End Testing:** Complete flow from extension to AI analysis verified
- **Security:** Input validation, SQL injection prevention, audit logging, rate limiting

### 🔄 **Next Phase**
- **Production Deployment:** Native deployment (current setup), CI/CD pipeline, monitoring
- **Advanced Features:** Multi-user support, analytics dashboard, export functionality
- **Testing & Deployment:** Comprehensive testing and CI/CD

### ⏳ **Pending**
- **Testing Framework:** Comprehensive unit and integration tests
- **CI/CD Pipeline:** Automated testing and deployment

## 🎬 Usage example (video)

https://github.com/user-attachments/assets/98c4adf6-1f05-4c9b-be41-0416ab784e2c

See MCP Pointer in action: `Option+Click` any element in your browser, then ask your agentic coding tool about it (in this example, Claude Code). The AI gets complete textual context about the selected DOM element including CSS properties, url, selector, and more.

## 🚀 Getting Started

### 1. Install Chrome Extension

**🎉 Now available on Chrome Web Store!**

[![Install from Chrome Web Store](https://img.shields.io/badge/Chrome_Web_Store-Install-blue?style=for-the-badge&logo=google-chrome)](https://chromewebstore.google.com/detail/mcp-pointer/jfhgaembhafbffidedhpkmnaajdfeiok)

Simply click the link above to install from the Chrome Web Store.

<details>
<summary>Alternative: Manual Installation</summary>

**Option A: Download from Releases**

1. Go to [GitHub Releases](https://github.com/etsd-tech/mcp-pointer/releases)
2. Download `mcp-pointer-chrome-extension.zip` from the latest release
3. Extract the zip file to a folder on your computer
4. Open Chrome → Settings → Extensions → Developer mode (toggle ON)
5. Click "Load unpacked" and select the extracted folder
6. The MCP Pointer extension should appear in your extensions list
7. **Reload web pages** to activate the extension

**Option B: Build from Source**

1. Clone this repository
2. Follow the build instructions in [CONTRIBUTING.md](./CONTRIBUTING.md)
3. Open Chrome → Settings → Extensions → Developer mode (toggle ON)
4. Click "Load unpacked" and select the `packages/chrome-extension/dist/` folder
5. **Reload web pages** to activate the extension

</details>

### 2. Configure MCP Server

One command setup for your AI tool:

```bash
npx -y @mcp-pointer/server config claude  # or cursor, windsurf, and others - see below
```

<details>
<summary>Other AI Tools & Options</summary>

```bash
# For other AI tools
npx -y @mcp-pointer/server config cursor     # Opens Cursor deeplink for automatic installation
npx -y @mcp-pointer/server config windsurf   # Automatically updates Windsurf config file
npx -y @mcp-pointer/server config manual     # Shows manual configuration for other tools
```

> **Optional:** You can install globally with `npm install -g @mcp-pointer/server` to use `mcp-pointer` instead of `npx -y @mcp-pointer/server`

</details>

After configuration, **restart your coding tool** to load the MCP connection.

> **🔄 Already using MCP Pointer?** Run the config command again to update to auto-updating configuration:
> ```bash
> npx -y @mcp-pointer/server config <your-tool>  # Reconfigures to always use latest version
> ```

### 3. Start Using

1. **Navigate to any webpage** 
2. **`Option+Click`** any element to select it
3. **Ask your AI** to analyze the targeted element!

Your AI tool will automatically start the MCP server when needed using the `npx -y @mcp-pointer/server@latest start` command.

**Available MCP Tool:**
- `get-pointed-element` - Get textual information about the currently pointed DOM element from the browser extension

## 🎯 How It Works

1. **Element Selection**: Content script captures `Option+Click` events
2. **Data Extraction**: Analyzes element structure, CSS, and framework info
3. **WebSocket Transport**: Sends data to MCP server on port 7007
4. **MCP Protocol**: Makes data available to AI tools via MCP tools
5. **AI Analysis**: Your assistant can now see and analyze the element!

## 🎨 Element Data Extracted

- **Basic Info**: Tag name, ID, classes, text content
- **CSS Properties**: Display, position, colors, dimensions
- **Component Info**: React component names and source files (experimental)  
- **Attributes**: All HTML attributes
- **Position**: Exact coordinates and dimensions
- **Source Hints**: File paths and component origins

## 🔍 Framework Support

- ⚛️ **React** - Component names and source files via Fiber (experimental)
- 📦 **Generic HTML/CSS/JS** - Full support for any web content
- 🔮 **Planned** - Vue component detection (PRs appreciated)

## 🌐 Browser Support

- ✅ **Chrome** - Full support (tested)
- 🟡 **Chromium-based browsers** - Should work (Edge, Brave, Arc - load built extension manually)

## 🐛 Troubleshooting

### Extension Not Connecting

1. Make sure MCP server is running: `npx -y @mcp-pointer/server@latest start`
2. Check browser console for WebSocket errors
3. Verify port 7007 is not blocked by firewall

### MCP Tools Not Available

1. Restart your AI assistant after installing
2. Check MCP configuration: `mcp-pointer config <your-tool>`  
3. Verify server is running: `npx -y @mcp-pointer/server@latest start`

### Elements Not Highlighting

1. Some pages block content scripts (chrome://, etc.)
2. Try refreshing the page
3. Check if targeting is enabled (click extension icon)

## 🚀 Roadmap

### 1. **Dynamic Context Control**
   - Full raw context transferred to server
   - LLM-configurable detail levels (visible text only, all text, CSS levels)
   - Progressive refinement options / token-conscious data fetching

### 2. **Visual Content Support** (for multimodal LLMs)
   - Base64 encoding for images (img tags)
   - Screenshot capture of selected elements
   - Separate MCP tool for direct visual content retrieval

### 3. **Enhanced Framework Support**
   - Vue.js component detection
   - Better React support (React 19 removed `_debugSource`, affecting source mapping in dev builds)

### 4. **Multi Select**
   - Having the ability to select multiple DOM elements
   - https://github.com/etsd-tech/mcp-pointer/pull/9

## 🚀 **Deployment Options**

### **✅ Recommended: Native Deployment (Current Setup)**

**Resource Usage:**
- **Memory:** ~80MB total (Server: 50MB, Web: 20MB, DB: 10MB)
- **CPU:** Minimal overhead
- **Disk:** ~100MB for application files

**Perfect for:**
- Single server deployments
- Development and testing
- Resource-constrained environments
- Simple production setups

**Current Status:** ✅ **Production Ready**
- Server running on Bun runtime
- SQLite database (no external dependencies)
- Web interface with Node.js
- All services operational

### **🐳 Optional: Docker Deployment**

**Resource Usage:**
- **Memory:** ~230MB total (+150MB Docker overhead)
- **CPU:** 1-5% additional overhead
- **Disk:** +200-500MB for base images

**Consider Docker when you need:**
- Multiple environments (dev/staging/prod)
- Easy scaling across multiple servers
- Team deployment consistency
- CI/CD automation
- Container orchestration (Kubernetes)

**When NOT to use Docker:**
- Single server deployment
- Resource-constrained environments
- Simple production setup
- Development and testing

### **🎯 Our Recommendation**

**Stick with the current native setup** because:
- ✅ **More efficient** - 3x less memory usage
- ✅ **Simpler maintenance** - no container complexity
- ✅ **Faster startup** - no container overhead
- ✅ **Production ready** - all features working
- ✅ **Easy debugging** - direct process access

**Docker can be added later** if scaling requirements change.

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](./CONTRIBUTING.md) guide for development setup and guidelines.

---

*Inspired by tools like [Click-to-Component](https://github.com/ericclemmons/click-to-component) for component development workflows.*

---

**Made with ❤️ for AI-powered web development**

*Now your AI can analyze any element you point at with `Option+Click`! 👆*
