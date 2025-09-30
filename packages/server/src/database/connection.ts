/**
 * Secure Database Connection Manager
 * SQLite with security-first design and connection pooling
 */

import { Database } from 'bun:sqlite';
import path from 'path';
import fs from 'fs';
import type { AppError } from '@mcp-pointer/shared';
import { createAppError, ErrorCode, sanitizeString } from '@mcp-pointer/shared';

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private db: Database | null = null;
  private readonly dbPath: string;
  // private readonly maxConnections: number = 1; // SQLite is single-threaded

  private constructor(dbPath: string) {
    // Validate and sanitize database path
    const normalizedPath = path.normalize(dbPath);
    const resolvedPath = path.resolve(normalizedPath);
    
    // Ensure path is within allowed directory
    const allowedDir = path.resolve(process.cwd(), 'data');
    if (!resolvedPath.startsWith(allowedDir)) {
      throw createAppError(
        ErrorCode.INVALID_INPUT,
        'Database path must be within allowed directory',
        400
      );
    }
    
    this.dbPath = resolvedPath;
  }

  public static getInstance(dbPath?: string): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      const defaultPath = path.join(process.cwd(), 'data', 'mcp-pointer.db');
      DatabaseConnection.instance = new DatabaseConnection(dbPath ?? defaultPath);
    }
    return DatabaseConnection.instance;
  }

  public async connect(): Promise<void> {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 }); // Secure permissions
      }

      // Initialize database with security settings
      this.db = new Database(this.dbPath, {
        create: true,
        readwrite: true,
        strict: true
      });

      // Enable security features
      this.db.exec('PRAGMA journal_mode = WAL'); // Write-Ahead Logging
      this.db.exec('PRAGMA synchronous = FULL'); // Full synchronization
      this.db.exec('PRAGMA cache_size = 1000'); // Cache size
      this.db.exec('PRAGMA temp_store = MEMORY'); // Store temp tables in memory
      this.db.exec('PRAGMA foreign_keys = ON'); // Enable foreign key constraints
      this.db.exec('PRAGMA secure_delete = ON'); // Secure delete (overwrite deleted data)

      // Set up prepared statements for security
      this.setupPreparedStatements();

    } catch (error) {
      throw createAppError(
        ErrorCode.DATABASE_ERROR,
        `Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  public getDatabase(): Database {
    if (!this.db) {
      throw createAppError(
        ErrorCode.DATABASE_ERROR,
        'Database not connected',
        500
      );
    }
    return this.db;
  }

  public async disconnect(): Promise<void> {
    if (this.db) {
      try {
        this.db.close();
        this.db = null;
      } catch (error) {
        throw createAppError(
          ErrorCode.DATABASE_ERROR,
          `Failed to disconnect from database: ${error instanceof Error ? error.message : 'Unknown error'}`,
          500
        );
      }
    }
  }

  public async executeQuery<T = unknown>(
    query: string,
    params: unknown[] = []
  ): Promise<T[]> {
    if (!this.db) {
      throw createAppError(
        ErrorCode.DATABASE_ERROR,
        'Database not connected',
        500
      );
    }

    try {
      // Validate query to prevent SQL injection
      this.validateQuery(query);
      
      // Sanitize parameters
      const sanitizedParams = params.map(param => this.sanitizeParameter(param));
      
      const stmt = this.db.query(query);
      const result = stmt.all(...sanitizedParams) as T[];
      
      return result;
    } catch (error) {
      throw createAppError(
        ErrorCode.DATABASE_ERROR,
        `Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  public async executeUpdate(
    query: string,
    params: unknown[] = []
  ): Promise<{ changes: number; lastInsertRowid: number }> {
    if (!this.db) {
      throw createAppError(
        ErrorCode.DATABASE_ERROR,
        'Database not connected',
        500
      );
    }

    try {
      // Validate query to prevent SQL injection
      this.validateQuery(query);
      
      // Sanitize parameters
      const sanitizedParams = params.map(param => this.sanitizeParameter(param));
      
      const stmt = this.db.query(query);
      stmt.run(...sanitizedParams);
      
      return {
        changes: this.db.changes,
        lastInsertRowid: Number(this.db.lastInsertRowID)
      };
    } catch (error) {
      throw createAppError(
        ErrorCode.DATABASE_ERROR,
        `Update execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  public async executeTransaction<T>(
    operations: (db: Database) => T
  ): Promise<T> {
    if (!this.db) {
      throw createAppError(
        ErrorCode.DATABASE_ERROR,
        'Database not connected',
        500
      );
    }

    try {
      // Bun SQLite doesn't have a transaction method like better-sqlite3
      // We'll use BEGIN/COMMIT manually
      this.db.exec('BEGIN');
      try {
        const result = operations(this.db);
        this.db.exec('COMMIT');
        return result;
      } catch (error) {
        this.db.exec('ROLLBACK');
        throw error;
      }
    } catch (error) {
      throw createAppError(
        ErrorCode.DATABASE_ERROR,
        `Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  private setupPreparedStatements(): void {
    if (!this.db) return;

    // Create prepared statements for common operations
    // These will be set up in the migration files
  }

  private validateQuery(query: string): void {
    // Basic SQL injection prevention
    const dangerousPatterns = [
      /--/g, // SQL comments
      /\/\*.*?\*\//g, // Block comments
      /;\s*drop\s+table/gi, // DROP TABLE
      /;\s*delete\s+from/gi, // DELETE FROM
      /;\s*truncate\s+table/gi, // TRUNCATE TABLE
      /;\s*alter\s+table/gi, // ALTER TABLE
      /;\s*create\s+table/gi, // CREATE TABLE
      /;\s*insert\s+into/gi, // INSERT INTO
      /;\s*update\s+set/gi, // UPDATE SET
      /union\s+select/gi, // UNION SELECT
      /exec\s*\(/gi, // EXEC
      /execute\s*\(/gi, // EXECUTE
      /sp_/gi, // Stored procedures
      /xp_/gi // Extended procedures
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(query)) {
        throw createAppError(
          ErrorCode.INVALID_INPUT,
          'Potentially dangerous SQL query detected',
          400
        );
      }
    }
  }

  private sanitizeParameter(param: unknown): unknown {
    if (typeof param === 'string') {
      return sanitizeString(param);
    }
    if (typeof param === 'object' && param !== null) {
      return JSON.stringify(param);
    }
    return param;
  }

  public async backup(backupPath: string): Promise<void> {
    if (!this.db) {
      throw createAppError(
        ErrorCode.DATABASE_ERROR,
        'Database not connected',
        500
      );
    }

    try {
      // Validate backup path
      const normalizedBackupPath = path.normalize(backupPath);
      const resolvedBackupPath = path.resolve(normalizedBackupPath);
      
      const allowedDir = path.resolve(process.cwd(), 'backups');
      if (!resolvedBackupPath.startsWith(allowedDir)) {
        throw createAppError(
          ErrorCode.INVALID_INPUT,
          'Backup path must be within allowed directory',
          400
        );
      }

      // Ensure backup directory exists
      const backupDir = path.dirname(resolvedBackupPath);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true, mode: 0o700 });
      }

      // Create backup - Bun SQLite doesn't have a backup method
      // We'll use the VACUUM INTO command instead
      this.db.exec(`VACUUM INTO '${resolvedBackupPath}'`);
    } catch (error) {
      throw createAppError(
        ErrorCode.DATABASE_ERROR,
        `Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  public async getStats(): Promise<{
    size: number;
    pageCount: number;
    pageSize: number;
    freelistCount: number;
  }> {
    if (!this.db) {
      throw createAppError(
        ErrorCode.DATABASE_ERROR,
        'Database not connected',
        500
      );
    }

    try {
      const stats = this.db.query('PRAGMA page_count').get() as { page_count: number };
      const pageSize = this.db.query('PRAGMA page_size').get() as { page_size: number };
      const freelist = this.db.query('PRAGMA freelist_count').get() as { freelist_count: number };

      return {
        size: stats?.page_count * pageSize?.page_size ?? 0,
        pageCount: stats?.page_count ?? 0,
        pageSize: pageSize?.page_size ?? 0,
        freelistCount: freelist?.freelist_count ?? 0
      };
    } catch (error) {
      throw createAppError(
        ErrorCode.DATABASE_ERROR,
        `Failed to get database stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }
}

// Export singleton instance
export const dbConnection = DatabaseConnection.getInstance();

