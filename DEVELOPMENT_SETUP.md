# 🛠️ Development Environment Setup Guide

## 📋 **Current Status**
**Phase 2 Database Complete** - Database system implemented with security features. WebRTC implementation in progress.

## 📋 **Prerequisites**

### **System Requirements**
- **OS:** Linux (Ubuntu 20.04+), macOS (10.15+), or Windows 10+
- **RAM:** Minimum 8GB, Recommended 16GB+
- **Storage:** 10GB free space
- **Network:** Stable internet connection

---

## 🚀 **Core Development Tools**

### **1. Bun Runtime & Package Manager**
```bash
# Install Bun (replaces Node.js + npm)
curl -fsSL https://bun.sh/install | bash

# Verify installation
bun --version
# Expected: 1.0.0+

# Set up Bun in your shell
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### **2. Chrome Browser (for Extension Development)**
```bash
# Ubuntu/Debian
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
sudo apt update
sudo apt install google-chrome-stable

# macOS (via Homebrew)
brew install --cask google-chrome

# Verify installation
google-chrome --version
```

### **3. Git & GitHub CLI**
```bash
# Install Git
sudo apt install git  # Ubuntu/Debian
brew install git      # macOS

# Install GitHub CLI
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

# Verify installations
git --version
gh --version
```

---

## 🔧 **IDE & Editor Setup**

### **1. VS Code (Recommended)**
```bash
# Install VS Code
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg
sudo install -o root -g root -m 644 packages.microsoft.gpg /etc/apt/trusted.gpg.d/
sudo sh -c 'echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/trusted.gpg.d/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" > /etc/apt/sources.list.d/vscode.list'
sudo apt update
sudo apt install code

# Or download from: https://code.visualstudio.com/
```

### **2. Essential VS Code Extensions**
```json
// .vscode/extensions.json (already configured)
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "biomejs.biome",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "ms-vscode.vscode-markdown",
    "ms-vscode-remote.remote-containers",
    "github.copilot",
    "github.copilot-chat"
  ]
}
```

### **3. VS Code Settings**
```json
// .vscode/settings.json (already configured)
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "biomejs.biome",
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "eslint.workingDirectories": [
    "packages/extension",
    "packages/server",
    "packages/shared"
  ],
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.bun": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.bun": true,
    "**/bun.lockb": true
  }
}
```

---

## 🏗️ **Project Setup**

### **1. Clone & Initialize Project**
```bash
# Clone the repository
git clone https://github.com/your-org/your-company-pointer.git
cd your-company-pointer

# Install dependencies with Bun
bun install

# Initialize database
bun run db:init

# Verify installation
bun run --version
```

### **2. Environment Configuration**
```bash
# Create environment files (env.example already exists)
cp env.example .env
cp env.example .env.local
cp env.example .env.development

# Edit environment variables
nano .env
```

```bash
# .env file contents
# Database
DATABASE_URL="file:./dev.db"
REDIS_URL="redis://localhost:6379"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-change-this"
JWT_EXPIRY="15m"
REFRESH_TOKEN_EXPIRY="7d"

# WebRTC
STUN_SERVER="stun:stun.l.google.com:19302"
TURN_SERVER=""

# Security
CORS_ORIGIN="http://localhost:3000"
RATE_LIMIT_WINDOW="15"
RATE_LIMIT_MAX="100"

# Development
NODE_ENV="development"
LOG_LEVEL="debug"
ENABLE_HOT_RELOAD="true"
```

### **3. Database Setup**
```bash
# Install SQLite (if not already installed)
sudo apt install sqlite3  # Ubuntu/Debian
brew install sqlite3      # macOS

# Install Redis
sudo apt install redis-server  # Ubuntu/Debian
brew install redis            # macOS

# Start Redis service
sudo systemctl start redis-server  # Ubuntu/Debian
brew services start redis          # macOS

# Verify Redis is running
redis-cli ping
# Expected: PONG
```

---

## 🔒 **Security Tools Setup**

### **1. Security Scanning Tools**
```bash
# Install security scanning tools
bun add -D @biomejs/biome
bun add -D eslint-plugin-security
bun add -D eslint-plugin-sonarjs
bun add -D eslint-plugin-unicorn
bun add -D eslint-plugin-no-secrets

