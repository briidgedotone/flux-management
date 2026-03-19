-- Migration: 006_extend_user_roles
-- Description: Add co-ceo to user role constraint for management portal
-- Date: 2026-03-20
-- Reference: docs/backend-plan.md §4 (Migration: 006_extend_user_roles.sql)

BEGIN;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('client', 'employee', 'director', 'admin', 'co-ceo'));

COMMIT;
