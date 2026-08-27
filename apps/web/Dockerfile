# Stage 1: Build React
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Set API URL with /api included
ENV REACT_APP_API_URL=https://crm-wp-production.up.railway.app/api

RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

RUN printf 'server {\n\
    listen ${PORT};\n\
    location / {\n\
        root /usr/share/nginx/html;\n\
        index index.html index.htm;\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/templates/default.conf.template

COPY --from=builder /app/build /usr/share/nginx/html

ENV PORT=80

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
