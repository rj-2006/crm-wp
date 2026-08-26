# Bharat Infotechs - WhatsApp CRM

A modern, high-performance WhatsApp CRM built for Bharat Infotechs. This monorepo contains a NestJS backend and a React frontend, designed to manage contacts, launch WhatsApp campaigns, and track engagement via the Meta Cloud API.

## Project Structure

This is a full-stack monorepo:
- `apps/api/` - NestJS backend API, powered by Prisma, PostgreSQL, and BullMQ for robust background processing.
- `apps/web/` - React SPA frontend, providing a sleek, responsive CRM console for administrators and staff.

## Prerequisites

- Node.js (v18+)
- Docker and Docker Compose (for PostgreSQL and Redis)
- npm or yarn

## Getting Started

### 1. Start Infrastructure
The backend relies on PostgreSQL for data storage and Redis for BullMQ job queues.
```bash
docker compose up -d
```

### 2. Setup the Backend API
Navigate to the API directory, install dependencies, and run migrations.
```bash
cd apps/api
npm install
npx prisma migrate dev
npm run dev
```
The API will start on `http://localhost:3000`.

### 3. Setup the Frontend Web App
In a new terminal, navigate to the web directory and start the React app.
```bash
cd apps/web
npm install
PORT=3001 npm start
```
The CRM console will be available at `http://localhost:3001`.

## Default Credentials

A default admin user is seeded into the database for testing:
- **Email:** `admin@acme.com`
- **Password:** `password123`

## Important Warnings

- **Database Truncation:** Never run `TRUNCATE contacts CASCADE;` in production. Because of the foreign key relationships, this will cascade and wipe out all `activity_logs`, `messages`, `campaign_recipients`, `consent_logs`, and `webhook_events`. To clear contacts for a specific company, use `DELETE FROM contacts WHERE "company_id" = '...';` instead.

## Documentation

For deep dives into the technical stack and API integration, refer to:
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture, database schema, and design patterns.
- [API_DOCS.md](./API_DOCS.md) - Detailed breakdown of all REST API endpoints and payloads.
