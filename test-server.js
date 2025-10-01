// Simple test server for login functionality
import express from 'express';
import cors from 'cors';
const app = express();

app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3002'],
  credentials: true
}));
app.use(express.json());

// Test login endpoint
app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('Login attempt:', { email, password });
  
  if (email === 'admin@mcp-pointer.local' && password === 'Admin123!@#') {
    res.json({
      user: {
        id: '1',
        email: 'admin@mcp-pointer.local',
        name: 'System Administrator',
        role: 'admin',
        permissions: ['read', 'write', 'admin'],
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        isActive: true
      },
      token: {
        accessToken: 'test-token-123',
        refreshToken: 'refresh-token-456',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        tokenType: 'Bearer'
      }
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Test server running' });
});

app.listen(7007, '0.0.0.0', () => {
  console.log('🚀 Test server running on http://0.0.0.0:7007');
  console.log('✅ Login endpoint: POST /auth/login');
  console.log('✅ Health check: GET /health');
});
