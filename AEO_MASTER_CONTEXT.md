# AEO MASTER CONTEXT - MCP Pointer v2.2

## PROJECT OVERVIEW
MCP Pointer v2.2 is a complete element targeting system for AI-assisted web development. It consists of a Chrome extension, MCP server, and web interface running on Ubuntu VM with Windows 11 Chrome client.

## CRITICAL FILES TO READ FOR COMPLETE CONTEXT

### PRIMARY DOCUMENTATION (READ FIRST)
1. README.md - Main project overview and quick start
2. CURRENT_STATUS.md - Current operational status and capabilities
3. PROJECT_SUMMARY.md - Complete project summary and achievements
4. PHASE4_COMPLETION.md - Latest phase completion details

### SETUP AND CONFIGURATION
5. CROSS_PLATFORM_SETUP.md - VirtualBox setup, SSH/SCP workflow, extension deployment
6. DEVELOPMENT_SETUP.md - Development environment setup guide
7. DEPLOYMENT.md - Production deployment instructions

### TECHNICAL ARCHITECTURE
8. ARCHITECTURE.md - System architecture and design
9. ARCHITECTURE_ASSESSMENT.md - Technical assessment and status
10. SECURITY.md - Security implementation and guidelines

### PHASE DOCUMENTATION
11. PHASE2_DATABASE_COMPLETE.md - Database implementation details
12. PHASE2_STATUS.md - Phase 2 completion status
13. PHASE3_SUMMARY.md - Chrome extension development summary

### OPERATIONAL GUIDES
14. FRONTEND_ACCESS_GUIDE.md - Frontend access and testing guide
15. CONTRIBUTING.md - Development workflow and contribution guidelines
16. DOCUMENTATION.md - Documentation structure and maintenance
17. SOP_FRONTEND_ARCHITECTURE.md - MANDATORY frontend architecture standard

## CURRENT SYSTEM STATUS

### RUNNING SERVICES
- Frontend: http://localhost:3001 (Vite dev server)
- MCP Server: http://localhost:7007 (Bun runtime)
- WebRTC: Port 7008
- Database: SQLite with migrations

### VIRTUALBOX CONFIGURATION
- VM IP: 10.0.2.15
- SSH Port: 2222 (forwarded from VM port 22)
- Extension Transfer: SCP command to Windows
- Port Forwarding: 7007, 7008, 3001, 2222

### EXTENSION DEPLOYMENT
- Current Version: mcp-pointer-extension-v2.2-fresh.tar.gz
- Transfer Command: scp -P 2222 sysadmin@127.0.0.1:/home/sysadmin/Vision2Code_Pointer_1.0/mcp-pointer-extension-v2.2-fresh.tar.gz "C:\Users\Workspace\Desktop\VM Ubunut Dev\Extension"
- Installation: Remove old extension first, then load new build/ folder

### KEY TECHNICAL DETAILS
- Runtime: Bun with TypeScript
- Extension Framework: Plasmo (Chrome Manifest v3)
- Database: SQLite with WAL mode
- Authentication: JWT tokens with bcrypt
- Communication: HTTP + WebRTC
- AI Integration: Cursor AI service framework

### KNOWN ISSUES
- Chrome extension dev server crashes with Plasmo (use pre-built extension)
- Main dev script fails (run components individually)
- Extension caching requires "fresh" naming and old extension removal
- Tailwind CSS v4 requires @tailwindcss/postcss plugin (not direct tailwindcss)

### WORKING COMMANDS
- Frontend: bun run dev
- Server: cd packages/server && bun run dev
- Extension: Use pre-built v2.2-fresh package

### REQUIRED VS CODE EXTENSIONS
- Tailwind CSS IntelliSense (bradlc.vscode-tailwindcss)
- ESLint (dbaeumer.vscode-eslint)
- Prettier (esbenp.prettier-vscode)
- TypeScript (ms-vscode.vscode-typescript-next)
- Auto Rename Tag (formulahendry.auto-rename-tag)
- Path Intellisense (christian-kohler.path-intellisense)

## FRONTEND ARCHITECTURE STANDARD
**CRITICAL:** This project MUST use the template-react-ts approach for ALL frontend development.

### MANDATORY FRONTEND STRUCTURE
- **Main App:** Root-level React TypeScript app (not in packages/)
- **Template:** https://github.com/YousifAbozid/template-react-ts
- **Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4
- **Features:** Dark mode, theming system, ESLint/Prettier, Husky hooks

### FORBIDDEN FRONTEND PATTERNS
- ❌ Multiple frontend packages (frontend/, web/, extension/)
- ❌ Simple Node.js servers for UI
- ❌ Fragmented frontend architecture
- ❌ Redundant UI packages

### REQUIRED PACKAGES STRUCTURE
```
/
├── src/                    # Main React app (template-react-ts)
├── packages/
│   ├── server/            # MCP Server only
│   ├── chrome-extension/  # Browser extension only
│   └── shared/            # Shared types/utils only
└── [template configs]     # All template-react-ts files
```

## AI EXECUTION PRIORITIES
1. Read all listed files for complete context
2. **ENFORCE template-react-ts architecture for ALL frontend work**
3. Understand VirtualBox setup and SSH workflow
4. Know extension deployment process and caching issues
5. Understand current system architecture and capabilities
6. Be aware of known issues and workarounds

## PROJECT STATE
Production-ready system with comprehensive documentation. **FRONTEND ARCHITECTURE RESTRUCTURED ✅** to follow template-react-ts standard. All major features implemented and tested. Ready for real-world deployment and advanced feature development.
