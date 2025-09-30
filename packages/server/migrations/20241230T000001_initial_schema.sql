-- Initial Database Schema Migration
-- Version: 20241230_000001
-- Description: Create initial database schema with all tables

-- UP Migration
-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Set secure defaults
PRAGMA journal_mode = WAL;
PRAGMA synchronous = FULL;
PRAGMA secure_delete = ON;

-- Users table with secure authentication
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'developer', 'viewer', 'guest')),
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at DATETIME,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until DATETIME,
    
    -- Security constraints
    CONSTRAINT email_format CHECK (email LIKE '%@%.%'),
    CONSTRAINT name_length CHECK (LENGTH(name) BETWEEN 1 AND 100),
    CONSTRAINT password_hash_length CHECK (LENGTH(password_hash) >= 60)
);

-- User sessions for secure session management
CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    access_token_hash TEXT NOT NULL,
    refresh_token_hash TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT,
    is_revoked BOOLEAN NOT NULL DEFAULT 0,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT session_expiry CHECK (expires_at > created_at)
);

-- Element data for tracking selected elements
CREATE TABLE IF NOT EXISTS elements (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    selector TEXT NOT NULL,
    tag_name TEXT NOT NULL,
    text_content TEXT,
    url TEXT NOT NULL,
    position_x INTEGER,
    position_y INTEGER,
    width INTEGER,
    height INTEGER,
    css_properties TEXT, -- JSON string
    attributes TEXT, -- JSON string
    component_name TEXT,
    component_source TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT selector_length CHECK (LENGTH(selector) BETWEEN 1 AND 1000),
    CONSTRAINT url_format CHECK (url LIKE 'http%://%')
);

-- WebRTC connections tracking
CREATE TABLE IF NOT EXISTS webrtc_connections (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    connection_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('connecting', 'connected', 'disconnected', 'failed')),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    connected_at DATETIME,
    disconnected_at DATETIME,
    last_heartbeat DATETIME,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- MCP tool executions for audit logging
CREATE TABLE IF NOT EXISTS mcp_tool_executions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    tool_name TEXT NOT NULL,
    input_data TEXT, -- JSON string
    output_data TEXT, -- JSON string
    execution_time_ms INTEGER,
    status TEXT NOT NULL CHECK (status IN ('success', 'error', 'timeout')),
    error_message TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Security events for comprehensive audit logging
CREATE TABLE IF NOT EXISTS security_events (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    event_type TEXT NOT NULL,
    event_data TEXT, -- JSON string
    ip_address TEXT,
    user_agent TEXT,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Rate limiting tracking
CREATE TABLE IF NOT EXISTS rate_limits (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL, -- IP address or user ID
    endpoint TEXT NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    window_start DATETIME NOT NULL,
    window_end DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(identifier, endpoint, window_start)
);

-- Application configuration
CREATE TABLE IF NOT EXISTS app_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    is_encrypted BOOLEAN NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Migration tracking table
CREATE TABLE IF NOT EXISTS migrations (
    version TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    checksum TEXT NOT NULL,
    applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    execution_time_ms INTEGER,
    
    CONSTRAINT version_format CHECK (version LIKE '%T%' OR version LIKE '%.%.%'),
    CONSTRAINT name_not_empty CHECK (LENGTH(name) > 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_revoked ON user_sessions(is_revoked);

CREATE INDEX IF NOT EXISTS idx_elements_user_id ON elements(user_id);
CREATE INDEX IF NOT EXISTS idx_elements_url ON elements(url);
CREATE INDEX IF NOT EXISTS idx_elements_created_at ON elements(created_at);

CREATE INDEX IF NOT EXISTS idx_webrtc_connections_user_id ON webrtc_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_webrtc_connections_status ON webrtc_connections(status);

CREATE INDEX IF NOT EXISTS idx_mcp_tool_executions_user_id ON mcp_tool_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_mcp_tool_executions_tool_name ON mcp_tool_executions(tool_name);
CREATE INDEX IF NOT EXISTS idx_mcp_tool_executions_created_at ON mcp_tool_executions(created_at);

CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);

CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limits_endpoint ON rate_limits(endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start, window_end);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
    AFTER UPDATE ON users
    FOR EACH ROW
    BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_user_sessions_timestamp 
    AFTER UPDATE ON user_sessions
    FOR EACH ROW
    BEGIN
        UPDATE user_sessions SET last_accessed_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_rate_limits_timestamp 
    AFTER UPDATE ON rate_limits
    FOR EACH ROW
    BEGIN
        UPDATE rate_limits SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_app_config_timestamp 
    AFTER UPDATE ON app_config
    FOR EACH ROW
    BEGIN
        UPDATE app_config SET updated_at = CURRENT_TIMESTAMP WHERE key = NEW.key;
    END;

-- DOWN Migration
-- Drop all tables and triggers
DROP TRIGGER IF EXISTS update_app_config_timestamp;
DROP TRIGGER IF EXISTS update_rate_limits_timestamp;
DROP TRIGGER IF EXISTS update_user_sessions_timestamp;
DROP TRIGGER IF EXISTS update_users_timestamp;

DROP TABLE IF EXISTS migrations;
DROP TABLE IF EXISTS app_config;
DROP TABLE IF EXISTS rate_limits;
DROP TABLE IF EXISTS security_events;
DROP TABLE IF EXISTS mcp_tool_executions;
DROP TABLE IF EXISTS webrtc_connections;
DROP TABLE IF EXISTS elements;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS users;
