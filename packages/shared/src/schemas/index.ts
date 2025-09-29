/**
 * Security-first validation schemas using Zod
 * All inputs must be validated against these schemas
 */

import { z } from 'zod';
import type {
  ElementPosition
} from '../types/index.js';
import {
  PointerMessageType,
  UserRole,
  Permission,
  WebRTCConnectionState,
  SecurityEventType,
  SecuritySeverity,
  ErrorCode
} from '../types/index.js';

// ===== BASE VALIDATION SCHEMAS =====

const nonEmptyString = z.string().min(1).max(1000);
const urlSchema = z.string().url().max(2048);
const emailSchema = z.string().email().max(254);
const uuidSchema = z.string().uuid();
const timestampSchema = z.number().positive().int();
const positiveNumber = z.number().positive();
const nonNegativeNumber = z.number().nonnegative();

// ===== ELEMENT VALIDATION SCHEMAS =====

export const ElementPositionSchema = z.object({
  x: nonNegativeNumber,
  y: nonNegativeNumber,
  width: positiveNumber,
  height: positiveNumber
}) satisfies z.ZodType<ElementPosition>;

export const CSSPropertiesSchema = z.object({
  display: nonEmptyString,
  position: nonEmptyString,
  fontSize: nonEmptyString,
  color: nonEmptyString,
  backgroundColor: nonEmptyString,
  border: z.string().optional(),
  borderRadius: z.string().optional(),
  boxShadow: z.string().optional(),
  zIndex: z.string().optional()
});

export const ComponentInfoSchema = z.object({
  name: z.string().optional(),
  sourceFile: z.string().optional(),
  framework: z.enum(['react', 'vue', 'angular', 'svelte']).optional(),
  props: z.record(z.unknown()).optional(),
  state: z.record(z.unknown()).optional()
});

export const AccessibilityInfoSchema = z.object({
  role: z.string().optional(),
  ariaLabel: z.string().optional(),
  ariaDescribedBy: z.string().optional(),
  tabIndex: z.number().int().optional(),
  isFocusable: z.boolean(),
  isVisible: z.boolean(),
  contrastRatio: z.number().positive().optional()
});

export const TargetedElementSchema = z.object({
  selector: nonEmptyString,
  tagName: nonEmptyString,
  id: z.string().optional(),
  classes: z.array(z.string()).readonly(),
  innerText: z.string(),
  attributes: z.record(z.string()).readonly(),
  position: ElementPositionSchema,
  cssProperties: CSSPropertiesSchema,
  componentInfo: ComponentInfoSchema.optional(),
  timestamp: timestampSchema,
  url: urlSchema,
  tabId: z.number().positive().int().optional(),
  accessibility: AccessibilityInfoSchema.optional()
});

// ===== COMMUNICATION VALIDATION SCHEMAS =====

export const PointerMessageTypeSchema = z.nativeEnum(PointerMessageType);

export const PointerMessageSchema = z.object({
  type: PointerMessageTypeSchema,
  data: z.unknown().optional(),
  timestamp: timestampSchema,
  messageId: uuidSchema,
  userId: uuidSchema.optional(),
  sessionId: uuidSchema.optional()
});

// ===== AUTHENTICATION VALIDATION SCHEMAS =====

export const UserRoleSchema = z.nativeEnum(UserRole);

export const PermissionSchema = z.nativeEnum(Permission);

export const UserSchema = z.object({
  id: uuidSchema,
  email: emailSchema,
  name: nonEmptyString,
  role: UserRoleSchema,
  permissions: z.array(PermissionSchema).readonly(),
  createdAt: z.date(),
  lastLoginAt: z.date().optional(),
  isActive: z.boolean()
});

export const AuthTokenSchema = z.object({
  accessToken: nonEmptyString,
  refreshToken: nonEmptyString,
  expiresAt: z.date(),
  tokenType: z.literal('Bearer')
});

export const AuthRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(128), // Strong password requirements
  rememberMe: z.boolean().optional()
});

