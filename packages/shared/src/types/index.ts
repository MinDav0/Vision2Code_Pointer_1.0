/**
 * Core types for MCP Pointer v2.0
 * Security-first type definitions with strict validation
 */

// ===== ELEMENT DETECTION TYPES =====

export interface ElementPosition {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface CSSProperties {
  readonly display: string;
  readonly position: string;
  readonly fontSize: string;
  readonly color: string;
  readonly backgroundColor: string;
  readonly border?: string;
  readonly borderRadius?: string;
  readonly boxShadow?: string;
  readonly zIndex?: string;
}

export interface ComponentInfo {
  readonly name?: string;
  readonly sourceFile?: string;
  readonly framework?: 'react' | 'vue' | 'angular' | 'svelte';
  readonly props?: Record<string, unknown>;
  readonly state?: Record<string, unknown>;
}

export interface TargetedElement {
  readonly selector: string;
  readonly tagName: string;
  readonly id?: string;
  readonly classes: readonly string[];
  readonly innerText: string;
  readonly attributes: Readonly<Record<string, string>>;
  readonly position: ElementPosition;
  readonly cssProperties: CSSProperties;
  readonly componentInfo?: ComponentInfo;
  readonly timestamp: number;
  readonly url: string;
  readonly tabId?: number;
  readonly accessibility?: AccessibilityInfo;
}

export interface AccessibilityInfo {
  readonly role?: string;
  readonly ariaLabel?: string;
  readonly ariaDescribedBy?: string;
  readonly tabIndex?: number;
  readonly isFocusable: boolean;
  readonly isVisible: boolean;
  readonly contrastRatio?: number;
}

// ===== COMMUNICATION TYPES =====

export enum PointerMessageType {
  ELEMENT_SELECTED = 'element-selected',
  ELEMENT_CLEARED = 'element-cleared',
  CONNECTION_TEST = 'connection-test',
  SERVER_STATUS = 'server-status',
  AUTH_REQUEST = 'auth-request',
  AUTH_RESPONSE = 'auth-response',
  ERROR = 'error'
}

export interface PointerMessage<T = unknown> {
  readonly type: PointerMessageType;
  readonly data?: T;
  readonly timestamp: number;
  readonly messageId: string;
  readonly userId?: string;
  readonly sessionId?: string;
}

// ===== AUTHENTICATION TYPES =====

export interface User {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly role: UserRole;
  readonly permissions: readonly Permission[];
  readonly createdAt: Date;
  readonly lastLoginAt?: Date;
  readonly isActive: boolean;
}

export enum UserRole {
  ADMIN = 'admin',
  DEVELOPER = 'developer',
  VIEWER = 'viewer',
  GUEST = 'guest'
}

export enum Permission {
  SELECT_ELEMENTS = 'select_elements',
  MODIFY_CONFIG = 'modify_config',
  VIEW_LOGS = 'view_logs',
  MANAGE_USERS = 'manage_users',
  ACCESS_AI_FEATURES = 'access_ai_features',
  EXPORT_DATA = 'export_data'
}

export interface AuthToken {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresAt: Date;
  readonly tokenType: 'Bearer';
}

export interface AuthRequest {
  readonly email: string;
  readonly password: string;
  readonly rememberMe?: boolean;
}

export interface AuthResponse {
  readonly user: User;
  readonly token: AuthToken;
  readonly permissions: readonly Permission[];
}

// ===== WEBRTC TYPES =====

export enum WebRTCConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  FAILED = 'failed',
  CLOSED = 'closed'
}

export interface WebRTCConfig {
  readonly iceServers: readonly RTCIceServer[];
  readonly sdpSemantics: 'unified-plan' | 'plan-b';
  readonly bundlePolicy: RTCBundlePolicy;
  readonly rtcpMuxPolicy: RTCRtcpMuxPolicy;
}

export interface WebRTCMessage {
  readonly type: 'element-data' | 'heartbeat' | 'error';
  readonly payload: unknown;
  readonly timestamp: number;
  readonly messageId: string;
}

// ===== MCP PROTOCOL TYPES =====

export interface MCPTool {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: Record<string, unknown>;
  readonly outputSchema: Record<string, unknown>;
}

export interface MCPRequest {
  readonly id: string;
  readonly method: string;
  readonly params?: Record<string, unknown>;
  readonly timestamp: number;
}

export interface MCPResponse {
  readonly id: string;
  readonly result?: unknown;
  readonly error?: MCPError;
  readonly timestamp: number;
}

export interface MCPError {
  readonly code: number;
  readonly message: string;
  readonly data?: unknown;
}

// ===== SECURITY TYPES =====