# Install additional security tools
bun add -D audit-ci
bun add -D snyk
```

### **2. Git Hooks Setup**
```bash
# Install Husky for git hooks
bun add -D husky lint-staged

# Initialize Husky
bunx husky init

# Set up pre-commit hook
echo "bunx lint-staged" > .husky/pre-commit
chmod +x .husky/pre-commit

# Set up pre-push hook
echo "bun run test:security" > .husky/pre-push
chmod +x .husky/pre-push
```

### **3. Lint-Staged Configuration**
```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "biome format --write",
      "git add"
    ],
    "*.{json,md,yml,yaml}": [
      "prettier --write",
      "git add"
    ],
    "*.{ts,tsx}": [
      "bun run typecheck:strict"
    ]
  }
}
```

---

## 🧪 **Testing Environment**

### **1. Testing Tools**
```bash
# Install testing frameworks
bun add -D vitest @vitest/ui
bun add -D playwright @playwright/test
bun add -D @testing-library/react @testing-library/jest-dom
bun add -D jsdom

# Install test utilities
bun add -D supertest
bun add -D msw  # Mock Service Worker
```

### **2. Playwright Setup**
```bash
# Install Playwright browsers
bunx playwright install

# Install system dependencies (Linux)
bunx playwright install-deps
```

### **3. Test Configuration**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      threshold: {
        global: {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@shared': resolve(__dirname, './packages/shared/src')
    }
  }
})
```

---

## 🚀 **Development Scripts**

### **1. Package.json Scripts**
```json
// package.json
{
  "scripts": {
    "dev": "bun run --parallel dev:*",
    "dev:extension": "cd packages/extension && bun run dev",
    "dev:server": "cd packages/server && bun run dev",
    "dev:web": "cd packages/web && bun run dev",
    
    "build": "bun run build:*",
    "build:extension": "cd packages/extension && bun run build",
    "build:server": "cd packages/server && bun run build",
    "build:web": "cd packages/web && bun run build",
    
    "test": "bun run test:*",
    "test:unit": "vitest",
    "test:e2e": "playwright test",
    "test:security": "bun run audit && bun run lint:security",
    
    "lint": "eslint . --ext .ts,.tsx,.js,.jsx",
    "lint:fix": "eslint . --ext .ts,.tsx,.js,.jsx --fix",
    "lint:security": "eslint . --ext .ts,.tsx,.js,.jsx --config .eslintrc.security.js",
    
    "format": "biome format --write .",
    "format:check": "biome format .",
    
    "typecheck": "bun run typecheck:*",
    "typecheck:strict": "tsc --noEmit --strict",
    "typecheck:extension": "cd packages/extension && tsc --noEmit",
    "typecheck:server": "cd packages/server && tsc --noEmit",
    
    "audit": "audit-ci --config audit-ci.json",
    "audit:fix": "bun audit --fix",
    
    "clean": "bun run clean:*",
    "clean:extension": "cd packages/extension && rm -rf dist dev",
    "clean:server": "cd packages/server && rm -rf dist",
    "clean:web": "cd packages/web && rm -rf .next",
    
    "setup": "bun install && bun run setup:*",
    "setup:db": "bun run db:migrate && bun run db:seed",
    "setup:security": "bun run audit && bun run lint:security"
  }
}
```

### **2. Development Workflow**
```bash
# Start development environment
bun run dev

# This will start:
# - Extension in watch mode (packages/extension)
# - MCP Server with hot reload (packages/server)
# - Web interface (packages/web)
# - Database migrations
# - Redis cache
```

---

## 🔍 **Debugging Setup**

### **1. VS Code Debug Configuration**
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Extension",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/packages/extension",
      "sourceMaps": true
    },
    {
      "name": "Debug Server",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/packages/server/src/index.ts",
      "runtimeExecutable": "bun",
      "env": {
        "NODE_ENV": "development"
      },
      "sourceMaps": true
    },
    {
      "name": "Debug Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["run", "--reporter=verbose"],
      "runtimeExecutable": "bun",
      "sourceMaps": true
    }
  ]
}
```

### **2. Chrome Extension Debugging**
```bash
# Load extension in Chrome for debugging
1. Open Chrome
2. Go to chrome://extensions/
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select packages/extension/dev/ folder
6. Open DevTools to debug content scripts
```

---

## 📊 **Monitoring & Logging**

### **1. Logging Setup**
```typescript
// packages/shared/src/logger.ts
import { createLogger, format, transports } from 'winston'

