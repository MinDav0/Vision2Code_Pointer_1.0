/**
 * MCP Pointer Server v2.0
 * Secure, high-performance server with WebRTC and MCP protocol support
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
// import { logger } from 'hono/logger';
// import { secureHeaders } from 'hono/secure-headers';
import type { AppConfig } from '@mcp-pointer/shared';
import { createAppError, ErrorCode, UserRole } from '@mcp-pointer/shared';
import { JWTAuthService } from './auth/jwt.service.js';
import { AuthMiddleware } from './middleware/auth.middleware.js';
import { WebRTCManager } from './webrtc/webrtc.manager.js';
import { MCPManager } from './mcp/mcp.manager.js';
import { createRateLimiter } from './middleware/rate-limiter.middleware.js';
import { getAIConfig, validateAIConfig, getAIConfigSummary } from './config/ai.config.js';
import { UsersAPI } from './api/users.api.js';
import { ElementsAPI } from './api/elements.api.js';
import { AnalyticsAPI } from './api/analytics.api.js';
import { AIManager } from './ai/ai.manager.js';

export class MCPServer {
  private app: Hono;
  private authService: JWTAuthService;
  private authMiddleware: AuthMiddleware;
  private webrtcManager: WebRTCManager;
  private mcpManager: MCPManager;
  private usersAPI: UsersAPI;
  private elementsAPI: ElementsAPI;
  private analyticsAPI: AnalyticsAPI;
  private aiManager: AIManager;
  private config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
    this.app = new Hono();
    this.authService = new JWTAuthService(config.security.jwt);
    this.authMiddleware = new AuthMiddleware(this.authService);
    this.webrtcManager = new WebRTCManager(config);
    
    // Initialize AI configuration
    const aiConfig = getAIConfig();
    const warnings = validateAIConfig(aiConfig);
    
    if (warnings.length > 0) {
      console.log('AI Configuration Warnings:');
      warnings.forEach(warning => console.log(`⚠️ ${warning}`));
    }
    
    console.log(getAIConfigSummary(aiConfig));
    
    this.mcpManager = new MCPManager(config, aiConfig);
    this.aiManager = new AIManager(aiConfig);
    this.usersAPI = new UsersAPI();
    this.elementsAPI = new ElementsAPI(this.aiManager);
    this.analyticsAPI = new AnalyticsAPI();
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
    this.setupIntegration();
  }

  private setupMiddleware(): void {
    // Security headers
    this.app.use('*', this.authMiddleware.securityHeaders);
    
    // Request logging
    this.app.use('*', this.authMiddleware.requestLogger);
    
    // CORS configuration
    this.app.use('*', cors({
      origin: [...this.config.server.cors.origin],
      credentials: this.config.server.cors.credentials,
      allowMethods: [...this.config.server.cors.methods],
      allowHeaders: [...this.config.server.cors.allowedHeaders]
    }));

    // Rate limiting
    this.app.use('*', createRateLimiter(this.config.server.rateLimit));

    // JSON parsing with size limit
    this.app.use('*', async (c, next) => {
      try {
        const contentLength = c.req.header('content-length');
        if (contentLength && parseInt(contentLength, 10) > 1024 * 1024) { // 1MB limit
          throw createAppError(ErrorCode.INVALID_INPUT, 'Request too large', 413);
        }
        await next();
        return;
      } catch (error) {
        c.status(413);
        return c.json({ error: 'Request too large' });
      }
    });
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (c) => {
      return c.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        uptime: process.uptime()
      });
    });

    // Authentication routes
    this.setupAuthRoutes();
    
    // Protected API routes
    this.setupAPIRoutes();
    
    // WebRTC signaling routes
    this.setupWebRTCRoutes();
    
    // MCP protocol routes
    this.setupMCPRoutes();
  }

  private setupAuthRoutes(): void {
    const auth = new Hono();

    // Login endpoint
    auth.post('/login', async (c) => {
      try {
        const body = await c.req.json();
        const authResponse = await this.authService.authenticate(body);
        
        return c.json(authResponse);
      } catch (error) {
        const status = error instanceof Error && 'statusCode' in error 
          ? (error as any).statusCode 
          : 500;
        
        c.status(status);
        return c.json({
          error: 'Authentication failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Refresh token endpoint
    auth.post('/refresh', async (c) => {
      try {
        const body = await c.req.json();
        const { refreshToken } = body;
        
        if (!refreshToken) {
          throw createAppError(ErrorCode.INVALID_INPUT, 'Refresh token required', 400);
        }
        
        const newToken = await this.authService.refreshToken(refreshToken);
        
        return c.json(newToken);
      } catch (error) {
        const status = error instanceof Error && 'statusCode' in error 
          ? (error as any).statusCode 
          : 500;
        
        c.status(status);
        return c.json({
          error: 'Token refresh failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Logout endpoint
    auth.post('/logout', this.authMiddleware.authenticate, async (c) => {
      // In a real implementation, you would invalidate the token
      return c.json({ message: 'Logged out successfully' });
    });

    this.app.route('/auth', auth);
  }

  private setupAPIRoutes(): void {
    const api = new Hono();

    // All API routes require authentication
    api.use('*', this.authMiddleware.authenticate);

    // Mount API modules
    api.route('/users', this.usersAPI.getApp());
    api.route('/elements', this.elementsAPI.getApp());
    api.route('/analytics', this.analyticsAPI.getApp());

    // Configuration endpoint (admin only)
    api.get('/config', this.authMiddleware.requireRole(UserRole.ADMIN), async (c) => {
      return c.json({
        // Return safe configuration (no secrets)
        webrtc: {
          enabled: this.config.webrtc.iceServers.length > 0,
          port: this.config.server.webrtcPort || 7008
        },
        mcp: {
          enabled: true,
          toolsAvailable: this.mcpManager.getAvailableTools().length
        },
        features: {
          reactDetection: true,
          vueDetection: false,
          accessibilityChecks: true,
          analytics: true,
          export: true
        },
        limits: {
          maxElementsPerRequest: 100,
          maxExportRecords: 10000,
          sessionTimeout: '24h'
        }
      });
    });

    // System status endpoint
    api.get('/status', async (c) => {
      const user = c.get('user');
      
      return c.json({
        status: 'operational',
        timestamp: new Date().toISOString(),
        services: {
          webrtc: this.webrtcManager.getStatus(),
          mcp: this.mcpManager.getStatus(),
          database: {
            status: 'connected',
            connectionCount: 0 // Would get from database
          }
        },
        user: {
          id: user.id,
          role: user.role,
          permissions: user.permissions
        }
      });
    });

    this.app.route('/api', api);
  }

  private setupWebRTCRoutes(): void {
    const webrtc = new Hono();

    // WebRTC configuration endpoint
    webrtc.get('/config', this.authMiddleware.optionalAuth, async (c) => {
      return c.json({
        iceServers: this.config.webrtc.iceServers,
        sdpSemantics: this.config.webrtc.sdpSemantics,
        websocketUrl: `ws://${this.config.server.host}:${this.config.server.webrtcPort || 7008}`
      });
    });

    // WebRTC status endpoint
    webrtc.get('/status', this.authMiddleware.authenticate, async (c) => {
      const status = this.webrtcManager.getStatus();
      return c.json(status);
    });

    // Get current element for user
    webrtc.get('/current-element', this.authMiddleware.authenticate, async (c) => {
      const user = c.get('user');
      const currentElement = this.webrtcManager.getCurrentElement(user.id);
      
      if (currentElement) {
        return c.json({
          success: true,
          element: currentElement,
          timestamp: Date.now()
        });
      } else {
        return c.json({
          success: false,
          message: 'No element currently selected'
        });
      }
    });

    // Send message to user's WebRTC connections
    webrtc.post('/send-message', this.authMiddleware.authenticate, async (c) => {
      try {
        const body = await c.req.json();
        const user = c.get('user');
        
        if (!body.message || !body.type) {
          throw createAppError(ErrorCode.INVALID_INPUT, 'Message and type required', 400);
        }
        
        this.webrtcManager.sendMessageToUser(user.id, {
          type: body.type,
          data: body.message
        });
        
        return c.json({ success: true });
      } catch (error) {
        const status = error instanceof Error && 'statusCode' in error 
          ? (error as any).statusCode 
          : 500;
        
        c.status(status);
        return c.json({
          error: 'Failed to send message',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    this.app.route('/webrtc', webrtc);
  }

  private setupMCPRoutes(): void {
    const mcp = new Hono();

    // MCP status endpoint
    mcp.get('/status', this.authMiddleware.authenticate, async (c) => {
      const status = this.mcpManager.getStatus();
      return c.json(status);
    });

    // MCP tools endpoint
    mcp.get('/tools', this.authMiddleware.authenticate, async (c) => {
      const tools = this.mcpManager.getAvailableTools().map(toolName => ({
        name: toolName,
        description: this.mcpManager.getToolDescription(toolName)
      }));

      return c.json({ tools });
    });

    // Create MCP context for user
    mcp.post('/context', this.authMiddleware.authenticate, async (c) => {
      try {
        const user = c.get('user');
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const context = this.mcpManager.createContext(user.id, sessionId);
        
        return c.json({
          success: true,
          sessionId,
          context: {
            userId: context.userId,
            sessionId: context.sessionId
          }
        });
      } catch (error) {
        c.status(500);
        return c.json({
          error: 'Failed to create MCP context',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Remove MCP context
    mcp.delete('/context/:sessionId', this.authMiddleware.authenticate, async (c) => {
      try {
        const sessionId = c.req.param('sessionId');
        const user = c.get('user');
        
        // Verify the session belongs to the user
        const context = this.mcpManager.getContextForUser(user.id);
        if (context && context.sessionId === sessionId) {
          this.mcpManager.removeContext(sessionId);
          return c.json({ success: true, message: 'Context removed' });
        } else {
          c.status(404);
          return c.json({ error: 'Context not found' });
        }
      } catch (error) {
        c.status(500);
        return c.json({
          error: 'Failed to remove MCP context',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Get current element for MCP context
    mcp.get('/current-element', this.authMiddleware.authenticate, async (c) => {
      try {
        const user = c.get('user');
        const context = this.mcpManager.getContextForUser(user.id);
        
        if (context && context.currentElement) {
          return c.json({
            success: true,
            element: context.currentElement,
            timestamp: Date.now()
          });
        } else {
          return c.json({
            success: false,
            message: 'No element currently selected'
          });
        }
      } catch (error) {
        c.status(500);
        return c.json({
          error: 'Failed to get current element',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // MCP tool execution endpoint (for testing)
    mcp.post('/tools/:toolName', this.authMiddleware.authenticate, async (c) => {
      try {
        const toolName = c.req.param('toolName');
        const user = c.get('user');
        const body = await c.req.json();
        
        // Get user's MCP context
        const context = this.mcpManager.getContextForUser(user.id);
        if (!context) {
          c.status(400);
          return c.json({ error: 'No active MCP context found' });
        }
        
        // This would typically execute the tool through the MCP server
        // For now, we'll return a mock response
        return c.json({
          success: true,
          tool: toolName,
          result: `Mock execution of ${toolName} with args: ${JSON.stringify(body)}`,
          timestamp: Date.now()
        });
      } catch (error) {
        c.status(500);
        return c.json({
          error: 'Tool execution failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    this.app.route('/mcp', mcp);
  }

  private setupIntegration(): void {
    // Integrate WebRTC with MCP
    this.webrtcManager.on('element_selected', (eventData) => {
      const { userId, data: elementData } = eventData;
      
      // Update MCP context with new element
      this.mcpManager.updateElementForUser(userId, elementData);
      
      console.log(`🔗 Element selection integrated with MCP for user ${userId}`);
    });

    // Handle WebRTC disconnections
    this.webrtcManager.on('connection_closed', (eventData) => {
      const { userId } = eventData;
      
      // Clean up MCP context when WebRTC connection closes
      const context = this.mcpManager.getContextForUser(userId);
      if (context) {
        this.mcpManager.removeContext(context.sessionId);
        console.log(`🔗 MCP context cleaned up for disconnected user ${userId}`);
      }
    });
  }

  private setupErrorHandling(): void {
    this.app.onError((error, c) => {
      console.error('Server error:', error);
      
      const status = error instanceof Error && 'statusCode' in error 
        ? (error as any).statusCode 
        : 500;
      
      c.status(status);
      return c.json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    });

    this.app.notFound((c) => {
      return c.json({ error: 'Not found' }, 404);
    });
  }

  public getApp(): Hono {
    return this.app;
  }

  public async start(): Promise<void> {
    const port = this.config.server.port;
    const host = this.config.server.host;
    
    console.log(`🚀 MCP Pointer Server v2.0 starting on ${host}:${port}`);
    console.log(`🔒 Security: ${this.config.security.jwt.algorithm} JWT, ${this.config.security.bcrypt.rounds} bcrypt rounds`);
    console.log(`🌐 WebRTC: ${this.config.webrtc.iceServers.length} ICE servers configured`);
    console.log(`📊 Monitoring: ${this.config.monitoring.enabled ? 'Enabled' : 'Disabled'}`);
    
    // Start WebRTC service
    try {
      await this.webrtcManager.start();
      console.log(`🔗 WebRTC service started on port ${this.config.server.webrtcPort || 7008}`);
    } catch (error) {
      console.error('Failed to start WebRTC service:', error);
      throw error;
    }

    // Start MCP service
    try {
      await this.mcpManager.start();
      console.log('🤖 MCP service started and ready for AI tool connections');
    } catch (error) {
      console.error('Failed to start MCP service:', error);
      throw error;
    }

    // Initialize AI Manager
    try {
      await this.aiManager.initialize();
      console.log('🤖 AI Manager initialized and ready for analysis');
    } catch (error) {
      console.error('Failed to initialize AI Manager:', error);
      throw error;
    }
    
    // Start HTTP server
    Bun.serve({
      fetch: this.app.fetch,
      port,
      hostname: host
    });
    
    console.log(`✅ Server running at http://${host}:${port}`);
    console.log(`✅ WebRTC service running at ws://${host}:${this.config.server.webrtcPort || 7008}`);
    console.log(`✅ MCP service ready for AI tool connections`);
  }
}

// Default configuration
const defaultConfig: AppConfig = {
  server: {
    port: 7007,
    webrtcPort: 7008,
    host: '0.0.0.0', // Bind to all interfaces for external access
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:3001', 'http://10.0.2.15:3001', 'http://10.0.2.15:3002', 'chrome-extension://*'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
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
    },
    csp: {
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https:'],
        'connect-src': ["'self'", 'wss:', 'https:']
      },
      reportOnly: false
    },
    headers: {
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      },
      xFrameOptions: 'DENY',
      xContentTypeOptions: 'nosniff',
      xXSSProtection: '1; mode=block'
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
      windowMs: 60 * 1000, // 1 minute
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

// Start server if this file is run directly
if (Bun.main === import.meta.url) {
  const server = new MCPServer(defaultConfig);
  await server.start();
}