export const AuthResponseSchema = z.object({
  user: UserSchema,
  token: AuthTokenSchema,
  permissions: z.array(PermissionSchema).readonly()
});

// ===== WEBRTC VALIDATION SCHEMAS =====

export const WebRTCConnectionStateSchema = z.nativeEnum(WebRTCConnectionState);

export const RTCIceServerSchema = z.object({
  urls: z.union([z.string(), z.array(z.string())]),
  username: z.string().optional(),
  credential: z.string().optional(),
  credentialType: z.enum(['password', 'oauth']).optional()
});

export const WebRTCConfigSchema = z.object({
  iceServers: z.array(RTCIceServerSchema).readonly(),
  sdpSemantics: z.enum(['unified-plan', 'plan-b']),
  bundlePolicy: z.enum(['balanced', 'max-compat', 'max-bundle']),
  rtcpMuxPolicy: z.enum(['negotiate', 'require'])
});

export const WebRTCMessageSchema = z.object({
  type: z.enum(['element-data', 'heartbeat', 'error']),
  payload: z.unknown(),
  timestamp: timestampSchema,
  messageId: uuidSchema
});

// ===== MCP PROTOCOL VALIDATION SCHEMAS =====

export const MCPToolSchema = z.object({
  name: nonEmptyString,
  description: nonEmptyString,
  inputSchema: z.record(z.unknown()),
  outputSchema: z.record(z.unknown())
});

export const MCPRequestSchema = z.object({
  id: uuidSchema,
  method: nonEmptyString,
  params: z.record(z.unknown()).optional(),
  timestamp: timestampSchema
});

export const MCPErrorSchema = z.object({
  code: z.number().int(),
  message: nonEmptyString,
  data: z.unknown().optional()
});

export const MCPResponseSchema = z.object({
  id: uuidSchema,
  result: z.unknown().optional(),
  error: MCPErrorSchema.optional(),
  timestamp: timestampSchema
});

// ===== SECURITY VALIDATION SCHEMAS =====

export const SecurityEventTypeSchema = z.nativeEnum(SecurityEventType);

export const SecuritySeveritySchema = z.nativeEnum(SecuritySeverity);

export const SecurityEventSchema = z.object({
  id: uuidSchema,
  type: SecurityEventTypeSchema,
  severity: SecuritySeveritySchema,
  message: nonEmptyString,
  metadata: z.record(z.unknown()).readonly(),
  timestamp: z.date(),
  userId: uuidSchema.optional(),
  sessionId: uuidSchema.optional(),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().optional()
});

// ===== CONFIGURATION VALIDATION SCHEMAS =====

export const CORSConfigSchema = z.object({
  origin: z.array(z.string()).readonly(),
  credentials: z.boolean(),
  methods: z.array(z.string()).readonly(),
  allowedHeaders: z.array(z.string()).readonly()
});

export const RateLimitConfigSchema = z.object({
  windowMs: z.number().positive().int(),
  max: z.number().positive().int(),
  skipSuccessfulRequests: z.boolean(),
  skipFailedRequests: z.boolean()
});

export const JWTConfigSchema = z.object({
  secret: z.string().min(32), // Minimum 32 characters for security
  expiresIn: z.string(),
  refreshExpiresIn: z.string(),
  algorithm: z.enum(['HS256', 'HS384', 'HS512'])
});

export const BcryptConfigSchema = z.object({
  rounds: z.number().int().min(10).max(15), // Secure bcrypt rounds
  saltRounds: z.number().int().min(10).max(15)
});

export const CSPConfigSchema = z.object({
  directives: z.record(z.array(z.string())).readonly(),
  reportOnly: z.boolean(),
  reportUri: z.string().url().optional()
});

export const HSTSConfigSchema = z.object({
  maxAge: z.number().positive().int(),
  includeSubDomains: z.boolean(),
  preload: z.boolean()
});

export const SecurityHeadersConfigSchema = z.object({
  hsts: HSTSConfigSchema,
  xFrameOptions: z.string(),
  xContentTypeOptions: z.string(),
  xXSSProtection: z.string()
});

