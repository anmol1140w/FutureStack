-- Version 3 Schema Enhancements: RBAC Governance, Cryptographic Audit Logs & Analytics

-- Role Enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('CREATOR', 'REVIEWER', 'MANAGER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- User Management Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'CREATOR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure content_reviews has approved_content and manager_notes columns
ALTER TABLE content_reviews ADD COLUMN IF NOT EXISTS approved_content TEXT;
ALTER TABLE content_reviews ADD COLUMN IF NOT EXISTS manager_notes TEXT;

-- Cryptographic Audit Trail Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID REFERENCES content_reviews(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'SUBMITTED', 'REVISED', 'APPROVED', 'REJECTED'
    previous_content TEXT,
    updated_content TEXT,
    audit_hash VARCHAR(64) NOT NULL, -- SHA-256 signature
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index on audit_logs for high performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_review_id ON audit_logs(review_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_audit_hash ON audit_logs(audit_hash);

-- Seed Enterprise Users for RBAC demo
INSERT INTO users (id, name, email, role) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Alice Green', 'alice.creator@brandguard.ai', 'CREATOR'),
    ('22222222-2222-2222-2222-222222222222', 'Bob Taylor', 'bob.reviewer@brandguard.ai', 'REVIEWER'),
    ('33333333-3333-3333-3333-333333333333', 'Sarah Vance', 'sarah.manager@brandguard.ai', 'MANAGER')
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
