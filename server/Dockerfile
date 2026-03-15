# ── Build stage ────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and Prisma schema
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src
COPY templates ./templates

# Generate Prisma client and compile TypeScript
RUN npx prisma generate
RUN npm run build

# ── Production stage ──────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Install only production deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy Prisma schema + generated client
COPY prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma

# Copy compiled app + templates
COPY --from=build /app/dist ./dist
COPY templates ./templates

# Create uploads directory
RUN mkdir -p uploads

# Non-root user
RUN addgroup -g 1001 appgroup && \
    adduser -u 1001 -G appgroup -s /bin/sh -D appuser && \
    chown -R appuser:appgroup /app
USER appuser

EXPOSE 4000

CMD ["node", "dist/index.js"]
