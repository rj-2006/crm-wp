# API Documentation

All API endpoints are prefixed with `/api`. Authentication is handled via Bearer token (JWT) passed in the `Authorization` header.

## Authentication

### `POST /auth/login`
Authenticates a user and returns a JWT token.
- **Body:** `{ "email": "admin@acme.com", "password": "password123" }`
- **Response:** `{ "accessToken": "eyJ...", "user": { "id": "...", "name": "...", "role": "ADMIN", "companyId": "..." } }`

---

## Contacts

### `GET /contacts`
Retrieves a paginated list of contacts for the authenticated user's company.
- **Query Params:** 
  - `q` (string, optional) - Search by name or phone.
  - `status` (string, optional) - Filter by contact status.
- **Response:** `[ { "id": "...", "firstName": "...", "lastName": "...", "phone": "+91...", "consentStatus": "PENDING", ... } ]`

### `POST /contacts`
Creates a new contact manually.
- **Body:** `{ "firstName": "John", "lastName": "Doe", "phone": "+919876543210", "status": "ACTIVE", "source": "manual", "customFields": { "segment": "Kerala" } }`
- **Response (201):** Returns the created contact object.
- **Response (409):** `ConflictException` if a contact with the same phone already exists.

### `PATCH /contacts/:id`
Updates an existing contact's fields.

### `POST /contacts/import` (Multipart Form)
Bulk imports contacts from a CSV file.
- **Payload:** `multipart/form-data` with a `file` field containing the `.csv`.
- **Response:** `{ "imported": 242, "merged": 11, "skipped": 261 }`

---

## Campaigns

### `POST /companies/:companyId/campaigns`
Drafts a new WhatsApp broadcast campaign.
- **Body:** `{ "name": "Diwali Offer", "templateId": "...", "segmentFilter": { "state": "Kerala" } }`

### `POST /companies/:companyId/campaigns/:campaignId/execute`
Locks a drafted campaign and enqueues it to BullMQ for asynchronous dispatch.

### `GET /companies/:companyId/campaigns`
Retrieves a list of all campaigns for a company, including high-level metrics (sent, delivered, read, failed).

---

## Meta Cloud Webhooks

### `GET /webhooks/whatsapp`
Verification endpoint for Meta's webhook subscription challenge.
- **Query Params:** `hub.mode`, `hub.challenge`, `hub.verify_token`

### `POST /webhooks/whatsapp`
Receives live status updates and inbound messages from the WhatsApp API.
- **Note:** This endpoint triggers the `WebhookProcessor` which handles engagement tracking and automatic opt-outs (e.g., responding to "STOP").
