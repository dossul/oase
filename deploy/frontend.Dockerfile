# ============================================================
# OASE Frontend - Dockerfile
# ============================================================
# Build context : racine du repo (ou /opt/oase sur le VPS)
# Build cmd     : docker build -f deploy/frontend.Dockerfile -t oase-frontend .
# ============================================================

# ===== Stage 1 : Build =====
FROM node:20-alpine AS builder

WORKDIR /app

COPY maquette/package*.json ./
RUN npm ci

COPY maquette/ ./
RUN npm run build

# ===== Stage 2 : Runtime =====
FROM nginx:1.27-alpine AS runner

# Nginx config custom
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

# Static files
COPY --from=builder /app/dist /usr/share/nginx/html

# Healthcheck simple
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/healthz || exit 1

EXPOSE 80
