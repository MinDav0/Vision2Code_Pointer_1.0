/**
 * Database Migration System
 * Secure, versioned database migrations with rollback support
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DatabaseConnection } from './connection.js';
import type { AppError } from '@mcp-pointer/shared';
import { createAppError, ErrorCode } from '@mcp-pointer/shared';

export interface Migration {
  version: string;
  name: string;
  up: string;
  down: string;
  checksum: string;
}

export class MigrationManager {
  private db: DatabaseConnection;
  private migrationsDir: string;

  constructor(db: DatabaseConnection, migrationsDir?: string) {
    this.db = db;
    this.migrationsDir = migrationsDir ?? path.join(process.cwd(), 'migrations');
  }

  public async initialize(): Promise<void> {
    try {
      // Ensure migrations directory exists
      if (!fs.existsSync(this.migrationsDir)) {
        fs.mkdirSync(this.migrationsDir, { recursive: true, mode: 0o700 });
      }

      // Create migrations table if it doesn't exist
      await this.createMigrationsTable();
    } catch (error) {
      throw createAppError(
        ErrorCode.DATABASE_ERROR,
        `Failed to initialize migration system: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  public async migrate(): Promise<void> {
    try {
      await this.initialize();
      
      const appliedMigrations = await this.getAppliedMigrations();
      const availableMigrations = await this.getAvailableMigrations();
      
      // Filter out already applied migrations
      const pendingMigrations = availableMigrations.filter(
        migration => !appliedMigrations.some(applied => applied.version === migration.version)
      );

      if (pendingMigrations.length === 0) {
        console.log('✅ No pending migrations');
        return;
      }

      console.log(`🔄 Applying ${pendingMigrations.length} pending migrations...`);

      for (const migration of pendingMigrations) {
        await this.applyMigration(migration);
      }

      console.log('✅ All migrations applied successfully');
    } catch (error) {
      throw createAppError(
        ErrorCode.DATABASE_ERROR,
        `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  public async rollback(targetVersion?: string): Promise<void> {
    try {
      await this.initialize();
      
      const appliedMigrations = await this.getAppliedMigrations();
      
      if (appliedMigrations.length === 0) {
        console.log('✅ No migrations to rollback');
        return;
      }

      let migrationsToRollback = appliedMigrations;
      
      if (targetVersion) {
        const targetIndex = appliedMigrations.findIndex(m => m.version === targetVersion);
        if (targetIndex === -1) {
          throw createAppError(
            ErrorCode.INVALID_INPUT,
            `Target version ${targetVersion} not found in applied migrations`,
            400
          );
        }
        migrationsToRollback = appliedMigrations.slice(0, targetIndex + 1);
      }

      console.log(`🔄 Rolling back ${migrationsToRollback.length} migrations...`);

      // Rollback in reverse order
      for (const migration of migrationsToRollback.reverse()) {
        await this.rollbackMigration(migration);
      }

      console.log('✅ Rollback completed successfully');
    } catch (error) {
      throw createAppError(
        ErrorCode.DATABASE_ERROR,
        `Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  public async createMigration(name: string): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
      const version = `${timestamp}`;
      const fileName = `${version}_${name.replace(/[^a-zA-Z0-9_]/g, '_')}.sql`;
      const filePath = path.join(this.migrationsDir, fileName);

      const template = `-- Migration: ${name}
-- Version: ${version}
-- Created: ${new Date().toISOString()}

-- UP Migration
-- Add your migration SQL here
-- Example:
-- CREATE TABLE example_table (
--     id TEXT PRIMARY KEY,
--     name TEXT NOT NULL,
--     created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
-- );

-- DOWN Migration (Rollback)
-- Add your rollback SQL here
-- Example:
-- DROP TABLE IF EXISTS example_table;
`;

      fs.writeFileSync(filePath, template, { mode: 0o600 });
      
      console.log(`✅ Created migration: ${fileName}`);
      return filePath;
    } catch (error) {
      throw createAppError(
        ErrorCode.DATABASE_ERROR,
        `Failed to create migration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  public async getStatus(): Promise<{
    applied: Migration[];
    pending: Migration[];
    total: number;
  }> {
    try {
      await this.initialize();
      
      const appliedMigrations = await this.getAppliedMigrations();
      const availableMigrations = await this.getAvailableMigrations();
      
      const pendingMigrations = availableMigrations.filter(
        migration => !appliedMigrations.some(applied => applied.version === migration.version)
      );

      return {
        applied: appliedMigrations,
        pending: pendingMigrations,
        total: availableMigrations.length
      };
    } catch (error) {
      throw createAppError(
        ErrorCode.DATABASE_ERROR,
        `Failed to get migration status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  private async createMigrationsTable(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        checksum TEXT NOT NULL,
        
        CONSTRAINT version_format CHECK (version LIKE '%.%.%'),
        CONSTRAINT name_not_empty CHECK (LENGTH(name) > 0)
      );
    `;

    await this.db.executeUpdate(createTableSQL);
  }

  private async getAppliedMigrations(): Promise<Migration[]> {
    const result = await this.db.executeQuery<{
      version: string;
      name: string;
      applied_at: string;
      checksum: string;
    }>('SELECT version, name, applied_at, checksum FROM migrations ORDER BY applied_at');

    return result.map(row => ({
      version: row.version,
      name: row.name,
      up: '', // Not needed for applied migrations
      down: '', // Not needed for applied migrations
      checksum: row.checksum
    }));
  }

  private async getAvailableMigrations(): Promise<Migration[]> {
    const migrationFiles = fs.readdirSync(this.migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    const migrations: Migration[] = [];

    for (const file of migrationFiles) {
      const filePath = path.join(this.migrationsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      const migration = this.parseMigrationFile(file, content);
      if (migration) {
        migrations.push(migration);
      }
    }

    return migrations;
  }

  private parseMigrationFile(fileName: string, content: string): Migration | null {
    try {
      // Extract version and name from filename
      const match = fileName.match(/^(\d{8}T\d{6})_(.+)\.sql$/);
      if (!match) {
        console.warn(`⚠️  Invalid migration filename: ${fileName}`);
        return null;
      }

      const version = match[1];
      const name = match[2].replace(/_/g, ' ');

      // Parse migration content
      const upMatch = content.match(/-- UP Migration\s*\n(.*?)(?=\n-- DOWN Migration|\n-- |$)/s);
      const downMatch = content.match(/-- DOWN Migration.*?\n(.*?)(?=\n-- |$)/s);

      const up = upMatch ? upMatch[1].trim() : '';
      const down = downMatch ? downMatch[1].trim() : '';

      // Calculate checksum
      const checksum = crypto.createHash('sha256').update(content).digest('hex');

      return {
        version,
        name,
        up,
        down,
        checksum
      };
    } catch (error) {
      console.warn(`⚠️  Failed to parse migration file ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  private async applyMigration(migration: Migration): Promise<void> {
    try {
      console.log(`🔄 Applying migration: ${migration.version} - ${migration.name}`);

      if (!migration.up.trim()) {
        console.warn(`⚠️  Migration ${migration.version} has no UP SQL, skipping`);
        return;
      }

      // Execute migration in transaction
      await this.db.executeTransaction(async (db) => {
        // Split SQL statements and execute them
        const statements = migration.up
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0);

        for (const statement of statements) {
          if (statement.trim()) {
            db.exec(statement);
          }
        }

        // Record migration as applied
        const insertSQL = `
          INSERT INTO migrations (version, name, checksum)
          VALUES (?, ?, ?)
        `;
        
        db.prepare(insertSQL).run(migration.version, migration.name, migration.checksum);
      });

      console.log(`✅ Applied migration: ${migration.version} - ${migration.name}`);
    } catch (error) {
      throw createAppError(
        ErrorCode.DATABASE_ERROR,
        `Failed to apply migration ${migration.version}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  private async rollbackMigration(migration: Migration): Promise<void> {
    try {
      console.log(`🔄 Rolling back migration: ${migration.version} - ${migration.name}`);

      if (!migration.down.trim()) {
        console.warn(`⚠️  Migration ${migration.version} has no DOWN SQL, skipping rollback`);
        return;
      }

      // Execute rollback in transaction
      await this.db.executeTransaction(async (db) => {
        // Split SQL statements and execute them
        const statements = migration.down
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0);

        for (const statement of statements) {
          if (statement.trim()) {
            db.exec(statement);
          }
        }

        // Remove migration record
        const deleteSQL = 'DELETE FROM migrations WHERE version = ?';
        db.prepare(deleteSQL).run(migration.version);
      });

      console.log(`✅ Rolled back migration: ${migration.version} - ${migration.name}`);
    } catch (error) {
      throw createAppError(
        ErrorCode.DATABASE_ERROR,
        `Failed to rollback migration ${migration.version}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }
}

// Export migration manager instance
export const migrationManager = new MigrationManager(DatabaseConnection.getInstance());