export const SecurityConfigSchema = z.object({
  jwt: JWTConfigSchema,
  bcrypt: BcryptConfigSchema,
  csp: CSPConfigSchema,
  headers: SecurityHeadersConfigSchema
});

export const ServerConfigSchema = z.object({
  port: z.number().int().min(1).max(65535),
  host: z.string().ip().or(z.literal('localhost')),
  cors: CORSConfigSchema,
  rateLimit: RateLimitConfigSchema
});

export const AIProviderSchema = z.object({
  name: nonEmptyString,
  type: z.enum(['openai', 'anthropic', 'local']),
  apiKey: z.string().optional(),
  baseUrl: z.string().url().optional(),
  model: nonEmptyString,
  maxTokens: z.number().positive().int(),
  temperature: z.number().min(0).max(2)
});

export const AIConfigSchema = z.object({
  providers: z.array(AIProviderSchema).readonly(),
  defaultProvider: nonEmptyString,
  rateLimit: RateLimitConfigSchema
});

export const MetricsConfigSchema = z.object({
  enabled: z.boolean(),
  port: z.number().int().min(1).max(65535),
  path: z.string().startsWith('/'),
  collectDefaultMetrics: z.boolean()
});

export const LoggingConfigSchema = z.object({
  level: z.enum(['debug', 'info', 'warn', 'error']),
  format: z.enum(['json', 'text']),
  destination: z.enum(['console', 'file', 'both']),
  filePath: z.string().optional(),
  maxSize: z.string(),
  maxFiles: z.number().positive().int()
});

export const AlertsConfigSchema = z.object({
  enabled: z.boolean(),
  webhook: z.string().url().optional(),
  email: z.string().email().optional(),
  thresholds: z.record(z.number()).readonly()
});

export const MonitoringConfigSchema = z.object({
  enabled: z.boolean(),
  metrics: MetricsConfigSchema,
  logging: LoggingConfigSchema,
  alerts: AlertsConfigSchema
});

export const AppConfigSchema = z.object({
  server: ServerConfigSchema,
  security: SecurityConfigSchema,
  webrtc: WebRTCConfigSchema,
  ai: AIConfigSchema,
  monitoring: MonitoringConfigSchema
});

// ===== ERROR VALIDATION SCHEMAS =====

export const ErrorCodeSchema = z.nativeEnum(ErrorCode);

export const AppErrorSchema = z.object({
  code: ErrorCodeSchema,
  message: nonEmptyString,
  statusCode: z.number().int().min(100).max(599),
  details: z.record(z.unknown()).optional(),
  timestamp: z.date(),
  stack: z.string().optional()
});

// ===== INPUT SANITIZATION SCHEMAS =====

export const SanitizedStringSchema = z.string()
  .transform((str) => str.trim())
  .refine((str) => str.length > 0, 'String cannot be empty after trimming')
  .refine((str) => str.length <= 1000, 'String too long')
  .refine((str) => !/<script/i.test(str), 'Potential XSS detected')
  .refine((str) => !/javascript:/i.test(str), 'Potential XSS detected');

export const SanitizedHTMLSchema = z.string()
  .refine((str) => !/<script/i.test(str), 'Script tags not allowed')
  .refine((str) => !/javascript:/i.test(str), 'JavaScript URLs not allowed')
  .refine((str) => !/on\w+\s*=/i.test(str), 'Event handlers not allowed');

export const SanitizedURLSchema = z.string()
  .url()
  .refine((url) => {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:', 'ws:', 'wss:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }, 'Invalid or unsafe protocol')
  .refine((url) => {
    const parsed = new URL(url);
    return !parsed.hostname.includes('localhost') || process.env.NODE_ENV === 'development';
  }, 'Localhost URLs not allowed in production');

// ===== EXPORT ALL SCHEMAS =====

export {
  // Base schemas
  nonEmptyString,
  urlSchema,
  emailSchema,
  uuidSchema,
  timestampSchema,
  positiveNumber,
  nonNegativeNumber
};
