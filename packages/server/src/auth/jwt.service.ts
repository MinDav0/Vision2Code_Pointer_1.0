/**
 * JWT Authentication Service
 * Secure token generation, validation, and management
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type {
  User,
  AuthToken,
  AuthRequest,
  AuthResponse,
  JWTConfig
} from '@mcp-pointer/shared';
import { UserRole, Permission } from '@mcp-pointer/shared';
import {
  AuthRequestSchema,
  AuthResponseSchema,
  validateInput,
  createAppError,
  generateSecureRandom,
  ErrorCode
} from '@mcp-pointer/shared';

export class JWTAuthService {
  private readonly config: JWTConfig;
  private readonly saltRounds: number;

  constructor(config: JWTConfig) {
    this.config = config;
    this.saltRounds = 12; // Secure bcrypt rounds
  }

  /**
   * Authenticate user with email and password
   */
  async authenticate(request: AuthRequest): Promise<AuthResponse> {
    // Validate input
    const validatedRequest = validateInput(AuthRequestSchema, request, 'auth.authenticate');

    // Find user by email (this would typically query a database)
    const user = await this.findUserByEmail(validatedRequest.email);
    if (!user) {
      throw createAppError(ErrorCode.INVALID_CREDENTIALS, 'Invalid email or password', 401);
    }

    // Verify password
    const isValidPassword = await this.verifyPassword(validatedRequest.password, user.passwordHash);
    if (!isValidPassword) {
      throw createAppError(ErrorCode.INVALID_CREDENTIALS, 'Invalid email or password', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      throw createAppError(ErrorCode.UNAUTHORIZED, 'Account is deactivated', 401);
    }

    // Generate tokens
    const token = await this.generateTokens(user);

    // Update last login
    await this.updateLastLogin(user.id);

    // Return auth response
    const authResponse: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.permissions,
        createdAt: user.createdAt,
        lastLoginAt: new Date(),
        isActive: user.isActive
      },
      token,
      permissions: user.permissions
    };

    return validateInput(AuthResponseSchema, authResponse, 'auth.authenticate');
  }

  /**
   * Generate access and refresh tokens
   */
  async generateTokens(user: User): Promise<AuthToken> {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions
    };

    const accessToken = jwt.sign(payload, this.config.secret, {
      expiresIn: this.config.expiresIn,
      algorithm: this.config.algorithm,
      issuer: 'mcp-pointer',
      audience: 'mcp-pointer-client'
    });

    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      this.config.secret,
      {
        expiresIn: this.config.refreshExpiresIn,
        algorithm: this.config.algorithm,
        issuer: 'mcp-pointer',
        audience: 'mcp-pointer-client'
      }
    );

    const expiresAt = new Date();
    expiresAt.setTime(expiresAt.getTime() + this.parseExpiry(this.config.expiresIn));

    return {
      accessToken,
      refreshToken,
      expiresAt,
      tokenType: 'Bearer'
    };
  }

  /**
   * Verify and decode JWT token
   */
  async verifyToken(token: string): Promise<JWTPayload> {
    try {
      const decoded = jwt.verify(token, this.config.secret, {
        algorithms: [this.config.algorithm],
        issuer: 'mcp-pointer',
        audience: 'mcp-pointer-client'
      }) as JWTPayload;

      // Check if token is expired
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        throw createAppError(ErrorCode.TOKEN_EXPIRED, 'Token has expired', 401);
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw createAppError(ErrorCode.TOKEN_INVALID, 'Invalid token', 401);
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw createAppError(ErrorCode.TOKEN_EXPIRED, 'Token has expired', 401);
      }
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthToken> {
    try {
      const decoded = jwt.verify(refreshToken, this.config.secret, {
        algorithms: [this.config.algorithm],
        issuer: 'mcp-pointer',
        audience: 'mcp-pointer-client'
      }) as RefreshTokenPayload;

      if (decoded.type !== 'refresh') {
        throw createAppError(ErrorCode.TOKEN_INVALID, 'Invalid refresh token', 401);
      }

      // Get user from database
      const user = await this.findUserById(decoded.userId);
      if (!user || !user.isActive) {
        throw createAppError(ErrorCode.UNAUTHORIZED, 'User not found or inactive', 401);
      }

      // Generate new tokens
      return this.generateTokens(user);
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw createAppError(ErrorCode.TOKEN_INVALID, 'Invalid refresh token', 401);
      }
      throw error;
    }
  }

  /**
   * Hash password securely
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate secure password reset token
   */
  generatePasswordResetToken(): string {
    return generateSecureRandom(32);
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(userPermissions: readonly Permission[], requiredPermission: Permission): boolean {
    return userPermissions.includes(requiredPermission);
  }

  /**
   * Check if user has any of the required permissions
   */
  hasAnyPermission(userPermissions: readonly Permission[], requiredPermissions: Permission[]): boolean {
    return requiredPermissions.some(permission => userPermissions.includes(permission));
  }

  /**
   * Check if user has all required permissions
   */
  hasAllPermissions(userPermissions: readonly Permission[], requiredPermissions: Permission[]): boolean {
    return requiredPermissions.every(permission => userPermissions.includes(permission));
  }

  /**
   * Get permissions for user role
   */
  getRolePermissions(role: UserRole): Permission[] {
    const rolePermissions: Record<UserRole, Permission[]> = {
      [UserRole.ADMIN]: [
        Permission.SELECT_ELEMENTS,
        Permission.MODIFY_CONFIG,
        Permission.VIEW_LOGS,
        Permission.MANAGE_USERS,
        Permission.ACCESS_AI_FEATURES,
        Permission.EXPORT_DATA
      ],
      [UserRole.DEVELOPER]: [
        Permission.SELECT_ELEMENTS,
        Permission.MODIFY_CONFIG,
        Permission.VIEW_LOGS,
        Permission.ACCESS_AI_FEATURES,
        Permission.EXPORT_DATA
      ],
      [UserRole.VIEWER]: [
        Permission.SELECT_ELEMENTS,
        Permission.VIEW_LOGS
      ],
      [UserRole.GUEST]: [
        Permission.SELECT_ELEMENTS
      ]
    };

    return rolePermissions[role] ?? [];
  }

  // Private helper methods

  private async findUserByEmail(email: string): Promise<UserWithPassword | null> {
    // This would typically query a database
    // For now, return a mock user for demonstration
    if (email === 'admin@yourcompany.com') {
      return {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'admin@yourcompany.com',
        name: 'Admin User',
        role: UserRole.ADMIN,
        permissions: this.getRolePermissions(UserRole.ADMIN),
        createdAt: new Date('2024-01-01'),
        lastLoginAt: undefined,
        isActive: true,
        passwordHash: await this.hashPassword('admin123!')
      };
    }
    return null;
  }

  private async findUserById(userId: string): Promise<User | null> {
    // This would typically query a database
    if (userId === '123e4567-e89b-12d3-a456-426614174000') {
      return {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'admin@yourcompany.com',
        name: 'Admin User',
        role: UserRole.ADMIN,
        permissions: this.getRolePermissions(UserRole.ADMIN),
        createdAt: new Date('2024-01-01'),
        lastLoginAt: undefined,
        isActive: true
      };
    }
    return null;
  }

  private async updateLastLogin(userId: string): Promise<void> {
    // This would typically update the database
    console.log(`Updated last login for user: ${userId}`);
  }

  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid expiry format: ${expiry}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: throw new Error(`Invalid expiry unit: ${unit}`);
    }
  }
}

// Types for internal use

interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

interface RefreshTokenPayload {
  userId: string;
  type: 'refresh';
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

interface UserWithPassword extends User {
  passwordHash: string;
}
