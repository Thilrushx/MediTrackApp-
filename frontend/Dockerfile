# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files and install ALL deps (including devDependencies for build)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .

# VITE_API_URL is injected at build time via docker-compose build args
ARG VITE_API_URL=http://localhost:5000
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Stage 2: serve with nginx ─────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom nginx config
COPY nginx.conf /etc/nginx/conf.d/app.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
