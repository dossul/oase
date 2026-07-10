# ===== Build =====
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ===== Runtime =====
FROM nginx:1.27-alpine AS runner

# Nginx config custom
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Static files
COPY --from=builder /app/dist /usr/share/nginx/html

# Healthcheck simple
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/healthz || exit 1

EXPOSE 80
