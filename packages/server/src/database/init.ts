/**
 * Database Initialization
 * Secure database setup with migrations and seeding
 */

import fs from 'fs';
import path from 'path';
import { DatabaseConnection } from './connection.js';
import { MigrationManager } from './migrate.js';
import { DatabaseSeeder } from './seed.js';
import type { AppError } from '@mcp-pointer/shared';
import { createAppError, ErrorCode } from '@mcp-pointer/shared';

export class DatabaseInitializer {
  private db: DatabaseConnection;
  private migrationManager: MigrationManager;
  private seeder: DatabaseSeeder;

  constructor() {
    this.db = DatabaseConnection.getInstance();
    this.migrationManager = new MigrationManager(this.db);
    this.seeder = new DatabaseSeeder(this.db);
  }

  public async initialize(options: {
    runMigrations?: boolean;
    seedData?: boolean;
    resetDatabase?: boolean;
  } = {}): Promise<void> {
    const {
      runMigrations = true,
      seedData = true,
      resetDatabase = false
    } = options;

    try {
      console.log('🚀 Initializing database...');

      // Connect to database
      await this.db.connect();
      console.log('✅ Database connected');

      // Reset database if requested
      if (resetDatabase) {
        console.log('🔄 Resetting database...');
        await this.seeder.reset();
        console.log('✅ Database reset completed');
        return;
      }

      // Run migrations
      if (runMigrations) {
        console.log('🔄 Running database migrations...');
        await this.migrationManager.migrate();
        console.log('✅ Migrations completed');
      }

      // Seed initial data
      if (seedData) {
        console.log('🌱 Seeding initial data...');
        await this.seeder.seed();
        console.log('✅ Data seeding completed');
      }

      // Verify database integrity
      await this.verifyDatabaseIntegrity();

      console.log('✅ Database initialization completed successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw createAppError(
        ErrorCode.DATABASE_ERROR,
        `Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  public async createSchema(): Promise<void> {
    try {
      console.log('📋 Creating database schema...');

      // Read schema file
      const schemaPath = path.join(__dirname, 'schema.sql');
      if (!fs.existsSync(schemaPath)) {
        throw createAppError(
          ErrorCode.DATABASE_ERROR,
          'Schema file not found',
          500
        );
      }

      const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

      // Execute schema
      await this.db.executeTransaction(async (db) => {
        // Split SQL statements and execute them
        const statements = schemaSQL
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        for (const statement of statements) {
          if (statement.trim()) {
            db.exec(statement);
          }
        }
      });

      console.log('✅ Database schema created successfully');
    } catch (error) {
      throw createAppError(
        ErrorCode.DATABASE_ERROR,
        `Failed to create schema: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  public async backup(backupPath?: string): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const defaultBackupPath = path.join(process.cwd(), 'backups', `mcp-pointer-${timestamp}.db`);
      const finalBackupPath = backupPath ?? defaultBackupPath;

      console.log(`💾 Creating database backup: ${finalBackupPath}`);
      await this.db.backup(finalBackupPath);
      console.log('✅ Database backup created successfully');

      return finalBackupPath;
    } catch (error) {
      throw createAppError(
        ErrorCode.DATABASE_ERROR,
        `Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  public async getStatus(): Promise<{
    connected: boolean;
    stats: {
      size: number;
      pageCount: number;
      pageSize: number;
      freelistCount: number;
    };
    migrations: {
      applied: number;
      pending: number;
      total: number;
    };
  }> {
    try {
      const connected = this.db.getDatabase() !== null;
      const stats = await this.db.getStats();
      const migrationStatus = await this.migrationManager.getStatus();

      return {
        connected,
        stats,
        migrations: {
          applied: migrationStatus.applied.length,
          pending: migrationStatus.pending.length,
          total: migrationStatus.total
        }
      };
    } catch (error) {
      throw createAppError(
        ErrorCode.DATABASE_ERROR,
        `Failed to get database status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  public async healthCheck(): Promise<{
    healthy: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      // Check database connection
      if (!this.db.getDatabase()) {
        issues.push('Database not connected');
      }

      // Check database integrity
      const integrityResult = await this.db.executeQuery<{ integrity_check: string }>('PRAGMA integrity_check');
      if (integrityResult.length > 0 && integrityResult[0]?.integrity_check !== 'ok') {
        issues.push(`Database integrity check failed: ${integrityResult[0]?.integrity_check}`);
      }

      // Check required tables exist
      const tables = await this.db.executeQuery<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      );

      const requiredTables = [
        'users', 'user_sessions', 'elements', 'webrtc_connections',
        'mcp_tool_executions', 'security_events', 'rate_limits',
        'app_config', 'migrations'
      ];

      for (const table of requiredTables) {
        if (!tables.some(t => t.name === table)) {
          issues.push(`Required table '${table}' is missing`);
        }
      }

      // Check migration status
      const migrationStatus = await this.migrationManager.getStatus();
      if (migrationStatus.pending.length > 0) {
        issues.push(`${migrationStatus.pending.length} pending migrations`);
      }

      return {
        healthy: issues.length === 0,
        issues
      };
    } catch (error) {
      issues.push(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        healthy: false,
        issues
      };
    }
  }

  private async verifyDatabaseIntegrity(): Promise<void> {
    try {
      // Run integrity check
      const integrityResult = await this.db.executeQuery<{ integrity_check: string }>('PRAGMA integrity_check');
      
      if (integrityResult.length === 0 || integrityResult[0]?.integrity_check !== 'ok') {
        throw createAppError(
          ErrorCode.DATABASE_ERROR,
          `Database integrity check failed: ${integrityResult[0]?.integrity_check ?? 'Unknown error'}`,
          500
        );
      }

      // Check foreign key constraints
      const fkResult = await this.db.executeQuery<{ foreign_key_check: number }>('PRAGMA foreign_key_check');
      
      if (fkResult.length > 0 && fkResult[0]?.foreign_key_check !== 0) {
        throw createAppError(
          ErrorCode.DATABASE_ERROR,
          'Foreign key constraint violations detected',
          500
        );
      }

      console.log('✅ Database integrity verified');
    } catch (error) {
      throw createAppError(
        ErrorCode.DATABASE_ERROR,
        `Database integrity verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  public async close(): Promise<void> {
    try {
      await this.db.disconnect();
      console.log('✅ Database connection closed');
    } catch (error) {
      throw createAppError(
        ErrorCode.DATABASE_ERROR,
        `Failed to close database connection: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }
}

// Export database initializer instance
export const dbInitializer = new DatabaseInitializer();

