# Build stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy the root package.json if it exists (for lockfiles)
COPY package*.json ./
# Copy the api package.json
COPY apps/api/package*.json ./apps/api/

# Move into api dir
WORKDIR /usr/src/app/apps/api
RUN npm install

# Copy only the api source code
COPY apps/api ./

# Generate Prisma client
RUN npx prisma generate

# Build the NestJS app
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /usr/src/app/apps/api

# Set NODE_ENV to production
ENV NODE_ENV=production

# Copy package files
COPY apps/api/package*.json ./

# Install production dependencies only
RUN npm install --omit=dev

# Copy built assets and Prisma schema from builder
COPY --from=builder /usr/src/app/apps/api/dist ./dist
COPY --from=builder /usr/src/app/apps/api/prisma ./prisma
# Copy the generated prisma client
COPY --from=builder /usr/src/app/apps/api/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /usr/src/app/apps/api/node_modules/.prisma ./node_modules/.prisma

# Expose API port
EXPOSE 3000

# Start script that runs migrations then starts the app
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/src/main.js"]
