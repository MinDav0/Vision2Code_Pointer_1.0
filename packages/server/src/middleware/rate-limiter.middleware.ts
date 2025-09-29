/**
 * Rate Limiter Middleware for MCP Pointer v2.0
 * Simple in-memory rate limiting implementation
 */

import type { Context, Next } from 'hono';
import type { RateLimitConfig } from '@mcp-pointer/shared';
import { createAppError, ErrorCode } from '@mcp-pointer/shared';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    
    // Clean up expired entries every minute
    setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.requests.entries()) {
      if (entry.resetTime < now) {
        this.requests.delete(key);
      }
    }
  }

  private getKey(c: Context): string {
    // Try to get user ID from context, fallback to IP
    const user = c.get('user');
    if (user?.id) {
      return `user:${user.id}`;
    }
    
    // Fallback to IP address
    const forwardedFor = c.req.header('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';
    return `ip:${ip}`;
  }

  public async checkLimit(c: Context, next: Next): Promise<Response | void> {
    const key = this.getKey(c);
    const now = Date.now();
    const windowMs = this.config.windowMs;
    const maxRequests = this.config.max;

    // Get or create rate limit entry
    let entry = this.requests.get(key);
    
    if (!entry || entry.resetTime < now) {
      // Create new entry or reset expired one
      entry = {
        count: 0,
        resetTime: now + windowMs
      };
      this.requests.set(key, entry);
    }

    // Check if limit exceeded
    if (entry.count >= maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      
      c.status(429);
      c.header('Retry-After', retryAfter.toString());
      c.header('X-RateLimit-Limit', maxRequests.toString());
      c.header('X-RateLimit-Remaining', '0');
      c.header('X-RateLimit-Reset', entry.resetTime.toString());
      
      return c.json({
        error: 'Rate limit exceeded',
        message: `Too many requests. Try again in ${retryAfter} seconds.`,
        retryAfter
      });
    }

    // Increment counter
    entry.count++;

    // Add rate limit headers
    c.header('X-RateLimit-Limit', maxRequests.toString());
    c.header('X-RateLimit-Remaining', (maxRequests - entry.count).toString());
    c.header('X-RateLimit-Reset', entry.resetTime.toString());

    // Continue to next middleware
    await next();
  }
}

export function createRateLimiter(config: RateLimitConfig) {
  const rateLimiter = new RateLimiter(config);
  return rateLimiter.checkLimit.bind(rateLimiter);
}