export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' }),
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    })
  ]
})
```

### **2. Performance Monitoring**
```typescript
// packages/shared/src/metrics.ts
import { createPrometheusMetrics } from 'prom-client'

export const metrics = createPrometheusMetrics({
  elementDetectionLatency: new Histogram({
    name: 'element_detection_latency_seconds',
    help: 'Time taken to detect elements',
    buckets: [0.1, 0.5, 1, 2, 5]
  }),
  webRTCConnections: new Gauge({
    name: 'webrtc_connections_total',
    help: 'Number of active WebRTC connections'
  })
})
```

---

## 🚀 **Quick Start Commands**

### **Initial Setup**
```bash
# 1. Clone and setup
git clone <your-repo>
cd your-company-pointer
bun install

# 2. Environment setup
cp .env.example .env
# Edit .env with your configuration

# 3. Database setup
bun run setup:db

# 4. Security setup
bun run setup:security

# 5. Start development
bun run dev
```

### **Daily Development**
```bash
# Start development environment
bun run dev

# Run tests
bun run test

# Check code quality
bun run lint
bun run typecheck

# Format code
bun run format

# Security audit
bun run test:security
```

### **Before Committing**
```bash
# Pre-commit checks (automated via Husky)
bun run lint:fix
bun run format
bun run typecheck:strict
bun run test:security

# Manual checks
bun run test
bun run build
```

---

## 🔧 **Troubleshooting**

### **Common Issues**

#### **1. Bun Installation Issues**
```bash
# If Bun installation fails
curl -fsSL https://bun.sh/install | bash
export PATH="$HOME/.bun/bin:$PATH"

# Verify installation
bun --version
```

#### **2. Chrome Extension Not Loading**
```bash
# Check if extension built successfully
cd packages/extension
bun run build

# Verify dist/ folder exists
ls -la dist/

# Check Chrome console for errors
# Open chrome://extensions/ and check for errors
```

#### **3. Database Connection Issues**
```bash
# Check if SQLite is accessible
sqlite3 dev.db ".tables"

# Check Redis connection
redis-cli ping

# Restart services if needed
sudo systemctl restart redis-server
```

#### **4. ESLint Configuration Issues**
```bash
# Check ESLint configuration
bunx eslint --print-config packages/extension/src/index.ts

# Verify all dependencies installed
bun install

# Clear ESLint cache
bunx eslint --cache-location .eslintcache --clear-cache
```

---

## 📚 **Additional Resources**

### **Documentation Links**
- [Bun Documentation](https://bun.sh/docs)
- [Plasmo Framework](https://docs.plasmo.com/)
- [Hono Framework](https://hono.dev/)
- [ESLint Security Rules](https://github.com/eslint-community/eslint-plugin-security)
- [WebRTC Documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)

### **Useful Commands Reference**
```bash
# Bun commands
bun install                    # Install dependencies
bun run <script>              # Run script
bun add <package>             # Add dependency
bun add -D <package>          # Add dev dependency
bun remove <package>          # Remove dependency
bun update                    # Update dependencies

# Development commands
bun run dev                   # Start development
bun run build                 # Build for production
bun run test                  # Run tests
bun run lint                  # Lint code
bun run typecheck             # Type check
```

---

## ✅ **Verification Checklist**

Before starting development, verify:

- [ ] Bun installed and working (`bun --version`)
- [ ] Chrome browser installed
- [ ] VS Code with required extensions
- [ ] Git and GitHub CLI configured
- [ ] Project cloned and dependencies installed
- [ ] Environment variables configured
- [ ] Database and Redis running
- [ ] ESLint configuration working
- [ ] Security tools installed
- [ ] Git hooks configured
- [ ] Development server starts successfully

---

**Setup Complete!** 🎉  
You're now ready to start developing with the modernized MCP Pointer architecture.
