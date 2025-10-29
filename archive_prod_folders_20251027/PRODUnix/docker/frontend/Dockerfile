# Frontend Dockerfile for Production
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache curl g++ make python3

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage with nginx
FROM nginx:alpine AS production

# Install runtime dependencies
RUN apk add --no-cache curl

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Create non-root user
RUN addgroup -g 1001 -S nginx-custom && \
    adduser -S frontend -u 1001 -G nginx-custom

# Set proper permissions
RUN chown -R frontend:nginx-custom /usr/share/nginx/html && \
    chown -R frontend:nginx-custom /var/cache/nginx && \
    chown -R frontend:nginx-custom /var/log/nginx && \
    chown -R frontend:nginx-custom /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R frontend:nginx-custom /var/run/nginx.pid

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# Switch to non-root user
USER frontend

# Expose port
EXPOSE 3000

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
