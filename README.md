# 🎯 MCP Pointer v2.2

**Production-ready element targeting for AI-assisted web development**

A complete Chrome extension and MCP server system that enables precise element selection and AI-powered analysis for modern web development workflows.

## ✨ Features

- **🎯 Element Targeting**: Click-to-select any DOM element with visual feedback
- **🤖 AI Integration**: Real-time analysis powered by Cursor AI
- **🔒 Security-First**: JWT authentication, secure database, audit logging
- **⚡ High Performance**: Bun runtime, WebRTC communication, optimized queries
- **🌐 Cross-Platform**: Works across Windows, macOS, and Linux
- **📱 Modern UI**: Clean, responsive dark theme interface

## 🚀 Quick Start

### Prerequisites
- Bun runtime (recommended) or Node.js 18+
- Chrome browser
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/MinDav0/Vision2Code_Pointer_1.0.git
   cd Vision2Code_Pointer_1.0
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment**
   ```bash
   cp env.template .env
   # Edit .env with your secure JWT secret and admin password
   ```

4. **Initialize database**
   ```bash
   cd packages/server
   bun run db:init
   ```

5. **Start the server**
   ```bash
   bun run dev
   ```

6. **Load Chrome extension**
   ```bash
   # Download the extension package (requires VirtualBox port forwarding)
   scp -P 2222 sysadmin@127.0.0.1:/home/sysadmin/Vision2Code_Pointer_1.0/mcp-pointer-extension-v2.2-fresh.tar.gz "C:\Users\Workspace\Desktop\VM Ubunut Dev\Extension"
   ```
   - Extract `mcp-pointer-extension-v2.2-fresh.tar.gz`
   - Open Chrome → Extensions → Developer mode
   - Click "Load unpacked" → Select the `build/` folder

   **Note:** This command requires VirtualBox port forwarding configured:
   - SSH: Host Port 2222 → Guest Port 22
   - See `CROSS_PLATFORM_SETUP.md` for complete VirtualBox configuration

## 📖 Usage

### Web Interface
- Navigate to `http://localhost:3001`
- Login: `admin@mcp-pointer.local`
- Password: (set in your .env file)

### Chrome Extension
1. Click the MCP Pointer icon in your browser
2. Click "🎯 Start Targeting"
3. Hover over elements to highlight them
4. Click to select an element
5. View AI analysis results

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Chrome         │    │  MCP Server      │    │  AI Services    │
│  Extension      │◄──►│  (Bun Runtime)   │◄──►│  (Cursor AI)    │
│                 │    │                  │    │                 │
│ • Element       │    │ • Authentication │    │ • Analysis      │
│   Targeting     │    │ • WebRTC         │    │ • Suggestions   │
│ • Visual        │    │ • Database       │    │ • Code Examples │
│   Feedback      │    │ • API Routes     │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🔧 Configuration

### Environment Variables
```bash
# Server Configuration
PORT=7007
HOST=0.0.0.0

# Database
DATABASE_PATH=./data/mcp-pointer.db

# Security (REQUIRED - Generate secure values)
JWT_SECRET=your-super-secure-jwt-secret-here
DEFAULT_ADMIN_PASSWORD=your-secure-admin-password

# AI Services (Optional)
CURSOR_WORKSPACE_PATH=/path/to/workspace
CURSOR_EXTENSION_ID=your-extension-id
```

## 📚 API Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/health` | GET | Server health check | ❌ |
| `/auth/login` | POST | User authentication | ❌ |
| `/api/status` | GET | System status | ✅ |
| `/api/elements/analyze` | POST | Element analysis | ✅ |
| `/webrtc/config` | GET | WebRTC configuration | ❌ |

## 🛠️ Development

### Project Structure
```
Vision2Code_Pointer_1.0/
├── packages/
│   ├── server/          # MCP Server (Bun)
│   ├── chrome-extension/ # Chrome Extension
│   └── web/             # Web Interface
├── docs/                # Documentation
└── scripts/             # Build scripts
```

### Available Scripts
```bash
# Development
bun run dev              # Start all services
bun run dev:server       # Start server only
bun run dev:extension    # Build extension

# Database
bun run db:init          # Initialize database
bun run db:migrate       # Run migrations
bun run db:seed          # Seed data

# Production
bun run build            # Build all packages
bun run start            # Start production server
```

## 🔒 Security

- **Authentication**: JWT tokens with secure expiration
- **Database**: SQLite with WAL mode and secure delete
- **API**: Rate limiting and input validation
- **Secrets**: Environment variable management (no hardcoded secrets)
- **Audit**: Comprehensive logging and monitoring

## 🚀 Deployment

### Production Setup
1. Set production environment variables
2. Configure reverse proxy (nginx/Apache)
3. Set up SSL certificates
4. Configure firewall rules
5. Set up monitoring and logging

### Cross-Platform Setup
For Windows Chrome → Ubuntu VM setup, see `CROSS_PLATFORM_SETUP.md`

## 📊 Current Status

- ✅ **Phase 1**: Core Architecture - Complete
- ✅ **Phase 2**: Backend Services - Complete  
- ✅ **Phase 3**: Chrome Extension - Complete
- ✅ **Phase 4**: AI Integration - Complete
- ✅ **Security**: All hardcoded secrets removed
- ✅ **Documentation**: Comprehensive guides created

## 🎯 Extension Deployment

### Standard Command
```bash
scp -P 2222 sysadmin@127.0.0.1:/home/sysadmin/Vision2Code_Pointer_1.0/mcp-pointer-extension-v2.2-fresh.tar.gz "C:\Users\Workspace\Desktop\VM Ubunut Dev\Extension"
```

### Installation Steps
1. Run the SCP command above on Windows
2. Extract the .tar.gz file in the Extension folder
3. **Remove old extension first** to avoid conflicts and caching issues
4. Load the `build/` folder as unpacked extension in Chrome

**⚠️ Important:** Always remove the old extension before loading a new version to prevent Chrome caching issues that can cause connection problems.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the project documentation files
- **Issues**: GitHub Issues
- **Cross-Platform Setup**: `CROSS_PLATFORM_SETUP.md`
- **Security Guide**: `SECURITY.md`

---

**Built with ❤️ for the AI development community**

**Version 2.2 - Production Ready** 🚀