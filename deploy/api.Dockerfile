# ===== Build =====
FROM node:20-alpine AS builder

WORKDIR /app

# Dépendances (cache layer)
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

# Code source
COPY tsconfig*.json nest-cli.json ./
COPY src ./src

# Build
RUN npx prisma generate
RUN npm run build

# ===== Runtime =====
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Outils utiles
RUN apk add --no-cache curl tini

# User non-root
RUN addgroup -S oase && adduser -S oase -G oase

# Code + dépendances prod
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
