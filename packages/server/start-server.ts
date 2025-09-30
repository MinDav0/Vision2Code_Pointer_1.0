#!/usr/bin/env bun

console.log('🚀 Starting MCP Pointer Server v2.0...');

try {
  const { MCPServer } = await import('./src/index.js');
  
  const config = {
    server: {
      port: 7007,
      webrtcPort: 7008,
      host: '0.0.0.0',
      cors: {
        origin: ['http://localhost:3000', 'http://localhost:3001', 'http://10.0.2.15:3001', 'chrome-extension://*'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
      },
      rateLimit: {
        windowMs: 15 * 60 * 1000,
        max: 100,
        skipSuccessfulRequests: false,
        skipFailedRequests: false
      }
    },
    security: {
      jwt: {
        secret: process.env.JWT_SECRET || (() => {
          throw new Error('JWT_SECRET environment variable is required. Please set it in your .env file.');
        })(),
        expiresIn: '15m',
        refreshExpiresIn: '7d',
        algorithm: 'HS256'
      },
      bcrypt: {
        rounds: 12,
        saltRounds: 12
      }
    },
    webrtc: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ],
      sdpSemantics: 'unified-plan',
      bundlePolicy: 'balanced',
      rtcpMuxPolicy: 'require'
    },
    ai: {
      providers: [],
      defaultProvider: 'local',
      rateLimit: {
        windowMs: 60 * 1000,
        max: 10,
        skipSuccessfulRequests: false,
        skipFailedRequests: false
      }
    },
    monitoring: {
      enabled: true,
      metrics: {
        enabled: true,
        port: 9090,
        path: '/metrics',
        collectDefaultMetrics: true
      },
      logging: {
        level: 'info',
        format: 'json',
        destination: 'console',
        maxSize: '10m',
        maxFiles: 5
      },
      alerts: {
        enabled: false,
        thresholds: {}
      }
    }
  };
  
  const server = new MCPServer(config);
  await server.start();
  
} catch (error) {
  console.error('❌ Server startup failed:', error);
  if (error instanceof Error) {
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);
  }
  process.exit(1);
}




