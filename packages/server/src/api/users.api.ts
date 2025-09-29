/**
 * Users API Routes for MCP Pointer v2.0
 * Handles user management and profile operations
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import type { User, UserRole } from '@mcp-pointer/shared';
import { createAppError, ErrorCode } from '@mcp-pointer/shared';

export class UsersAPI {
  private app: Hono;

  constructor() {
    this.app = new Hono();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Get current user profile
    this.app.get('/profile', async (c: Context) => {
      try {
        const user = c.get('user') as User;
        
        return c.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            permissions: user.permissions,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt,
            isActive: user.isActive
          }
        });
      } catch (error) {
        c.status(500);
        return c.json({
          error: 'Failed to get user profile',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Update user profile
    this.app.put('/profile', async (c: Context) => {
      try {
        const user = c.get('user') as User;
        const body = await c.req.json();
        
        // Validate allowed fields
        const allowedFields = ['email', 'firstName', 'lastName'];
        const updates: Partial<User> = {};
        
        for (const field of allowedFields) {
          if (body[field] !== undefined) {
            updates[field as keyof User] = body[field];
          }
        }
        
        // Here you would typically update the user in the database
        // For now, we'll return a mock response
        return c.json({
          success: true,
          message: 'Profile updated successfully',
          user: {
            ...user,
            ...updates,
            updatedAt: new Date().toISOString()
          }
        });
      } catch (error) {
        c.status(500);
        return c.json({
          error: 'Failed to update profile',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Change password
    this.app.post('/change-password', async (c: Context) => {
      try {
        const user = c.get('user') as User;
        const body = await c.req.json();
        
        const { currentPassword, newPassword } = body;
        
        if (!currentPassword || !newPassword) {
          throw createAppError(ErrorCode.INVALID_INPUT, 'Current and new passwords are required', 400);
        }
        
        if (newPassword.length < 8) {
          throw createAppError(ErrorCode.INVALID_INPUT, 'New password must be at least 8 characters', 400);
        }
        
        // Here you would typically:
        // 1. Verify current password
        // 2. Hash new password
        // 3. Update in database
        
        return c.json({
          success: true,
          message: 'Password changed successfully'
        });
      } catch (error) {
        const status = error instanceof Error && 'statusCode' in error 
          ? (error as any).statusCode 
          : 500;
        
        c.status(status);
        return c.json({
          error: 'Failed to change password',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Get user sessions
    this.app.get('/sessions', async (c: Context) => {
      try {
        const user = c.get('user') as User;
        
        // Here you would typically get active sessions from database
        // For now, we'll return a mock response
        const sessions = [
          {
            id: 'session_1',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            ipAddress: '192.168.1.100',
            createdAt: new Date().toISOString(),
            lastActivityAt: new Date().toISOString(),
            isCurrent: true
          }
        ];
        
        return c.json({
          success: true,
          sessions
        });
      } catch (error) {
        c.status(500);
        return c.json({
          error: 'Failed to get sessions',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Revoke session
    this.app.delete('/sessions/:sessionId', async (c: Context) => {
      try {
        const user = c.get('user') as User;
        const sessionId = c.req.param('sessionId');
        
        // Here you would typically revoke the session in database
        // For now, we'll return a mock response
        
        return c.json({
          success: true,
          message: 'Session revoked successfully'
        });
      } catch (error) {
        c.status(500);
        return c.json({
          error: 'Failed to revoke session',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Admin: Get all users (admin only)
    this.app.get('/admin/users', async (c: Context) => {
      try {
        const user = c.get('user') as User;
        
        if (user.role !== 'admin') {
          throw createAppError(ErrorCode.UNAUTHORIZED_ACCESS, 'Admin access required', 403);
        }
        
        // Here you would typically get all users from database
        // For now, we'll return a mock response
        const users = [
          {
            id: 'user_1',
            email: 'admin@example.com',
            role: 'admin',
            isActive: true,
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString()
          },
          {
            id: 'user_2',
            email: 'user@example.com',
            role: 'user',
            isActive: true,
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString()
          }
        ];
        
        return c.json({
          success: true,
          users,
          total: users.length
        });
      } catch (error) {
        const status = error instanceof Error && 'statusCode' in error 
          ? (error as any).statusCode 
          : 500;
        
        c.status(status);
        return c.json({
          error: 'Failed to get users',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Admin: Update user role
    this.app.put('/admin/users/:userId/role', async (c: Context) => {
      try {
        const user = c.get('user') as User;
        const userId = c.req.param('userId');
        const body = await c.req.json();
        
        if (user.role !== 'admin') {
          throw createAppError(ErrorCode.UNAUTHORIZED_ACCESS, 'Admin access required', 403);
        }
        
        const { role } = body;
        const validRoles: UserRole[] = ['admin', 'user', 'viewer'];
        
        if (!validRoles.includes(role)) {
          throw createAppError(ErrorCode.INVALID_INPUT, 'Invalid role', 400);
        }
        
        // Here you would typically update the user role in database
        
        return c.json({
          success: true,
          message: 'User role updated successfully',
          userId,
          newRole: role
        });
      } catch (error) {
        const status = error instanceof Error && 'statusCode' in error 
          ? (error as any).statusCode 
          : 500;
        
        c.status(status);
        return c.json({
          error: 'Failed to update user role',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  }

  public getApp(): Hono {
    return this.app;
  }
}

