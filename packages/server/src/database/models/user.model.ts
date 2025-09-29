/**
 * User Model
 * Secure user data management with validation and audit logging
 */

import bcrypt from 'bcryptjs';
import type { User, UserRole, Permission } from '@mcp-pointer/shared';
import { createAppError, ErrorCode, generateUUID, validateEmail } from '@mcp-pointer/shared';
import { DatabaseConnection } from '../connection.js';

export interface UserWithPassword extends User {
  passwordHash: string;
}

export interface CreateUserData {
  email: string;
  name: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserData {
  name?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UserFilters {
  role?: UserRole;
  isActive?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export class UserModel {
  private db: DatabaseConnection;

  constructor(db: DatabaseConnection) {
    this.db = db;
  }

  public async create(userData: CreateUserData): Promise<User> {
    try {
      // Validate input
      const email = validateEmail(userData.email);
      const name = userData.name.trim();
      
      if (name.length < 1 || name.length > 100) {
        throw createAppError(
          ErrorCode.VALIDATION_ERROR,
          'Name must be between 1 and 100 characters',
          400
        );
      }

      // Check if user already exists
      const existingUser = await this.findByEmail(email);
      if (existingUser) {
        throw createAppError(
          ErrorCode.VALIDATION_ERROR,
          'User with this email already exists',
          400
        );
      }

      // Hash password securely
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(userData.password, saltRounds);

      // Create user
      const userId = generateUUID();
      const insertSQL = `
        INSERT INTO users (id, email, name, password_hash, role, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
      `;

      await this.db.executeUpdate(insertSQL, [
        userId,
        email,
        name,
        passwordHash,
        userData.role
      ]);

      // Return user without password
      const user = await this.findById(userId);
      if (!user) {
        throw createAppError(
          ErrorCode.DATABASE_ERROR,
          'Failed to retrieve created user',
          500
        );
      }

      return user;
    } catch (error) {
      if (error instanceof Error && error.message.includes('User with this email already exists')) {
        throw error;
      }
      throw createAppError(
        ErrorCode.DATABASE_ERROR,
        `Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  public async findById(id: string): Promise<User | null> {
    try {
      const result = await this.db.executeQuery<{
        id: string;
        email: string;
        name: string;
        role: string;
        is_active: number;
        created_at: string;
        updated_at: string;
        last_login_at: string | null;
      }>('SELECT id, email, name, role, is_active, created_at, updated_at, last_login_at FROM users WHERE id = ?', [id]);

      if (result.length === 0) {
        return null;
      }

      const row = result[0]!;
      return {
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role as UserRole,
        permissions: this.getRolePermissions(row.role as UserRole),
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : undefined,
        isActive: Boolean(row.is_active)
      };
    } catch (error) {
      throw createAppError(
        ErrorCode.DATABASE_ERROR,
        `Failed to find user by ID: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  public async findByEmail(email: string): Promise<User | null> {
    try {
      const validatedEmail = validateEmail(email);
      const result = await this.db.executeQuery<{
        id: string;
        email: string;
        name: string;
        role: string;
        is_active: number;
        created_at: string;
        updated_at: string;
        last_login_at: string | null;
      }>('SELECT id, email, name, role, is_active, created_at, updated_at, last_login_at FROM users WHERE email = ?', [validatedEmail]);

      if (result.length === 0) {
        return null;
      }

      const row = result[0]!;
      return {
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role as UserRole,
        permissions: this.getRolePermissions(row.role as UserRole),
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : undefined,
        isActive: Boolean(row.is_active)
      };
    } catch (error) {
      throw createAppError(
        ErrorCode.DATABASE_ERROR,
        `Failed to find user by email: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  public async findByEmailWithPassword(email: string): Promise<UserWithPassword | null> {
    try {
      const validatedEmail = validateEmail(email);
      const result = await this.db.executeQuery<{
        id: string;
        email: string;
        name: string;
        role: string;
        password_hash: string;
        is_active: number;
        created_at: string;
        updated_at: string;
        last_login_at: string | null;
        failed_login_attempts: number;
        locked_until: string | null;
      }>('SELECT id, email, name, role, password_hash, is_active, created_at, updated_at, last_login_at, failed_login_attempts, locked_until FROM users WHERE email = ?', [validatedEmail]);

      if (result.length === 0) {
        return null;
      }

      const row = result[0]!;
      return {
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role as UserRole,
        permissions: this.getRolePermissions(row.role as UserRole),
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : undefined,
        isActive: Boolean(row.is_active),
        passwordHash: row.password_hash
      };
    } catch (error) {
      throw createAppError(
        ErrorCode.DATABASE_ERROR,
        `Failed to find user by email with password: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  public async update(id: string, updateData: UpdateUserData): Promise<User> {
    try {
      // Check if user exists
      const existingUser = await this.findById(id);
      if (!existingUser) {
        throw createAppError(
          ErrorCode.VALIDATION_ERROR,
          'User not found',
          404
        );
      }

      // Build update query dynamically
      const updates: string[] = [];
      const params: unknown[] = [];

      if (updateData.name !== undefined) {
        const name = updateData.name.trim();
        if (name.length < 1 || name.length > 100) {
          throw createAppError(
            ErrorCode.VALIDATION_ERROR,
            'Name must be between 1 and 100 characters',
            400
          );
        }
        updates.push('name = ?');
        params.push(name);
      }

      if (updateData.role !== undefined) {
        updates.push('role = ?');
        params.push(updateData.role);
      }

      if (updateData.isActive !== undefined) {
        updates.push('is_active = ?');
        params.push(updateData.isActive ? 1 : 0);
      }

      if (updates.length === 0) {
        return existingUser;
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      const updateSQL = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
      await this.db.executeUpdate(updateSQL, params);

      // Return updated user
      const updatedUser = await this.findById(id);
      if (!updatedUser) {
        throw createAppError(
          ErrorCode.DATABASE_ERROR,
          'Failed to retrieve updated user',
          500
        );
      }

      return updatedUser;
    } catch (error) {
      if (error instanceof Error && error.message.includes('User not found')) {
        throw error;
      }
      throw createAppError(
        ErrorCode.DATABASE_ERROR,
        `Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  public async delete(id: string): Promise<void> {
    try {
      // Check if user exists
      const existingUser = await this.findById(id);
      if (!existingUser) {
        throw createAppError(
          ErrorCode.VALIDATION_ERROR,
          'User not found',
          404
        );
      }

      // Delete user (cascade will handle related records)
      await this.db.executeUpdate('DELETE FROM users WHERE id = ?', [id]);
    } catch (error) {
      if (error instanceof Error && error.message.includes('User not found')) {
        throw error;
      }
      throw createAppError(
        ErrorCode.DATABASE_ERROR,
        `Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  public async list(filters: UserFilters = {}): Promise<{ users: User[]; total: number }> {
    try {
      const conditions: string[] = [];
      const params: unknown[] = [];

      if (filters.role) {
        conditions.push('role = ?');
        params.push(filters.role);
      }

      if (filters.isActive !== undefined) {
        conditions.push('is_active = ?');
        params.push(filters.isActive ? 1 : 0);
      }

      if (filters.search) {
        conditions.push('(name LIKE ? OR email LIKE ?)');
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      
      // Get total count
      const countSQL = `SELECT COUNT(*) as total FROM users ${whereClause}`;
      const countResult = await this.db.executeQuery<{ total: number }>(countSQL, params);
      const total = countResult[0]?.total ?? 0;

      // Get users with pagination
      const limit = Math.min(filters.limit ?? 50, 100); // Max 100 per page
      const offset = filters.offset ?? 0;
      
      const usersSQL = `
        SELECT id, email, name, role, is_active, created_at, updated_at, last_login_at
        FROM users ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      const result = await this.db.executeQuery<{
        id: string;
        email: string;
        name: string;
        role: string;
        is_active: number;
        created_at: string;
        updated_at: string;
        last_login_at: string | null;
      }>(usersSQL, [...params, limit, offset]);

      const users: User[] = result.map(row => ({
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role as UserRole,
        permissions: this.getRolePermissions(row.role as UserRole),
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : undefined,
        isActive: Boolean(row.is_active)
      }));

      return { users, total };
    } catch (error) {
      throw createAppError(
        ErrorCode.DATABASE_ERROR,
        `Failed to list users: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  public async updateLastLogin(id: string): Promise<void> {
    try {
      await this.db.executeUpdate(
        'UPDATE users SET last_login_at = CURRENT_TIMESTAMP, failed_login_attempts = 0, locked_until = NULL WHERE id = ?',
        [id]
      );
    } catch (error) {
      throw createAppError(
        ErrorCode.DATABASE_ERROR,
        `Failed to update last login: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  public async incrementFailedLoginAttempts(id: string): Promise<void> {
    try {
      await this.db.executeUpdate(
        'UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE id = ?',
        [id]
      );
    } catch (error) {
      throw createAppError(
        ErrorCode.DATABASE_ERROR,
        `Failed to increment failed login attempts: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  public async lockUser(id: string, lockoutMinutes: number = 15): Promise<void> {
    try {
      const lockoutUntil = new Date();
      lockoutUntil.setMinutes(lockoutUntil.getMinutes() + lockoutMinutes);
      
      await this.db.executeUpdate(
        'UPDATE users SET locked_until = ? WHERE id = ?',
        [lockoutUntil.toISOString(), id]
      );
    } catch (error) {
      throw createAppError(
        ErrorCode.DATABASE_ERROR,
        `Failed to lock user: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  public async isUserLocked(id: string): Promise<boolean> {
    try {
      const result = await this.db.executeQuery<{ locked_until: string | null }>(
        'SELECT locked_until FROM users WHERE id = ?',
        [id]
      );

      if (result.length === 0) {
        return false;
      }

      const lockedUntil = result[0]?.locked_until;
      if (!lockedUntil) {
        return false;
      }

      return new Date(lockedUntil) > new Date();
    } catch (error) {
      throw createAppError(
        ErrorCode.DATABASE_ERROR,
        `Failed to check user lock status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  public async verifyPassword(user: UserWithPassword, password: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, user.passwordHash);
    } catch (error) {
      throw createAppError(
        ErrorCode.DATABASE_ERROR,
        `Password verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  private getRolePermissions(role: UserRole): readonly Permission[] {
    const rolePermissions: Record<UserRole, readonly Permission[]> = {
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
        Permission.ACCESS_AI_FEATURES,
        Permission.EXPORT_DATA
      ],
      [UserRole.VIEWER]: [
        Permission.SELECT_ELEMENTS
      ],
      [UserRole.GUEST]: [
        Permission.SELECT_ELEMENTS
      ]
    };

    return rolePermissions[role] ?? [];
  }
}

// Export user model instance
export const userModel = new UserModel(DatabaseConnection.getInstance());

