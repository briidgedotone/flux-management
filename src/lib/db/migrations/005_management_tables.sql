-- Migration: 005_management_tables
-- Description: Create 7 management-specific tables
-- Date: 2026-03-20
-- Reference: docs/backend-plan.md §4 (Database Schema — New Tables)
--
-- IMPORTANT: This migration must be idempotent.
-- Use CREATE TABLE IF NOT EXISTS and CREATE INDEX IF NOT EXISTS.

BEGIN;

-- ============================================================
-- 1. client_profiles — Business data about each client org
-- ============================================================
CREATE TABLE IF NOT EXISTS client_profiles (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id       UUID NOT NULL UNIQUE REFERENCES organizations(id),
    industry              TEXT,
    monthly_revenue       NUMERIC(10,2),
    contract_status       TEXT CHECK (contract_status IN ('active', 'expiring', 'expired')),
    contract_start_date   DATE,
    contract_end_date     DATE,
    health_score          TEXT CHECK (health_score IN ('healthy', 'at-risk', 'critical')),
    sla_target            INTEGER DEFAULT 95 CHECK (sla_target BETWEEN 0 AND 100),
    primary_contact_name  TEXT,
    primary_contact_email TEXT,
    primary_contact_phone TEXT,
    notes                 TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_profiles_org ON client_profiles(organization_id);

-- ============================================================
-- 2. team_members — Management-specific team data extending users
-- ============================================================
CREATE TABLE IF NOT EXISTS team_members (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID NOT NULL UNIQUE REFERENCES users(id),
    capacity_hours_week   INTEGER DEFAULT 40,
    utilization_target    INTEGER DEFAULT 80 CHECK (utilization_target BETWEEN 0 AND 100),
    status                TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'inactive')),
    department            TEXT,
    hire_date             DATE,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);

-- ============================================================
-- 3. internal_notes — Management-only notes on tickets
-- ============================================================
CREATE TABLE IF NOT EXISTS internal_notes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id       UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    author_id       UUID NOT NULL REFERENCES users(id),
    content         TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_internal_notes_ticket ON internal_notes(ticket_id);
CREATE INDEX IF NOT EXISTS idx_internal_notes_author ON internal_notes(author_id);

-- ============================================================
-- 4. activity_log — Audit trail of management actions
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    action          TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
    entity_type     TEXT NOT NULL CHECK (entity_type IN ('ticket', 'project', 'client', 'document', 'note', 'task', 'team_member', 'contact_submission')),
    entity_id       UUID,
    organization_id UUID REFERENCES organizations(id),
    description     TEXT,
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_org ON activity_log(organization_id, created_at DESC);

-- ============================================================
-- 5. report_snapshots — Pre-computed report data for trends
-- ============================================================
CREATE TABLE IF NOT EXISTS report_snapshots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_type     TEXT NOT NULL CHECK (report_type IN ('revenue', 'team_performance', 'sla', 'ticket_analytics')),
    period          TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly')),
    period_date     DATE NOT NULL,
    data            JSONB NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(report_type, period, period_date)
);

CREATE INDEX IF NOT EXISTS idx_report_snapshots_type ON report_snapshots(report_type, period_date DESC);

-- ============================================================
-- 6. contact_form_submissions — Website contact form entries
-- ============================================================
CREATE TABLE IF NOT EXISTS contact_form_submissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    email           TEXT NOT NULL,
    company         TEXT,
    phone           TEXT,
    service_interest TEXT,
    message         TEXT,
    status          TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'responded')),
    reviewed_by     UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_form_submissions(status, created_at DESC);

-- ============================================================
-- 7. management_notifications — Notifications for management users
-- ============================================================
CREATE TABLE IF NOT EXISTS management_notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    type            TEXT NOT NULL CHECK (type IN ('task_assignment', 'ticket_escalation', 'contact_form', 'health_alert', 'team_update', 'system')),
    title           TEXT NOT NULL,
    description     TEXT,
    link            TEXT,
    is_read         BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mgmt_notifications_user ON management_notifications(user_id, is_read, created_at DESC);

COMMIT;
