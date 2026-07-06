# Build environment
FROM node:20-bookworm-slim AS builder
LABEL org.opencontainers.image.source="https://github.com/MagiCarpy/ucladn"
WORKDIR /app

COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

RUN npm ci
COPY . .

RUN npm run build --workspace=frontend

RUN npm prune --production

# Runtime Environment
FROM gcr.io/distroless/nodejs20-debian12
WORKDIR /app

ENV NODE_ENV=production

# Copy node_modules
COPY --from=builder /app/node_modules ./node_modules

# Copy backend and frontend static files (dist)
COPY --from=builder /app/backend ./backend

COPY --from=builder /app/frontend/dist ./frontend/dist
COPY --from=builder /app/frontend/public ./frontend/public

EXPOSE 5000

CMD ["backend/server.js"]