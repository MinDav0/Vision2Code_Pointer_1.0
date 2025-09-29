-- MCP Pointer Database Schema
-- Security-first design with audit logging and data integrity

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
    element_id TEXT,
    classes TEXT, -- JSON array of classes
    inner_text TEXT,
    attributes TEXT, -- JSON object of attributes
    position_x INTEGER NOT NULL,
    position_y INTEGER NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    css_properties TEXT, -- JSON object of CSS properties
    component_info TEXT, -- JSON object of component information
    url TEXT NOT NULL,
    tab_id INTEGER,
    accessibility_info TEXT, -- JSON object of accessibility information
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT position_positive CHECK (position_x >= 0 AND position_y >= 0),
    CONSTRAINT size_positive CHECK (width > 0 AND height > 0),
    CONSTRAINT url_format CHECK (url LIKE 'http%://%')
);

-- WebRTC connections for real-time communication
CREATE TABLE IF NOT EXISTS webrtc_connections (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    connection_state TEXT NOT NULL CHECK (connection_state IN ('connecting', 'connected', 'disconnected', 'failed', 'closed')),
    ice_servers TEXT, -- JSON array of ICE servers
    sdp_offer TEXT,
    sdp_answer TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    connected_at DATETIME,
    disconnected_at DATETIME,
    error_message TEXT,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- MCP tool executions for AI integration
CREATE TABLE IF NOT EXISTS mcp_tool_executions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    tool_name TEXT NOT NULL,
    input_data TEXT, -- JSON object of input parameters
    output_data TEXT, -- JSON object of output results
    execution_time_ms INTEGER,
    status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    error_message TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME,
    completed_at DATETIME,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT execution_time_positive CHECK (execution_time_ms >= 0)
);

-- Security events for audit logging
CREATE TABLE IF NOT EXISTS security_events (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    session_id TEXT,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'auth_failure', 'rate_limit_exceeded', 'suspicious_activity',
        'invalid_input', 'unauthorized_access', 'data_breach_attempt'
    )),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    message TEXT NOT NULL,
    metadata TEXT, -- JSON object of additional data
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Rate limiting for API protection
CREATE TABLE IF NOT EXISTS rate_limits (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL, -- IP address, user ID, or API key
    endpoint TEXT NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    window_start DATETIME NOT NULL,
    window_end DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT request_count_positive CHECK (request_count > 0),
    CONSTRAINT window_valid CHECK (window_end > window_start)
);

-- Application configuration
CREATE TABLE IF NOT EXISTS app_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    is_encrypted BOOLEAN NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT key_format CHECK (LENGTH(key) BETWEEN 1 AND 100),
    CONSTRAINT value_not_empty CHECK (LENGTH(value) > 0)
);

-- Database migrations tracking
CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    checksum TEXT NOT NULL,
    
    CONSTRAINT version_format CHECK (version LIKE '%.%.%'),
    CONSTRAINT name_not_empty CHECK (LENGTH(name) > 0)
);

-- Indexes for performance and security
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_locked ON users(locked_until);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_revoked ON user_sessions(is_revoked);
CREATE INDEX IF NOT EXISTS idx_sessions_ip_address ON user_sessions(ip_address);

CREATE INDEX IF NOT EXISTS idx_elements_user_id ON elements(user_id);
CREATE INDEX IF NOT EXISTS idx_elements_created_at ON elements(created_at);
CREATE INDEX IF NOT EXISTS idx_elements_url ON elements(url);
CREATE INDEX IF NOT EXISTS idx_elements_selector ON elements(selector);

CREATE INDEX IF NOT EXISTS idx_webrtc_user_id ON webrtc_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_webrtc_state ON webrtc_connections(connection_state);
CREATE INDEX IF NOT EXISTS idx_webrtc_created_at ON webrtc_connections(created_at);

CREATE INDEX IF NOT EXISTS idx_mcp_user_id ON mcp_tool_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_mcp_tool_name ON mcp_tool_executions(tool_name);
CREATE INDEX IF NOT EXISTS idx_mcp_status ON mcp_tool_executions(status);
CREATE INDEX IF NOT EXISTS idx_mcp_created_at ON mcp_tool_executions(created_at);

CREATE INDEX IF NOT EXISTS idx_security_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_event_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_created_at ON security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_security_ip_address ON security_events(ip_address);

CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limits_endpoint ON rate_limits(endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start, window_end);

-- Triggers for automatic timestamp updates
CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
    AFTER UPDATE ON users
    FOR EACH ROW
    BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_sessions_timestamp 
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

-- Views for common queries
CREATE VIEW IF NOT EXISTS active_users AS
    SELECT 
        id,
        email,
        name,
        role,
        created_at,
        last_login_at,
        failed_login_attempts,
        locked_until
    FROM users 
    WHERE is_active = 1;

CREATE VIEW IF NOT EXISTS user_session_summary AS
    SELECT 
        u.id as user_id,
        u.email,
        u.name,
        COUNT(s.id) as active_sessions,
        MAX(s.last_accessed_at) as last_activity
    FROM users u
    LEFT JOIN user_sessions s ON u.id = s.user_id 
        AND s.is_revoked = 0 
        AND s.expires_at > CURRENT_TIMESTAMP
    WHERE u.is_active = 1
    GROUP BY u.id, u.email, u.name;

CREATE VIEW IF NOT EXISTS security_events_summary AS
    SELECT 
        event_type,
        severity,
        COUNT(*) as count,
        DATE(created_at) as date
    FROM security_events
    WHERE created_at >= DATE('now', '-30 days')
    GROUP BY event_type, severity, DATE(created_at)
    ORDER BY date DESC, severity DESC;

-- Insert default configuration
INSERT OR IGNORE INTO app_config (key, value, description) VALUES
    ('app_version', '2.0.0', 'Application version'),
    ('max_login_attempts', '5', 'Maximum failed login attempts before lockout'),
    ('lockout_duration_minutes', '15', 'Account lockout duration in minutes'),
    ('session_timeout_hours', '24', 'Session timeout in hours'),
    ('rate_limit_window_minutes', '15', 'Rate limiting window in minutes'),
    ('rate_limit_max_requests', '100', 'Maximum requests per window'),
    ('backup_retention_days', '30', 'Database backup retention period'),
    ('audit_log_retention_days', '90', 'Audit log retention period');

