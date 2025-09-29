/**
 * Authentication Middleware
 * Secure request authentication and authorization
 */

import type { Context, Next } from 'hono';
import type { Permission, UserRole } from '@mcp-pointer/shared';
import { JWTAuthService } from '../auth/jwt.service.js';
import { createAppError, ErrorCode } from '@mcp-pointer/shared';

// Extend Hono context with user information
declare module 'hono' {
  interface ContextVariableMap {
    user: {
      id: string;
      email: string;
      role: UserRole;
      permissions: Permission[];
    };
    authService: JWTAuthService;
  }
}

export class AuthMiddleware {
  constructor(private readonly authService: JWTAuthService) {}

  /**
   * Middleware to authenticate requests
   */
  authenticate = async (c: Context, next: Next): Promise<void> => {
    try {
      const authHeader = c.req.header('Authorization');
      
      if (!authHeader) {
        throw createAppError(ErrorCode.UNAUTHORIZED, 'Authorization header required', 401);
      }

      const [scheme, token] = authHeader.split(' ');
      
      if (scheme !== 'Bearer' || !token) {
        throw createAppError(ErrorCode.UNAUTHORIZED, 'Invalid authorization scheme', 401);
      }

      // Verify token
      const payload = await this.authService.verifyToken(token);
      
      // Set user context
      c.set('user', {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
        permissions: payload.permissions
      });
      
      c.set('authService', this.authService);

      await next();
    } catch (error) {
      c.status(401);
      return c.json({
        error: 'Unauthorized',
        message: error instanceof Error ? error.message : 'Authentication failed'
      });
    }
  };

  /**
   * Middleware to check specific permission
   */
  requirePermission = (permission: Permission) => {
    return async (c: Context, next: Next): Promise<void> => {
      const user = c.get('user');
      
      if (!user) {
        throw createAppError(ErrorCode.UNAUTHORIZED, 'User not authenticated', 401);
      }

      if (!this.authService.hasPermission(user.permissions, permission)) {
        throw createAppError(ErrorCode.FORBIDDEN, `Permission '${permission}' required`, 403);
      }

      await next();
    };
  };

  /**
   * Middleware to check any of the required permissions
   */
  requireAnyPermission = (permissions: Permission[]) => {
    return async (c: Context, next: Next): Promise<void> => {
      const user = c.get('user');
      
      if (!user) {
        throw createAppError(ErrorCode.UNAUTHORIZED, 'User not authenticated', 401);
      }

      if (!this.authService.hasAnyPermission(user.permissions, permissions)) {
        throw createAppError(
          ErrorCode.FORBIDDEN, 
          `One of the following permissions required: ${permissions.join(', ')}`, 
          403
        );
      }

      await next();
    };
  };

  /**
   * Middleware to check all required permissions
   */
  requireAllPermissions = (permissions: Permission[]) => {
    return async (c: Context, next: Next): Promise<void> => {
      const user = c.get('user');
      
      if (!user) {
        throw createAppError(ErrorCode.UNAUTHORIZED, 'User not authenticated', 401);
      }

      if (!this.authService.hasAllPermissions(user.permissions, permissions)) {
        throw createAppError(
          ErrorCode.FORBIDDEN, 
          `All of the following permissions required: ${permissions.join(', ')}`, 
          403
        );
      }

      await next();
    };
  };

  /**
   * Middleware to check user role
   */
  requireRole = (role: UserRole) => {
    return async (c: Context, next: Next): Promise<void> => {
      const user = c.get('user');
      
      if (!user) {
        throw createAppError(ErrorCode.UNAUTHORIZED, 'User not authenticated', 401);
      }

      if (user.role !== role) {
        throw createAppError(ErrorCode.FORBIDDEN, `Role '${role}' required`, 403);
      }

      await next();
    };
  };

  /**
   * Middleware to check if user has minimum role level
   */
  requireMinimumRole = (minimumRole: UserRole) => {
    const roleHierarchy: Record<UserRole, number> = {
      [UserRole.GUEST]: 0,
      [UserRole.VIEWER]: 1,
      [UserRole.DEVELOPER]: 2,
      [UserRole.ADMIN]: 3
    };

    return async (c: Context, next: Next): Promise<void> => {
      const user = c.get('user');
      
      if (!user) {
        throw createAppError(ErrorCode.UNAUTHORIZED, 'User not authenticated', 401);
      }

      const userRoleLevel = roleHierarchy[user.role];
      const requiredRoleLevel = roleHierarchy[minimumRole];

      if (userRoleLevel < requiredRoleLevel) {
        throw createAppError(
          ErrorCode.FORBIDDEN, 
          `Minimum role '${minimumRole}' required`, 
          403
        );
      }

      await next();
    };
  };

  /**
   * Optional authentication middleware (doesn't fail if no token)
   */
  optionalAuth = async (c: Context, next: Next): Promise<void> => {
    try {
      const authHeader = c.req.header('Authorization');
      
      if (authHeader) {
        const [scheme, token] = authHeader.split(' ');
        
        if (scheme === 'Bearer' && token) {
          const payload = await this.authService.verifyToken(token);
          
          c.set('user', {
            id: payload.userId,
            email: payload.email,
            role: payload.role,
            permissions: payload.permissions
          });
          
          c.set('authService', this.authService);
        }
      }
    } catch (error) {
      // Ignore authentication errors for optional auth
      console.warn('Optional auth failed:', error);
    }

    await next();
  };

  /**
   * Rate limiting middleware based on user
   */
  rateLimitByUser = (maxRequests: number, windowMs: number) => {
    const requests = new Map<string, number[]>();

    return async (c: Context, next: Next): Promise<void> => {
      const user = c.get('user');
      const identifier = user ? user.id : c.req.header('x-forwarded-for') || 'anonymous';
      
      const now = Date.now();
      const windowStart = now - windowMs;
      
      const userRequests = requests.get(identifier) || [];
      const validRequests = userRequests.filter(time => time > windowStart);
      
      if (validRequests.length >= maxRequests) {
        throw createAppError(
          ErrorCode.RATE_LIMIT_EXCEEDED, 
          'Rate limit exceeded', 
          429
        );
      }
      
      validRequests.push(now);
      requests.set(identifier, validRequests);

      await next();
    };
  };

  /**
   * Security headers middleware
   */
  securityHeaders = async (c: Context, next: Next): Promise<void> => {
    // Set security headers
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'DENY');
    c.header('X-XSS-Protection', '1; mode=block');
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    c.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // Content Security Policy
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self' wss: https:",
      "font-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');
    
    c.header('Content-Security-Policy', csp);

    await next();
  };

  /**
   * Request logging middleware
   */
  requestLogger = async (c: Context, next: Next): Promise<void> => {
    const start = Date.now();
    const method = c.req.method;
    const url = c.req.url;
    const userAgent = c.req.header('User-Agent') || 'Unknown';
    const ip = c.req.header('x-forwarded-for') || 'Unknown';
    
    await next();
    
    const duration = Date.now() - start;
    const status = c.res.status;
    const user = c.get('user');
    
    console.log({
      method,
      url,
      status,
      duration: `${duration}ms`,
      ip,
      userAgent,
      userId: user?.id || 'anonymous',
      timestamp: new Date().toISOString()
    });
  };
}
