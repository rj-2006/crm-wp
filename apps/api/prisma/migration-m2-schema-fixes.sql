-- =============================================================================
-- Migration: M2 Schema Fixes
-- Adds columns/tables required by M2 feature code.
-- Safe to re-run: all statements use IF NOT EXISTS / IF EXISTS guards.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Step 1 — Extend enums  (must run OUTSIDE a transaction block in older PG;
--           PG 16 supports them inside transactions but we run them first for
--           compatibility clarity)
-- ---------------------------------------------------------------------------

ALTER TYPE crm_message_status ADD VALUE IF NOT EXISTS 'queued';
ALTER TYPE crm_message_status ADD VALUE IF NOT EXISTS 'failed';

-- ---------------------------------------------------------------------------
-- Step 2 — Table alterations (all in one transaction for atomicity)
-- ---------------------------------------------------------------------------

BEGIN;

-- contacts: split name → first_name / last_name, add lifecycle + consent fields
ALTER TABLE contacts
  ALTER COLUMN name DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS first_name   text,
  ADD COLUMN IF NOT EXISTS last_name    text,
  ADD COLUMN IF NOT EXISTS email        text,
  ADD COLUMN IF NOT EXISTS status       text,
  ADD COLUMN IF NOT EXISTS source       text,
  ADD COLUMN IF NOT EXISTS custom_fields jsonb,
  ADD COLUMN IF NOT EXISTS created_at   timestamptz NOT NULL DEFAULT now();

-- activity_logs: add structured metadata payload
ALTER TABLE activity_logs
  ADD COLUMN IF NOT EXISTS metadata jsonb;

-- messages: add company scope, rich content fields, per-status timestamps
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS company_id   uuid REFERENCES companies(company_id),
  ADD COLUMN IF NOT EXISTS message_type text,
  ADD COLUMN IF NOT EXISTS body         text,
  ADD COLUMN IF NOT EXISTS payload      jsonb,
  ADD COLUMN IF NOT EXISTS sent_at      timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS read_at      timestamptz,
  ADD COLUMN IF NOT EXISTS created_at   timestamptz NOT NULL DEFAULT now();

-- tags: visual grouping color
ALTER TABLE tags
  ADD COLUMN IF NOT EXISTS color text;

-- whatsapp_accounts: raw access token (TODO M6: vault this) + audit timestamp
ALTER TABLE whatsapp_accounts
  ADD COLUMN IF NOT EXISTS access_token text,
  ADD COLUMN IF NOT EXISTS created_at   timestamptz NOT NULL DEFAULT now();

-- webhook_events: company scope, processing flag; relax dedupe_key NOT NULL
-- (webhook handler will set it when a stable ID is available from Meta)
ALTER TABLE webhook_events
  ALTER COLUMN dedupe_key DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(company_id),
  ADD COLUMN IF NOT EXISTS processed  boolean NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------------
-- Step 3 — New table: refresh_tokens
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS refresh_tokens (
  refresh_token_id uuid        PRIMARY KEY,
  user_id          uuid        NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  token_hash       text        NOT NULL,
  expires_at       timestamptz NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Step 4 — New indexes
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS refresh_tokens_user_id_idx
  ON refresh_tokens(user_id);

CREATE INDEX IF NOT EXISTS messages_company_id_idx
  ON messages(company_id);

CREATE INDEX IF NOT EXISTS webhook_events_company_id_idx
  ON webhook_events(company_id);

-- Partial index for email lookups (most contacts will have an email)
CREATE INDEX IF NOT EXISTS contacts_company_email_idx
  ON contacts(company_id, email)
  WHERE email IS NOT NULL;

COMMIT;
