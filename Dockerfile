# syntax=docker/dockerfile:1

# Build frontend (Vite)
FROM node:20-slim AS web-builder
WORKDIR /app/web
COPY hz-solucoes/apps/web/package.json ./
RUN --mount=type=cache,target=/root/.npm npm install
COPY hz-solucoes/apps/web/ ./
# Use relative URL to call the backend from the browser
ARG VITE_TRPC_URL=/trpc
ENV VITE_TRPC_URL=${VITE_TRPC_URL}
RUN npm run build

# Build backend (TypeScript -> JavaScript)
FROM node:20-slim AS server-builder
WORKDIR /app/server
COPY hz-solucoes/apps/server/package.json ./
RUN --mount=type=cache,target=/root/.npm npm install
COPY hz-solucoes/apps/server/ ./
RUN npm run build

# Production image: Node runtime serving API + static frontend
FROM node:20-slim
WORKDIR /usr/src/app
ENV NODE_ENV=production

# Directory for persistent SQLite database
RUN mkdir -p /data

# Install production dependencies only
COPY hz-solucoes/apps/server/package.json ./
RUN --mount=type=cache,target=/root/.npm npm install --omit=dev

# Copy built backend
COPY --from=server-builder /app/server/dist ./dist

# Copy built frontend into path expected by the server
# Server resolves '../../web/dist' from dist, so place at ./web/dist
COPY --from=web-builder /app/web/dist ./web/dist

# Default envs (can be overridden by compose)
ENV PORT=3000
ENV DATABASE_URL=file:/data/local.db

EXPOSE 3000
CMD ["node","dist/index.js"]