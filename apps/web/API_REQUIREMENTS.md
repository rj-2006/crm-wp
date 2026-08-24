# API Requirements — Bharat Infotechs CRM + WhatsApp Bulk Messaging

This document lists the API endpoints the frontend expects.
Backend can be built in any stack; response field names below should be matched exactly.

## Auth

### POST /auth/login
Request: { "email": string, "password": string }
Response: { "token": string, "user": { "id": string, "name": string, "role": "Sales / Support" | "Administrator" } }

### POST /auth/logout
Response: 200 OK

## Contacts

### GET /contacts
Response: array of:
{
  "id": string,
  "name": string,
  "phone": string,
  "segment": string,
  "consent": "opted_in" | "opted_out" | "pending",
  "lastActivity": string
}

### POST /contacts
Request: { "name": string, "phone": string, "segment": string }
Response: created contact object

### PUT /contacts/:id
Request: partial contact fields to update
Response: updated contact object

### DELETE /contacts/:id
Response: 200 OK

## Campaigns

### GET /campaigns
Response: array of:
{
  "id": string,
  "name": string,
  "template": string,
  "segment": string,
  "status": "draft" | "queued" | "sending" | "completed" | "failed",
  "recipients": number,
  "sent": number,
  "delivered": number,
  "read": number,
  "failed": number
}

### POST /campaigns
Request: { "name": string, "template": string, "segment": string }
Response: created campaign object

### POST /campaigns/:id/launch
Response: updated campaign object with status "sending"

### GET /campaigns/:id/stats
Response: { "sent": number, "delivered": number, "read": number, "failed": number }

## Templates

### GET /templates
Response: array of:
{
  "id": string,
  "name": string,
  "category": "Transactional" | "Marketing" | "Utility",
  "status": "approved" | "pending",
  "body": string
}

### POST /templates
Request: { "name": string, "category": string, "body": string }
Response: created template object

### PUT /templates/:id
Request: partial fields to update
Response: updated template object

### DELETE /templates/:id
Response: 200 OK

## Users (Admin)

### GET /users
Response: array of:
{
  "id": string,
  "name": string,
  "role": "Administrator" | "Sales / Support",
  "email": string,
  "status": "active" | "invited"
}

### POST /users/invite
Request: { "name": string, "email": string, "role": string }
Response: created user object

### PUT /users/:id
Request: partial fields to update
Response: updated user object

## Notes
- All endpoints (except /auth/login) should require the auth token from login, sent as an Authorization header.
- Design is not yet finalized — data shapes above are stable, but some fields may be added once design is approved.