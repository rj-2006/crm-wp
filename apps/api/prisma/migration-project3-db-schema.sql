BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'crm_consent_status') THEN
    CREATE TYPE crm_consent_status AS ENUM ('unknown', 'opted_in', 'opted_out');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'crm_campaign_status') THEN
    CREATE TYPE crm_campaign_status AS ENUM ('draft', 'scheduled', 'running', 'completed', 'cancelled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'crm_campaign_recipient_status') THEN
    CREATE TYPE crm_campaign_recipient_status AS ENUM ('pending', 'queued', 'sent', 'delivered', 'read', 'failed');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'crm_message_status') THEN
    CREATE TYPE crm_message_status AS ENUM ('pending', 'sent', 'delivered', 'read', 'failed_retryable', 'failed_permanent');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'crm_message_direction') THEN
    CREATE TYPE crm_message_direction AS ENUM ('inbound', 'outbound');
  END IF;
END $$;

ALTER TYPE crm_campaign_recipient_status ADD VALUE IF NOT EXISTS 'read';

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS company_id uuid;

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS company_id uuid;

ALTER TABLE tags
  ADD COLUMN IF NOT EXISTS company_id uuid;

ALTER TABLE follow_ups
  ADD COLUMN IF NOT EXISTS company_id uuid;

ALTER TABLE message_templates
  ADD COLUMN IF NOT EXISTS company_id uuid,
  ADD COLUMN IF NOT EXISTS language text,
  ADD COLUMN IF NOT EXISTS structure_payload jsonb,
  ADD COLUMN IF NOT EXISTS synced_at timestamptz;

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS company_id uuid,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS whatsapp_account_id uuid,
  ADD COLUMN IF NOT EXISTS total_recipients integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sent_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivered_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS read_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS failed_count integer NOT NULL DEFAULT 0;

ALTER TABLE whatsapp_accounts
  ADD COLUMN IF NOT EXISTS company_id uuid,
  ADD COLUMN IF NOT EXISTS owner_user_id uuid,
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS whatsapp_account_id uuid,
  ADD COLUMN IF NOT EXISTS direction crm_message_direction NOT NULL DEFAULT 'outbound',
  ADD COLUMN IF NOT EXISTS from_number text,
  ADD COLUMN IF NOT EXISTS to_number text,
  ADD COLUMN IF NOT EXISTS error_code text,
  ADD COLUMN IF NOT EXISTS error_message text,
  ADD COLUMN IF NOT EXISTS failed_at timestamptz;

ALTER TABLE campaign_recipients
  ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_retry_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS read_at timestamptz,
  ADD COLUMN IF NOT EXISTS failed_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_status_change_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'campaign_recipients'
      AND column_name = 'retry_count'
  ) THEN
    UPDATE campaign_recipients
    SET attempts = COALESCE(retry_count, attempts)
    WHERE attempts = 0;

    ALTER TABLE campaign_recipients
      DROP COLUMN retry_count;
  END IF;
END $$;

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS consent_source text,
  ADD COLUMN IF NOT EXISTS consent_updated_at timestamptz;

ALTER TABLE activity_logs
  ADD COLUMN IF NOT EXISTS company_id uuid;

ALTER TABLE webhook_events
  ADD COLUMN IF NOT EXISTS whatsapp_account_id uuid;

CREATE TABLE IF NOT EXISTS consent_logs (
  consent_log_id uuid PRIMARY KEY,
  company_id uuid,
  contact_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('opt_in', 'opt_out')),
  source text,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  audit_log_id uuid PRIMARY KEY,
  company_id uuid,
  user_id uuid,
  entity_type text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  changes jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT c.conname INTO constraint_name
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = current_schema()
    AND t.relname = 'tags'
    AND c.contype = 'u'
    AND (
      SELECT array_agg(a.attname::text ORDER BY a.attnum)
      FROM unnest(c.conkey) AS key(attnum)
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = key.attnum
    ) = ARRAY['name'];

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE tags DROP CONSTRAINT %I', constraint_name);
  END IF;

  SELECT c.conname INTO constraint_name
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = current_schema()
    AND t.relname = 'contacts'
    AND c.contype = 'u'
    AND (
      SELECT array_agg(a.attname::text ORDER BY a.attnum)
      FROM unnest(c.conkey) AS key(attnum)
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = key.attnum
    ) = ARRAY['phone'];

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE contacts DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE contacts
  ADD CONSTRAINT contacts_company_phone_key UNIQUE (company_id, phone);

ALTER TABLE tags
  ADD CONSTRAINT tags_company_name_key UNIQUE (company_id, name);

ALTER TABLE campaign_recipients
  ADD CONSTRAINT campaign_recipients_campaign_contact_key UNIQUE (campaign_id, contact_id);

ALTER TABLE whatsapp_accounts
  ADD CONSTRAINT whatsapp_accounts_phone_number_id_key UNIQUE (phone_number_id);

ALTER TABLE campaign_recipients
  ADD CONSTRAINT campaign_recipients_attempts_check CHECK (attempts >= 0);

ALTER TABLE campaigns
  ADD CONSTRAINT campaigns_total_recipients_check CHECK (total_recipients >= 0),
  ADD CONSTRAINT campaigns_sent_count_check CHECK (sent_count >= 0),
  ADD CONSTRAINT campaigns_delivered_count_check CHECK (delivered_count >= 0),
  ADD CONSTRAINT campaigns_read_count_check CHECK (read_count >= 0),
  ADD CONSTRAINT campaigns_failed_count_check CHECK (failed_count >= 0);

