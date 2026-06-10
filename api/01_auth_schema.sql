-- 01_auth_schema.sql
-- Database migration to support offline-first role-based access control (RBAC),
-- persistent configuration state, and tamper-evident audit logs.

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('operator', 'engineer', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 2. Create device configs table
CREATE TABLE IF NOT EXISTS device_configs (
    key VARCHAR(50) PRIMARY KEY,
    value VARCHAR(100) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial device configurations if not present
INSERT INTO device_configs (key, value) VALUES
('pm25_threshold', '35.0') ON CONFLICT (key) DO NOTHING;
INSERT INTO device_configs (key, value) VALUES
('spray_duration', '10') ON CONFLICT (key) DO NOTHING;
INSERT INTO device_configs (key, value) VALUES
('operation_mode', 'auto') ON CONFLICT (key) DO NOTHING;

-- 3. Create audit logs table for industrial security compliance
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    username VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for searching audit trail
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
