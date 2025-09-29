/**
 * Database Seeding System
 * Secure data seeding with validation and rollback support
 */

import bcrypt from 'bcryptjs';
import { DatabaseConnection } from './connection.js';
import type { User, UserRole, Permission } from '@mcp-pointer/shared';
import { createAppError, ErrorCode, generateUUID } from '@mcp-pointer/shared';

export interface SeedData {
  users: Array<{
    email: string;
    name: string;
    password: string;
    role: UserRole;
  }>;
  config: Array<{
    key: string;
    value: string;
    description: string;
    is_encrypted: boolean;
  }>;
}

export class DatabaseSeeder {
  private db: DatabaseConnection;

  constructor(db: DatabaseConnection) {
    this.db = db;
  }

  public async seed(seedData?: SeedData): Promise<void> {
    try {
      console.log('🌱 Starting database seeding...');

      const defaultSeedData = this.getDefaultSeedData();
      const data = seedData ?? defaultSeedData;

      // Seed in transaction
      await this.db.executeTransaction(async (db) => {
        await this.seedUsers(db, data.users);
        await this.seedConfig(db, data.config);
      });

      console.log('✅ Database seeding completed successfully');
    } catch (error) {
      throw createAppError(
        ErrorCode.DATABASE_ERROR,
        `Database seeding failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  public async clear(): Promise<void> {
    try {
      console.log('🧹 Clearing database...');

      await this.db.executeTransaction(async (db) => {
        // Clear tables in reverse dependency order
        db.exec('DELETE FROM security_events');
        db.exec('DELETE FROM rate_limits');
        db.exec('DELETE FROM mcp_tool_executions');
        db.exec('DELETE FROM webrtc_connections');
        db.exec('DELETE FROM elements');
        db.exec('DELETE FROM user_sessions');
        db.exec('DELETE FROM users');
        db.exec('DELETE FROM app_config WHERE key NOT LIKE "app_%"');
      });

      console.log('✅ Database cleared successfully');
    } catch (error) {
      throw createAppError(
        ErrorCode.DATABASE_ERROR,
        `Database clearing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  public async reset(): Promise<void> {
    try {
      console.log('🔄 Resetting database...');
      await this.clear();
      await this.seed();
      console.log('✅ Database reset completed successfully');
    } catch (error) {
      throw createAppError(
        ErrorCode.DATABASE_ERROR,
        `Database reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  private async seedUsers(db: any, users: SeedData['users']): Promise<void> {
    console.log('👥 Seeding users...');

    for (const userData of users) {
      // Check if user already exists
      const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(userData.email);
      if (existingUser) {
        console.log(`⚠️  User ${userData.email} already exists, skipping`);
        continue;
      }

      // Hash password securely
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(userData.password, saltRounds);

      // Insert user
      const userId = generateUUID();
      const insertUserSQL = `
        INSERT INTO users (id, email, name, password_hash, role, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
      `;

      db.prepare(insertUserSQL).run(
        userId,
        userData.email,
        userData.name,
        passwordHash,
        userData.role
      );

      console.log(`✅ Created user: ${userData.email} (${userData.role})`);
    }
  }

  private async seedConfig(db: any, config: SeedData['config']): Promise<void> {
    console.log('⚙️  Seeding configuration...');

    for (const configItem of config) {
      // Check if config already exists
      const existingConfig = db.prepare('SELECT key FROM app_config WHERE key = ?').get(configItem.key);
      if (existingConfig) {
        console.log(`⚠️  Config ${configItem.key} already exists, skipping`);
        continue;
      }

      // Insert config
      const insertConfigSQL = `
        INSERT INTO app_config (key, value, description, is_encrypted)
        VALUES (?, ?, ?, ?)
      `;

      db.prepare(insertConfigSQL).run(
        configItem.key,
        configItem.value,
        configItem.description,
        configItem.is_encrypted ? 1 : 0
      );

      console.log(`✅ Created config: ${configItem.key}`);
    }
  }

  private getDefaultSeedData(): SeedData {
    return {
      users: [
        {
          email: 'admin@mcp-pointer.local',
          name: 'System Administrator',
          password: 'Admin123!@#',
          role: 'admin' as UserRole
        },
        {
          email: 'developer@mcp-pointer.local',
          name: 'Developer User',
          password: 'Dev123!@#',
          role: 'developer' as UserRole
        },
        {
          email: 'viewer@mcp-pointer.local',
          name: 'Viewer User',
          password: 'View123!@#',
          role: 'viewer' as UserRole
        }
      ],
      config: [
        {
          key: 'app_name',
          value: 'MCP Pointer',
          description: 'Application name',
          is_encrypted: false
        },
        {
          key: 'app_description',
          value: 'Secure MCP Pointer with AI integration',
          description: 'Application description',
          is_encrypted: false
        },
        {
          key: 'default_theme',
          value: 'dark',
          description: 'Default UI theme',
          is_encrypted: false
        },
        {
          key: 'max_elements_per_user',
          value: '1000',
          description: 'Maximum elements a user can store',
          is_encrypted: false
        },
        {
          key: 'element_retention_days',
          value: '30',
          description: 'How long to keep element data',
          is_encrypted: false
        },
        {
          key: 'webrtc_enabled',
          value: 'true',
          description: 'Enable WebRTC communication',
          is_encrypted: false
        },
        {
          key: 'mcp_enabled',
          value: 'true',
          description: 'Enable MCP protocol',
          is_encrypted: false
        },
        {
          key: 'ai_integration_enabled',
          value: 'true',
          description: 'Enable AI integration features',
          is_encrypted: false
        },
        {
          key: 'security_scanning_enabled',
          value: 'true',
          description: 'Enable security scanning',
          is_encrypted: false
        },
        {
          key: 'audit_logging_enabled',
          value: 'true',
          description: 'Enable audit logging',
          is_encrypted: false
        }
      ]
    };
  }

  public async createTestUser(
    email: string,
    name: string,
    password: string,
    role: UserRole = 'viewer'
  ): Promise<string> {
    try {
      // Check if user already exists
      const existingUser = await this.db.executeQuery<{ id: string }>(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (existingUser.length > 0) {
        return existingUser[0]!.id;
      }

      // Hash password securely
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Insert user
      const userId = generateUUID();
      const insertUserSQL = `
        INSERT INTO users (id, email, name, password_hash, role, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
      `;

      await this.db.executeUpdate(insertUserSQL, [
        userId,
        email,
        name,
        passwordHash,
        role
      ]);

      console.log(`✅ Created test user: ${email} (${role})`);
      return userId;
    } catch (error) {
      throw createAppError(
        ErrorCode.DATABASE_ERROR,
        `Failed to create test user: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  public async createTestElement(
    userId: string,
    selector: string,
    url: string = 'https://example.com'
  ): Promise<string> {
    try {
      const elementId = generateUUID();
      const insertElementSQL = `
        INSERT INTO elements (
          id, user_id, selector, tag_name, element_id, classes, inner_text,
          attributes, position_x, position_y, width, height, css_properties,
          component_info, url, tab_id, accessibility_info
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await this.db.executeUpdate(insertElementSQL, [
        elementId,
        userId,
        selector,
        'div',
        'test-element',
        JSON.stringify(['test-class']),
        'Test Element',
        JSON.stringify({ 'data-test': 'true' }),
        100,
        200,
        300,
        400,
        JSON.stringify({ display: 'block', color: 'red' }),
        JSON.stringify({ name: 'TestComponent', framework: 'react' }),
        url,
        1,
        JSON.stringify({ role: 'button', isFocusable: true, isVisible: true })
      ]);

      console.log(`✅ Created test element: ${selector}`);
      return elementId;
    } catch (error) {
      throw createAppError(
        ErrorCode.DATABASE_ERROR,
        `Failed to create test element: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }
}

// Export seeder instance
export const dbSeeder = new DatabaseSeeder(DatabaseConnection.getInstance());

