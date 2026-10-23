CREATE EXTENSION IF NOT EXISTS vector;

-- Brand Guidelines Storage
CREATE TABLE IF NOT EXISTS brand_guidelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) CHECK (category IN ('TONE', 'TERMINOLOGY', 'CLAIM', 'LEGAL', 'PRIVACY')),
    content_chunk TEXT NOT NULL,
    embedding vector(1536),
    rule_type VARCHAR(50) CHECK (rule_type IN ('DETERMINISTIC', 'SEMANTIC')),
    pattern_rule TEXT, -- Regex string for DETERMINISTIC rules
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Content Reviews and Audit Log
CREATE TABLE IF NOT EXISTS content_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL DEFAULT gen_random_uuid(),
    raw_content TEXT NOT NULL,
    status VARCHAR(20) CHECK (status IN ('PENDING', 'REVISED', 'APPROVED', 'REJECTED')) DEFAULT 'PENDING',
    findings JSONB NOT NULL DEFAULT '[]'::jsonb,
    audit_hash VARCHAR(64) NOT NULL DEFAULT '',
    reviewer_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
