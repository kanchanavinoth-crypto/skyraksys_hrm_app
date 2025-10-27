# Backend Dockerfile for Production
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++ curl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Production stage
FROM node:18-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache \
    curl \
    postgresql-client \
    tini \
    && addgroup -g 1001 -S nodejs \
    && adduser -S backend -u 1001

WORKDIR /app

# Copy built dependencies from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY --chown=backend:nodejs . .

# Create necessary directories
RUN mkdir -p logs uploads temp && \
    chown -R backend:nodejs /app

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Use tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Switch to non-root user
USER backend

# Expose port
EXPOSE 8080

# Start application
CMD ["node", "server.js"]
