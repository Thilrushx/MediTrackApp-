# ── Stage 1: dependencies ─────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Copy package files and install production deps only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── Stage 2: runtime ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

# Create non-root user for security
RUN addgroup -S meditrack && adduser -S meditrack -G meditrack

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY src ./src
COPY package.json ./

# Create uploads directory with correct ownership
RUN mkdir -p uploads && chown -R meditrack:meditrack /app

USER meditrack

EXPOSE 5000

# Health check — Docker will restart the container if the API is unresponsive
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

CMD ["node", "src/server.js"]
