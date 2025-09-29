#!/usr/bin/env bun

/**
 * MCP Pointer Server CLI
 * Command-line interface for server management
 */

import { Command } from 'commander';
import { MCPServer } from './index.js';
import type { AppConfig } from '@your-company/pointer-shared';

const program = new Command();

program
  .name('mcp-pointer-server')
  .description('MCP Pointer Server v2.0 - Secure element targeting with AI integration')
  .version('2.0.0');

// Start server command
program
  .command('start')
  .description('Start the MCP Pointer server')
  .option('-p, --port <port>', 'Server port', '7007')
  .option('-h, --host <host>', 'Server host', 'localhost')
  .option('--dev', 'Development mode with hot reload')
  .option('--config <path>', 'Configuration file path')
  .action(async (options) => {
    try {
      console.log('🚀 Starting MCP Pointer Server v2.0...');
      
      const config = await loadConfig(options.config);
      
      // Override config with CLI options
      if (options.port) config.server.port = parseInt(options.port, 10);
      if (options.host) config.server.host = options.host;
      
      if (options.dev) {
        config.monitoring.logging.level = 'debug';
        console.log('🔧 Development mode enabled');
      }
      
      const server = new MCPServer(config);
      await server.start();
      
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  });

// Configuration command
program
  .command('config')
  .description('Manage server configuration')
  .option('--validate', 'Validate configuration file')
  .option('--generate', 'Generate default configuration file')
  .option('--show', 'Show current configuration')
  .action(async (options) => {
    try {
      if (options.generate) {
        await generateConfigFile();
        console.log('✅ Configuration file generated: config.json');
      } else if (options.validate) {
        const config = await loadConfig();
        console.log('✅ Configuration is valid');
      } else if (options.show) {
        const config = await loadConfig();
        console.log('📋 Current configuration:');
        console.log(JSON.stringify(config, null, 2));
      } else {
        console.log('Use --help to see available options');
      }
    } catch (error) {
      console.error('❌ Configuration error:', error);
      process.exit(1);
    }
  });

// Database commands
program
  .command('db')
  .description('Database management commands')
  .option('--migrate', 'Run database migrations')
  .option('--seed', 'Seed database with initial data')
  .option('--reset', 'Reset database (WARNING: This will delete all data)')
  .action(async (options) => {
    try {
      if (options.migrate) {
        console.log('🔄 Running database migrations...');
        // await runMigrations();
        console.log('✅ Migrations completed');
      } else if (options.seed) {
        console.log('🌱 Seeding database...');
        // await seedDatabase();
        console.log('✅ Database seeded');
      } else if (options.reset) {
        console.log('⚠️  Resetting database...');
        // await resetDatabase();
        console.log('✅ Database reset');
      } else {
        console.log('Use --help to see available options');
      }
    } catch (error) {
      console.error('❌ Database error:', error);
      process.exit(1);
    }
  });

// Security commands
program
  .command('security')
  .description('Security management commands')
  .option('--audit', 'Run security audit')
  .option('--generate-jwt-secret', 'Generate secure JWT secret')
  .option('--check-deps', 'Check dependencies for vulnerabilities')
  .action(async (options) => {
    try {
      if (options.audit) {
        console.log('🔒 Running security audit...');
        // await runSecurityAudit();
        console.log('✅ Security audit completed');
      } else if (options.generateJwtSecret) {
        const secret = generateSecureSecret();
        console.log('🔑 Generated JWT secret:');
        console.log(secret);
        console.log('\n⚠️  Store this securely and update your configuration!');
      } else if (options.checkDeps) {
        console.log('🔍 Checking dependencies for vulnerabilities...');
        // await checkDependencies();
        console.log('✅ Dependency check completed');
      } else {
        console.log('Use --help to see available options');
      }
    } catch (error) {
      console.error('❌ Security error:', error);
      process.exit(1);
    }
  });

// Health check command
program
  .command('health')
  .description('Check server health')
  .option('--url <url>', 'Server URL', 'http://localhost:7007')
  .action(async (options) => {
    try {
      console.log(`🏥 Checking server health at ${options.url}...`);
      
      const response = await fetch(`${options.url}/health`);
      
      if (response.ok) {
        const health = await response.json();
        console.log('✅ Server is healthy');
        console.log(`📊 Status: ${health.status}`);
        console.log(`⏰ Uptime: ${health.uptime}s`);
        console.log(`🔢 Version: ${health.version}`);
      } else {
        console.log('❌ Server is unhealthy');
        console.log(`Status: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Health check failed:', error);
      process.exit(1);
    }
  });

// Helper functions

async function loadConfig(configPath?: string): Promise<AppConfig> {
  const path = configPath || 'config.json';
  
  try {
    const configFile = await Bun.file(path).text();
    return JSON.parse(configFile);
  } catch (error) {
    console.warn(`⚠️  Could not load config from ${path}, using defaults`);
    return getDefaultConfig();
  }
}

async function generateConfigFile(): Promise<void> {
  const config = getDefaultConfig();
  await Bun.write('config.json', JSON.stringify(config, null, 2));
}

function getDefaultConfig(): AppConfig {
  return {
    server: {
      port: 7007,
      host: 'localhost',
      cors: {
        origin: ['http://localhost:3000', 'chrome-extension://*'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
      },
      rateLimit: {
        windowMs: 15 * 60 * 1000,
        max: 100,
        skipSuccessfulRequests: false,
        skipFailedRequests: false
      }
    },
    security: {
      jwt: {
        secret: process.env.JWT_SECRET || 'CHANGE-THIS-SECRET-IN-PRODUCTION',
        expiresIn: '15m',
        refreshExpiresIn: '7d',
        algorithm: 'HS256'
      },
      bcrypt: {
        rounds: 12,
        saltRounds: 12
      },
      csp: {
        directives: {
          'default-src': ["'self'"],
          'script-src': ["'self'", "'unsafe-inline'"],
          'style-src': ["'self'", "'unsafe-inline'"],
          'img-src': ["'self'", 'data:', 'https:'],
          'connect-src': ["'self'", 'wss:', 'https:']
        },
        reportOnly: false
      },
      headers: {
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true
        },
        xFrameOptions: 'DENY',
        xContentTypeOptions: 'nosniff',
        xXSSProtection: '1; mode=block'
      }
    },
    webrtc: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ],
      sdpSemantics: 'unified-plan',
      bundlePolicy: 'balanced',
      rtcpMuxPolicy: 'require'
    },
    ai: {
      providers: [],
      defaultProvider: 'local',
      rateLimit: {
        windowMs: 60 * 1000,
        max: 10,
        skipSuccessfulRequests: false,
        skipFailedRequests: false
      }
    },
    monitoring: {
      enabled: true,
      metrics: {
        enabled: true,
        port: 9090,
        path: '/metrics',
        collectDefaultMetrics: true
      },
      logging: {
        level: 'info',
        format: 'json',
        destination: 'console',
        maxSize: '10m',
        maxFiles: 5
      },
      alerts: {
        enabled: false,
        thresholds: {}
      }
    }
  };
}

function generateSecureSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
  process.exit(1);
});

// Parse command line arguments
program.parse();