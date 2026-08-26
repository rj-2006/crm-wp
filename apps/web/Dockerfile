# Build stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy the root package.json if it exists
COPY package*.json ./
# Copy the web package.json
COPY apps/web/package*.json ./apps/web/

# Move into web dir
WORKDIR /usr/src/app/apps/web
RUN npm install

# Copy only the web source code
COPY apps/web ./

# Ensure API URL points to the proxy path (which Nginx will handle)
ENV REACT_APP_API_URL=/api

# Build the React app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /usr/src/app/apps/web/build /usr/share/nginx/html

# Copy custom NGINX configuration
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start NGINX
CMD ["nginx", "-g", "daemon off;"]
