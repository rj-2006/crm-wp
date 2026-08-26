# Deployment Guide

This document outlines the steps required to deploy the Bharat Infotechs CRM + WhatsApp Bulk Messaging System to a production environment.

## 1. Infrastructure Requirements

To run this application in production, you will need:
- **Node.js Environment:** A server or container (e.g., AWS EC2, DigitalOcean Droplet, Heroku, or Docker) running Node.js (v18+).
- **PostgreSQL Database:** A managed PostgreSQL instance (e.g., AWS RDS, Supabase, Neon) for reliable data persistence.
- **Redis Server:** A managed Redis instance (e.g., Upstash, ElastiCache) to power the BullMQ job queue.
- **Web Server / Reverse Proxy:** NGINX or similar to route traffic and serve static files.

## 2. Environment Variables

Create a `.env` file in the `apps/api` directory with the following variables:

```ini
# Server Configuration
NODE_ENV=production
PORT=3000

# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/crm_whatsapp?schema=public"

# Redis (Queue)
REDIS_HOST="your-redis-host"
REDIS_PORT=6379
REDIS_PASSWORD="your-redis-password"

# Security
# MUST be a strong, unpredictable string (at least 32 characters)
JWT_SECRET="your-strong-production-jwt-secret-here"
```

## 3. Backend Deployment (API)

1. **Install Dependencies:**
   ```bash
   cd apps/api
   npm ci --production
   ```

2. **Run Migrations:**
   Ensure your production database schema is up to date.
   ```bash
   npx prisma migrate deploy
   ```

3. **Build and Run:**
   ```bash
   npm run build
   npm run start:prod
   ```
   *Note: In production, we strongly recommend using a process manager like PM2 (`pm2 start dist/main.js`) or deploying as a Docker container.*

## 4. Frontend Deployment (Web)

1. **Configure API URL:**
   Update the `apps/web/src/services/api.js` file (or use environment variables if configured in the build tool) to point to your production API URL (e.g., `https://api.yourdomain.com`).

2. **Build the Static Assets:**
   ```bash
   cd apps/web
   npm install
   npm run build
   ```

3. **Serve Static Files:**
   The `apps/web/build` folder contains the compiled static assets. You can serve this folder using NGINX, deploy it to an AWS S3 bucket behind CloudFront, or use a static hosting provider like Vercel or Netlify.

## 5. Webhook Configuration (Critical for WhatsApp Integration)

To receive delivery receipts and inbound messages from the Meta WhatsApp API:
1. Ensure your backend API is publicly accessible over **HTTPS** (e.g., `https://api.yourdomain.com`).
2. Log into the [Meta App Dashboard](https://developers.facebook.com/apps).
3. Navigate to the **WhatsApp > Configuration** section.
4. Set the Webhook URL to: `https://api.yourdomain.com/api/webhooks/whatsapp`.
5. Enter a Verification Token of your choosing (and ensure it matches any validation logic in your backend, if implemented).
6. Subscribe to the `messages` field.

## 6. Security Considerations

- **HTTPS is mandatory** for the webhook endpoint (Meta will not send webhooks to `http://`).
- The `TRUNCATE` command is highly destructive due to foreign key cascades. Never manually truncate the `contacts` table in production; use targeted `DELETE` queries instead.
- Ensure the `JWT_SECRET` is kept secure and out of version control. The backend will refuse to boot in `production` mode if this secret is missing or too short.
