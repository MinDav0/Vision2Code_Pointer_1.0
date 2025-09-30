# 🔒 Security Guide - MCP Pointer v2.0

## ⚠️ **CRITICAL: Before Deploying to Production**

This guide covers essential security measures that MUST be implemented before deploying MCP Pointer to production.

---

## 🔐 **Environment Variables Setup**

### **1. Create Environment File**
```bash
# Copy the template
cp env.template .env

# Edit with your secure values
nano .env
```

### **2. Required Security Variables**
```bash
# JWT Secret (CRITICAL - Generate a strong secret!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Default Admin Password (CHANGE THIS!)
DEFAULT_ADMIN_PASSWORD=admin123

# AI API Keys (if using external services)
CLAUDE_API_KEY=your-claude-api-key-here
```

### **3. Generate Secure JWT Secret**
```bash
# Generate a cryptographically secure secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or use OpenSSL
openssl rand -hex 64
```

---

## 🛡️ **Production Security Checklist**

### **✅ Environment Security**
- [ ] All secrets moved to environment variables
- [ ] `.env` file added to `.gitignore`
- [ ] No hardcoded passwords in code
- [ ] JWT secret is cryptographically secure (64+ characters)
- [ ] Default admin password changed

### **✅ Database Security**
- [ ] Database file permissions set to 600 (owner read/write only)
- [ ] Database backups encrypted
- [ ] Regular security updates applied
- [ ] Database access restricted to application only

### **✅ Network Security**
- [ ] HTTPS enabled in production
- [ ] CORS origins restricted to known domains
- [ ] Rate limiting configured
- [ ] Firewall rules applied
- [ ] WebRTC connections secured

### **✅ Application Security**
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS protection enabled
- [ ] CSRF protection implemented
- [ ] Security headers configured

---

## 🚨 **Security Vulnerabilities Fixed**

### **Removed from Codebase:**
- ❌ Hardcoded JWT secrets
- ❌ Default passwords in source code
- ❌ Test files with credentials
- ❌ API keys in documentation
- ❌ Database passwords in config

### **Added Security Measures:**
- ✅ Environment variable validation
- ✅ Secure password hashing (bcrypt)
- ✅ JWT token expiration
- ✅ Rate limiting
- ✅ Input sanitization
- ✅ Error handling without information leakage

---

## 🔧 **Production Deployment Steps**

### **1. Secure Environment Setup**
```bash
# Create production environment
cp env.template .env.production

# Generate secure secrets
JWT_SECRET=$(openssl rand -hex 64)
echo "JWT_SECRET=$JWT_SECRET" >> .env.production

# Set secure admin password
echo "DEFAULT_ADMIN_PASSWORD=$(openssl rand -base64 32)" >> .env.production
```

### **2. Database Security**
```bash
# Set secure database permissions
chmod 600 data/mcp-pointer.db
chown app:app data/mcp-pointer.db

# Create backup with encryption
tar -czf backup-$(date +%Y%m%d).tar.gz data/
gpg --symmetric backup-$(date +%Y%m%d).tar.gz
```

### **3. Server Configuration**
```bash
# Run with production environment
NODE_ENV=production bun run start

# Or use PM2 for process management
pm2 start start-server.ts --name mcp-pointer --env production
```

---

## 🚫 **What NOT to Do**

### **❌ Never Commit:**
- `.env` files
- Database files (`.db`, `.sqlite`)
- Private keys (`.key`, `.pem`)
- Test files with credentials
- Log files with sensitive data

### **❌ Never Use in Production:**
- Default passwords
- Weak JWT secrets
- HTTP (use HTTPS)
- Wide-open CORS
- Debug logging

### **❌ Never Expose:**
- Database connection strings
- API keys in client-side code
- Internal network addresses
- Error details to users

---

## 🔍 **Security Monitoring**

### **Log Security Events:**
- Failed login attempts
- Invalid token usage
- Rate limit violations
- Database access errors
- WebRTC connection failures

### **Regular Security Tasks:**
- [ ] Rotate JWT secrets monthly
- [ ] Update dependencies weekly
- [ ] Review access logs daily
- [ ] Backup database daily
- [ ] Test security measures monthly

---

## 🆘 **Security Incident Response**

### **If Secrets Are Compromised:**
1. **Immediately rotate all secrets**
2. **Invalidate all active tokens**
3. **Review access logs**
4. **Update all passwords**
5. **Notify users if necessary**

### **Emergency Commands:**
```bash
# Rotate JWT secret
JWT_SECRET=$(openssl rand -hex 64)
# Restart server with new secret

# Reset admin password
# Update database directly or re-seed
```

---

## 📞 **Security Support**

For security issues or questions:
- Review this guide thoroughly
- Check the deployment documentation
- Test in staging environment first
- Monitor logs for suspicious activity

**Remember: Security is an ongoing process, not a one-time setup!** 🔒
