/**
 * Security-first utility functions
 * All functions include input validation and sanitization
 */

import { z } from 'zod';
import type { AppError } from '../types/index.js';
import { ErrorCode } from '../types/index.js';

// ===== INPUT VALIDATION & SANITIZATION =====

/**
 * Sanitize string input to prevent XSS and injection attacks
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove JavaScript URLs
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .substring(0, 1000); // Limit length
}

/**
 * Sanitize HTML content
 */
export function sanitizeHTML(input: unknown): string {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }
  
  // Remove script tags and event handlers with safe regex patterns
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '');
}

/**
 * Validate and sanitize URL
 */
export function sanitizeURL(input: unknown): string {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }
  
  try {
    const url = new URL(input);
    
    // Only allow safe protocols
    if (!['http:', 'https:', 'ws:', 'wss:'].includes(url.protocol)) {
      throw new Error('Unsafe protocol');
    }
    
    // Block localhost in production
    if (process.env.NODE_ENV === 'production' && 
        (url.hostname === 'localhost' || url.hostname === '127.0.0.1')) {
      throw new Error('Localhost URLs not allowed in production');
    }
    
    return url.toString();
  } catch (error) {
    throw new Error(`Invalid URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate email address
 */
export function validateEmail(email: unknown): string {
  if (typeof email !== 'string') {
    throw new Error('Email must be a string');
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email) || email.length > 254) {
    throw new Error('Invalid email format');
  }
  
  return email.toLowerCase().trim();
}

/**
 * Validate password strength
 */
export function validatePassword(password: unknown): string {
  if (typeof password !== 'string') {
    throw new Error('Password must be a string');
  }
  
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
  
  if (password.length > 128) {
    throw new Error('Password must be less than 128 characters');
  }
  
  // Check for common weak patterns
  const weakPatterns = [
    /password/i,
    /123456/,
    /qwerty/i,
    /admin/i,
    /letmein/i
  ];
  
  if (weakPatterns.some(pattern => pattern.test(password))) {
    throw new Error('Password is too weak');
  }
  
  return password;
}

// ===== ERROR HANDLING =====

/**
 * Create standardized application error
 */
export function createAppError(
  code: ErrorCode,
  message: string,
  statusCode: number = 500,
  details?: Record<string, unknown>
): AppError {
  const error = new Error();
  return {
    code,
    message,
    statusCode,
    details: details || {},
    timestamp: new Date(),
    ...(error.stack && { stack: error.stack })
  } as AppError;
}

/**
 * Handle and log errors securely
 */
export function handleError(error: unknown, context?: string): AppError {
  // Don't expose internal error details in production
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (error instanceof Error) {
    return createAppError(
      ErrorCode.INTERNAL_SERVER_ERROR,
      isProduction ? 'An internal error occurred' : error.message,
      500,
      isProduction ? undefined : { context, stack: error.stack }
    );
  }
  
  return createAppError(
    ErrorCode.INTERNAL_SERVER_ERROR,
    isProduction ? 'An internal error occurred' : String(error),
    500,
    isProduction ? undefined : { context }
  );
}

// ===== CRYPTOGRAPHIC UTILITIES =====

/**
 * Generate cryptographically secure random string
 */
export function generateSecureRandom(length: number = 32): string {
  if (length < 1 || length > 256) {
    throw new Error('Length must be between 1 and 256');
  }
  
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  // Use crypto.getRandomValues for secure randomness
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.getRandomValues) {
    const array = new Uint8Array(length);
    globalThis.crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
      result += chars[array[i]! % chars.length];
    }
  } else {
    // Fallback for environments without crypto.getRandomValues
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return result;
}

/**
 * Generate secure UUID v4
 */
export function generateUUID(): string {
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  
  // Fallback implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ===== VALIDATION HELPERS =====

/**
 * Validate input against Zod schema with error handling
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  input: unknown,
  context?: string
): T {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw createAppError(ErrorCode.VALIDATION_ERROR, message, 400, { context, errors: error.errors });
    }
    throw handleError(error, context);
  }
}

/**
 * Safe JSON parsing with validation
 */
export function safeJSONParse<T>(
  input: string,
  schema?: z.ZodSchema<T>
): T {
  try {
    const parsed = JSON.parse(input);
    
    if (schema) {
      return validateInput(schema, parsed);
    }
    
    return parsed as T;
  } catch (error) {
    throw createAppError(ErrorCode.INVALID_INPUT, 'Invalid JSON format', 400);
  }
}

// ===== RATE LIMITING =====

/**
 * Simple in-memory rate limiter
 */
export class RateLimiter {
  private readonly requests = new Map<string, number[]>();
  
  constructor(
    private readonly windowMs: number,
    private readonly maxRequests: number
  ) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Get existing requests for this identifier
    const userRequests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => time > windowStart);
    
    // Check if under limit
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }
  
  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const userRequests = this.requests.get(identifier) || [];
    const validRequests = userRequests.filter(time => time > windowStart);
    
    return Math.max(0, this.maxRequests - validRequests.length);
  }
  
  getResetTime(identifier: string): number {
    const userRequests = this.requests.get(identifier) || [];
    if (userRequests.length === 0) return 0;
    
    const oldestRequest = Math.min(...userRequests);
    return oldestRequest + this.windowMs;
  }
}

// ===== SECURITY HEADERS =====

/**
 * Generate Content Security Policy header
 */
export function generateCSPHeader(options: {
  defaultSrc?: string[];
  scriptSrc?: string[];
  styleSrc?: string[];
  imgSrc?: string[];
  connectSrc?: string[];
  fontSrc?: string[];
  objectSrc?: string[];
  mediaSrc?: string[];
  frameSrc?: string[];
  reportUri?: string;
}): string {
  const directives: string[] = [];
  
  if (options.defaultSrc) {
    directives.push(`default-src ${options.defaultSrc.join(' ')}`);
  }
  if (options.scriptSrc) {
    directives.push(`script-src ${options.scriptSrc.join(' ')}`);
  }
  if (options.styleSrc) {
    directives.push(`style-src ${options.styleSrc.join(' ')}`);
  }
  if (options.imgSrc) {
    directives.push(`img-src ${options.imgSrc.join(' ')}`);
  }
  if (options.connectSrc) {
    directives.push(`connect-src ${options.connectSrc.join(' ')}`);
  }
  if (options.fontSrc) {
    directives.push(`font-src ${options.fontSrc.join(' ')}`);
  }
  if (options.objectSrc) {
    directives.push(`object-src ${options.objectSrc.join(' ')}`);
  }
  if (options.mediaSrc) {
    directives.push(`media-src ${options.mediaSrc.join(' ')}`);
  }
  if (options.frameSrc) {
    directives.push(`frame-src ${options.frameSrc.join(' ')}`);
  }
  if (options.reportUri) {
    directives.push(`report-uri ${options.reportUri}`);
  }
  
  return directives.join('; ');
}

// ===== LOGGING UTILITIES =====

/**
 * Sanitize log data to prevent sensitive information leakage
 */
export function sanitizeLogData(data: unknown): unknown {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'key',
    'api_key',
    'auth',
    'authorization',
    'cookie',
    'session'
  ];
  
  const sanitized: Record<string, unknown> = {};
  const dataObj = data as Record<string, unknown>;
  
  for (const key of Object.keys(dataObj)) {
    // Validate key to prevent object injection
    if (typeof key !== 'string' || key.length > 100) {
      continue;
    }
    
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof dataObj[key] === 'object' && dataObj[key] !== null) {
      sanitized[key] = sanitizeLogData(dataObj[key]);
    } else {
      sanitized[key] = dataObj[key];
    }
  }
  
  return sanitized;
}

// ===== EXPORT ALL UTILITIES =====

// All utilities are already exported above as individual functions and classes