export interface SecurityEvent {
  readonly id: string;
  readonly type: SecurityEventType;
  readonly severity: SecuritySeverity;
  readonly message: string;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly timestamp: Date;
  readonly userId?: string;
  readonly sessionId?: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
}

export enum SecurityEventType {
  AUTH_FAILURE = 'auth_failure',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  INVALID_INPUT = 'invalid_input',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  DATA_BREACH_ATTEMPT = 'data_breach_attempt'
}

export enum SecuritySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// ===== CONFIGURATION TYPES =====

export interface AppConfig {
  readonly server: ServerConfig;
  readonly security: SecurityConfig;
  readonly webrtc: WebRTCConfig;
  readonly ai: AIConfig;
  readonly monitoring: MonitoringConfig;
}

export interface ServerConfig {
  readonly port: number;
  readonly webrtcPort?: number;
  readonly host: string;
  readonly cors: CORSConfig;
  readonly rateLimit: RateLimitConfig;
}

export interface SecurityConfig {
  readonly jwt: JWTConfig;
  readonly bcrypt: BcryptConfig;
  readonly csp: CSPConfig;
  readonly headers: SecurityHeadersConfig;
}

export interface CORSConfig {
  readonly origin: readonly string[];
  readonly credentials: boolean;
  readonly methods: readonly string[];
  readonly allowedHeaders: readonly string[];
}

export interface RateLimitConfig {
  readonly windowMs: number;
  readonly max: number;
  readonly skipSuccessfulRequests: boolean;
  readonly skipFailedRequests: boolean;
}

export interface JWTConfig {
  readonly secret: string;
  readonly expiresIn: string;
  readonly refreshExpiresIn: string;
  readonly algorithm: 'HS256' | 'HS384' | 'HS512';
}

export interface BcryptConfig {
  readonly rounds: number;
  readonly saltRounds: number;
}

export interface CSPConfig {
  readonly directives: Readonly<Record<string, readonly string[]>>;
  readonly reportOnly: boolean;
  readonly reportUri?: string;
}

export interface SecurityHeadersConfig {
  readonly hsts: HSTSConfig;
  readonly xFrameOptions: string;
  readonly xContentTypeOptions: string;
  readonly xXSSProtection: string;
}

export interface HSTSConfig {
  readonly maxAge: number;
  readonly includeSubDomains: boolean;
  readonly preload: boolean;
}

export interface AIConfig {
  readonly providers: readonly AIProvider[];
  readonly defaultProvider: string;
  readonly rateLimit: RateLimitConfig;
}

export interface AIProvider {
  readonly name: string;
  readonly type: 'openai' | 'anthropic' | 'local';
  readonly apiKey?: string;
  readonly baseUrl?: string;
  readonly model: string;
  readonly maxTokens: number;
  readonly temperature: number;
}

export interface MonitoringConfig {
  readonly enabled: boolean;
  readonly metrics: MetricsConfig;
  readonly logging: LoggingConfig;
  readonly alerts: AlertsConfig;
}

export interface MetricsConfig {
  readonly enabled: boolean;
  readonly port: number;
  readonly path: string;
  readonly collectDefaultMetrics: boolean;
}

export interface LoggingConfig {
  readonly level: 'debug' | 'info' | 'warn' | 'error';
  readonly format: 'json' | 'text';
  readonly destination: 'console' | 'file' | 'both';
  readonly filePath?: string;
  readonly maxSize: string;
  readonly maxFiles: number;
}

export interface AlertsConfig {
  readonly enabled: boolean;
  readonly webhook?: string;
  readonly email?: string;
  readonly thresholds: Readonly<Record<string, number>>;
}

// ===== ERROR TYPES =====

export interface AppError {
  readonly code: string;
  readonly message: string;
  readonly statusCode: number;
  readonly details?: Readonly<Record<string, unknown>>;
  readonly timestamp: Date;
  readonly stack?: string;
}

export enum ErrorCode {
  // Authentication errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Element detection errors
  ELEMENT_NOT_FOUND = 'ELEMENT_NOT_FOUND',
  INVALID_SELECTOR = 'INVALID_SELECTOR',
  ELEMENT_NOT_VISIBLE = 'ELEMENT_NOT_VISIBLE',
  
  // Communication errors
  WEBSOCKET_CONNECTION_FAILED = 'WEBSOCKET_CONNECTION_FAILED',
  WEBRTC_CONNECTION_FAILED = 'WEBRTC_CONNECTION_FAILED',
  MCP_PROTOCOL_ERROR = 'MCP_PROTOCOL_ERROR',
  
  // System errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}

// ===== UTILITY TYPES =====

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

export type NonEmptyArray<T> = [T, ...T[]];

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// ===== EXPORT ALL TYPES =====

// All types are already exported above as interfaces and enums
