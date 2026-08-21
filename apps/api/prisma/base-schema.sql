BEGIN;


-- ---------- Enums ----------
CREATE TYPE crm_user_role AS ENUM ('staff', 'admin');

CREATE TYPE crm_consent_status AS ENUM ('unknown', 'opted_in', 'opted_out');

CREATE TYPE crm_campaign_status AS ENUM ('draft', 'scheduled', 'running', 'completed', 'cancelled');

CREATE TYPE crm_campaign_recipient_status AS ENUM ('pending', 'queued', 'sent', 'delivered', 'read', 'failed');

CREATE TYPE crm_message_status AS ENUM ('pending', 'sent', 'delivered', 'read', 'failed_retryable', 'failed_permanent');

CREATE TYPE crm_message_direction AS ENUM ('inbound', 'outbound');

CREATE TYPE crm_template_approval_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TYPE crm_template_category AS ENUM ('marketing', 'utility', 'authentication');

-- ---------- Core tenant + identity ----------
CREATE TABLE companies (
  company_id uuid PRIMARY KEY,
  name       text NOT NULL,
  industry   text
);

CREATE TABLE users (
  user_id       uuid PRIMARY KEY,
  name          text NOT NULL,
  email         text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role          crm_user_role NOT NULL DEFAULT 'staff'
);

-- ---------- CRM entities ----------
CREATE TABLE contacts (
  contact_id      uuid PRIMARY KEY,
  name            text NOT NULL,
  phone           text NOT NULL UNIQUE,
  company_id      uuid NOT NULL REFERENCES companies(company_id),
  consent_status  crm_consent_status NOT NULL DEFAULT 'unknown',
  last_inbound_at timestamptz
);

CREATE TABLE leads (
  lead_id    uuid PRIMARY KEY,
  contact_id uuid NOT NULL REFERENCES contacts(contact_id),
  stage      text,
  source     text
);

CREATE TABLE tags (
  tag_id uuid PRIMARY KEY,
  name   text NOT NULL UNIQUE
);

CREATE TABLE contact_tags (
  contact_id uuid NOT NULL REFERENCES contacts(contact_id),
  tag_id     uuid NOT NULL REFERENCES tags(tag_id),
  PRIMARY KEY (contact_id, tag_id)
);

-- ---------- Activity / follow-ups ----------
CREATE TABLE follow_ups (
  follow_up_id uuid PRIMARY KEY,
  contact_id   uuid NOT NULL REFERENCES contacts(contact_id),
  assigned_to  uuid REFERENCES users(user_id),
  due_date     date,
  notes        text
);

CREATE TABLE activity_logs (
  log_id     uuid PRIMARY KEY,
  contact_id uuid NOT NULL REFERENCES contacts(contact_id),
  user_id    uuid REFERENCES users(user_id),
  action     text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- Messaging ----------
CREATE TABLE message_templates (
  template_id          uuid PRIMARY KEY,
  name                 text NOT NULL,
  provider_template_id text,
  category             crm_template_category,
  approval_status      crm_template_approval_status NOT NULL DEFAULT 'pending'
);

CREATE TABLE campaigns (
  campaign_id   uuid PRIMARY KEY,
  name          text NOT NULL,
  template_id   uuid REFERENCES message_templates(template_id),
  status        crm_campaign_status NOT NULL DEFAULT 'draft',
  segment_filter jsonb
);

CREATE TABLE campaign_recipients (
  recipient_id uuid PRIMARY KEY,
  campaign_id  uuid NOT NULL REFERENCES campaigns(campaign_id),
  contact_id   uuid NOT NULL REFERENCES contacts(contact_id),
  status       crm_campaign_recipient_status NOT NULL DEFAULT 'pending',
  retry_count  integer NOT NULL DEFAULT 0
);

CREATE TABLE messages (
  message_id          uuid PRIMARY KEY,
  contact_id          uuid NOT NULL REFERENCES contacts(contact_id),
  campaign_id         uuid REFERENCES campaigns(campaign_id),
  template_id         uuid REFERENCES message_templates(template_id),
  provider_message_id text UNIQUE,
  status              crm_message_status NOT NULL DEFAULT 'pending'
);

CREATE TABLE webhook_events (
  event_id     uuid PRIMARY KEY,
  dedupe_key   text NOT NULL UNIQUE,
  message_id   uuid REFERENCES messages(message_id),
  type         text NOT NULL,
  raw_payload  jsonb,
  received_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------- WhatsApp accounts ----------
CREATE TABLE whatsapp_accounts (
  account_id          uuid PRIMARY KEY,
  phone_number_id     text NOT NULL,
  business_account_id text,
  credentials_ref     text
);

COMMIT;
