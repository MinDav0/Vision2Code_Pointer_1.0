# 🚀 MCP Pointer v2.0 - Deployment Guide

## 📋 **Deployment Strategy**

**Decision:** Native deployment with Bun runtime (no Docker required)

**Why:** More efficient, simpler maintenance, production-ready

---

## 🎯 **Quick Start (Production)**

### **1. Server Setup**
```bash
# Install Bun (if not already installed)
curl -fsSL https://bun.sh/install | bash

# Clone and setup
git clone <repository>
cd Vision2Code_Pointer_1.0

# Install dependencies
bun install

# Initialize database
cd packages/server
bun run db:init

# Start server
CURSOR_AI_ENABLED=true CURSOR_AI_MODE=integrated CURSOR_WORKSPACE_PATH=/path/to/workspace CURSOR_EXTENSION_ID=mcp-pointer bun start-server.ts
```

### **2. Web Interface Setup**
```bash
# In another terminal
cd packages/web
bun install
bun run server.js
```

### **3. Chrome Extension**
```bash
# Build extension
cd packages/chrome-extension
bun install
bun run build

# Load in Chrome: chrome://extensions/ -> Load unpacked -> select build/ folder
```

---

## 📊 **Resource Requirements**

### **Minimum System Requirements**
- **RAM:** 512MB (recommended: 1GB)
- **CPU:** 1 core (recommended: 2 cores)
- **Disk:** 500MB free space
- **OS:** Linux, macOS, or Windows

### **Actual Usage**
- **Server:** ~50MB RAM
- **Web Interface:** ~20MB RAM
- **Database:** ~10MB RAM
- **Total:** ~80MB RAM

---

## 🔧 **Production Configuration**

### **Environment Variables**
```bash
# Server Configuration
CURSOR_AI_ENABLED=true
CURSOR_AI_MODE=integrated
CURSOR_WORKSPACE_PATH=/path/to/your/workspace
CURSOR_EXTENSION_ID=mcp-pointer

# Optional: Database
DATABASE_PATH=/path/to/database.sqlite

# Optional: Security
JWT_SECRET=your-secret-key
BCRYPT_ROUNDS=12
```

### **Network Configuration**
- **Server Port:** 7007 (configurable)
- **WebRTC Port:** 7008 (configurable)
- **Web Interface:** 3001 (configurable)
- **Firewall:** Allow ports 7007, 7008, 3001

---

## 🛡️ **Security Checklist**

### **✅ Production Security**
- [x] JWT authentication enabled
- [x] Input validation with Zod schemas
- [x] SQL injection prevention
- [x] Rate limiting configured
- [x] CORS properly configured
- [x] Security headers enabled
- [x] Audit logging active

### **🔒 Additional Security (Optional)**
- [ ] SSL/TLS certificates (HTTPS)
- [ ] Reverse proxy (nginx/Apache)
- [ ] Firewall configuration
- [ ] Regular security updates
- [ ] Backup strategy

---

## 📈 **Monitoring & Maintenance**

### **Health Checks**
```bash
# Server health
curl http://your-server:7007/health

# Database status
cd packages/server && bun run db:status

# Extension connectivity
# Check browser console for connection logs
```

### **Logs**
- **Server logs:** Console output
- **Database logs:** SQLite query logs
- **Audit logs:** Database audit table
- **Error logs:** Console errors

### **Backup**
```bash
# Database backup
cp packages/server/data/mcp_pointer.db backup-$(date +%Y%m%d).db

# Configuration backup
cp .env backup-env-$(date +%Y%m%d)
```

---

## 🔄 **Updates & Maintenance**

### **Updating the Application**
```bash
# Pull latest changes
git pull origin main

# Update dependencies
bun install

# Run migrations (if any)
cd packages/server && bun run db:migrate

# Restart services
# Kill existing processes and restart
```

### **Database Maintenance**
```bash
# Check database integrity
cd packages/server && bun run db:health

# Reset database (if needed)
cd packages/server && bun run db:reset

# View database stats
cd packages/server && bun run db:status
```

---

## 🐳 **Docker Alternative (Optional)**

If you later need Docker for scaling or orchestration:

### **When to Consider Docker**
- Multiple server deployment
- Kubernetes orchestration
- Team deployment consistency
- CI/CD automation
- Resource: +150MB memory overhead

### **Docker Setup (Future)**
```dockerfile
# Example Dockerfile (not implemented yet)
FROM oven/bun:1
WORKDIR /app
COPY . .
RUN bun install
EXPOSE 7007 7008
CMD ["bun", "start-server.ts"]
```

---

## 🎯 **Production Checklist**

### **✅ Pre-Deployment**
- [ ] Server tested and running
- [ ] Database initialized and seeded
- [ ] Authentication working
- [ ] AI analysis functional
- [ ] Extension built and tested
- [ ] Web interface accessible

### **✅ Post-Deployment**
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Backup strategy in place
- [ ] Security review completed
- [ ] Performance baseline established
- [ ] Documentation updated

---

## 🆘 **Troubleshooting**

### **Common Issues**
1. **Port conflicts:** Change ports in configuration
2. **Database errors:** Run `bun run db:init`
3. **Extension not loading:** Check manifest permissions
4. **AI analysis failing:** Verify Cursor AI configuration
5. **Authentication issues:** Check JWT secret configuration

### **Support**
- Check logs for error messages
- Verify all services are running
- Test individual components
- Review configuration files

---

**🎉 Your MCP Pointer v2.0 is now production-ready with native deployment!**
