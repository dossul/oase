# ============================================================
# OASE API - Dockerfile
# ============================================================
# Build context : racine du repo (ou /opt/oase sur le VPS)
# Build cmd     : docker build -f deploy/api.Dockerfile -t oase-api .
# ============================================================

# ===== Stage 1 : Build =====
FROM node:20-alpine AS builder

WORKDIR /app

# Dependances
COPY oase-api/package*.json ./
COPY oase-api/prisma ./prisma
RUN npm ci

# Code source
COPY oase-api/tsconfig*.json oase-api/nest-cli.json ./
COPY oase-api/src ./src

# Build
RUN npx prisma generate
RUN npm run build

# ===== Stage 2 : Runtime =====
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Outils utiles
RUN apk add --no-cache curl tini

# User non-root
RUN addgroup -S oase && adduser -S oase -G oase

# Code + dependances prod
COPY --from=builder --chown=oase:oase /app/node_modules ./node_modules
COPY --from=builder --chown=oase:oase /app/dist ./dist
COPY --from=builder --chown=oase:oase /app/prisma ./prisma
COPY --from=builder --chown=oase:oase /app/package.json ./package.json

USER oase

EXPOSE 3000

# Healthcheck (NestJS /health)
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:3000/api/v1/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