ALTER TABLE users
  ADD CONSTRAINT users_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(company_id) NOT VALID;

ALTER TABLE leads
  ADD CONSTRAINT leads_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(company_id) NOT VALID;

ALTER TABLE tags
  ADD CONSTRAINT tags_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(company_id) NOT VALID;

ALTER TABLE follow_ups
  ADD CONSTRAINT follow_ups_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(company_id) NOT VALID;

ALTER TABLE activity_logs
  ADD CONSTRAINT activity_logs_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(company_id) NOT VALID;

ALTER TABLE message_templates
  ADD CONSTRAINT message_templates_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(company_id) NOT VALID;

ALTER TABLE campaigns
  ADD CONSTRAINT campaigns_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(company_id) NOT VALID,
  ADD CONSTRAINT campaigns_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(user_id) NOT VALID,
  ADD CONSTRAINT campaigns_whatsapp_account_id_fkey FOREIGN KEY (whatsapp_account_id) REFERENCES whatsapp_accounts(account_id) NOT VALID;

ALTER TABLE whatsapp_accounts
  ADD CONSTRAINT whatsapp_accounts_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(company_id) NOT VALID,
  ADD CONSTRAINT whatsapp_accounts_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES users(user_id) NOT VALID;

ALTER TABLE messages
  ADD CONSTRAINT messages_whatsapp_account_id_fkey FOREIGN KEY (whatsapp_account_id) REFERENCES whatsapp_accounts(account_id) NOT VALID;

ALTER TABLE webhook_events
  ADD CONSTRAINT webhook_events_whatsapp_account_id_fkey FOREIGN KEY (whatsapp_account_id) REFERENCES whatsapp_accounts(account_id) NOT VALID;

ALTER TABLE consent_logs
  ADD CONSTRAINT consent_logs_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(company_id) NOT VALID,
  ADD CONSTRAINT consent_logs_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(contact_id) NOT VALID;

ALTER TABLE audit_logs
  ADD CONSTRAINT audit_logs_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(company_id) NOT VALID,
  ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(user_id) NOT VALID;

-- Join and worker indexes.
CREATE INDEX IF NOT EXISTS users_company_id_idx ON users(company_id);
CREATE INDEX IF NOT EXISTS contacts_company_id_idx ON contacts(company_id);
CREATE INDEX IF NOT EXISTS contacts_company_consent_status_idx ON contacts(company_id, consent_status);
CREATE INDEX IF NOT EXISTS leads_company_id_idx ON leads(company_id);
CREATE INDEX IF NOT EXISTS leads_contact_id_idx ON leads(contact_id);
CREATE INDEX IF NOT EXISTS tags_company_id_idx ON tags(company_id);
CREATE INDEX IF NOT EXISTS follow_ups_company_id_idx ON follow_ups(company_id);
CREATE INDEX IF NOT EXISTS follow_ups_contact_id_idx ON follow_ups(contact_id);
CREATE INDEX IF NOT EXISTS follow_ups_assigned_to_idx ON follow_ups(assigned_to);
CREATE INDEX IF NOT EXISTS activity_logs_company_id_idx ON activity_logs(company_id);
CREATE INDEX IF NOT EXISTS message_templates_company_id_idx ON message_templates(company_id);
CREATE INDEX IF NOT EXISTS campaigns_company_id_idx ON campaigns(company_id);
CREATE INDEX IF NOT EXISTS campaigns_created_by_idx ON campaigns(created_by);
CREATE INDEX IF NOT EXISTS campaigns_whatsapp_account_id_idx ON campaigns(whatsapp_account_id);
CREATE INDEX IF NOT EXISTS campaigns_status_idx ON campaigns(status);
CREATE INDEX IF NOT EXISTS campaign_recipients_campaign_id_idx ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS campaign_recipients_contact_id_idx ON campaign_recipients(contact_id);
CREATE INDEX IF NOT EXISTS campaign_recipients_status_idx ON campaign_recipients(status);
CREATE INDEX IF NOT EXISTS campaign_recipients_next_retry_at_idx ON campaign_recipients(next_retry_at);
CREATE INDEX IF NOT EXISTS messages_contact_id_idx ON messages(contact_id);
CREATE INDEX IF NOT EXISTS messages_campaign_id_idx ON messages(campaign_id);
CREATE INDEX IF NOT EXISTS messages_template_id_idx ON messages(template_id);
CREATE INDEX IF NOT EXISTS messages_whatsapp_account_id_idx ON messages(whatsapp_account_id);
CREATE INDEX IF NOT EXISTS messages_status_idx ON messages(status);
CREATE INDEX IF NOT EXISTS webhook_events_message_id_idx ON webhook_events(message_id);
CREATE INDEX IF NOT EXISTS webhook_events_whatsapp_account_id_idx ON webhook_events(whatsapp_account_id);
CREATE INDEX IF NOT EXISTS whatsapp_accounts_company_id_idx ON whatsapp_accounts(company_id);
CREATE INDEX IF NOT EXISTS whatsapp_accounts_owner_user_id_idx ON whatsapp_accounts(owner_user_id);
CREATE INDEX IF NOT EXISTS consent_logs_company_id_idx ON consent_logs(company_id);
CREATE INDEX IF NOT EXISTS consent_logs_contact_id_idx ON consent_logs(contact_id);
CREATE INDEX IF NOT EXISTS consent_logs_created_at_idx ON consent_logs(created_at);
CREATE INDEX IF NOT EXISTS audit_logs_company_id_idx ON audit_logs(company_id);
CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs(created_at);

COMMIT;
