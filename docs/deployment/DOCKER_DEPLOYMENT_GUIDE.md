# 🐳 Docker Deployment Guide

## 📋 Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- Domain name with DNS configured
- SSL certificates (optional for development)

## 🏗️ Docker Configuration

### Dockerfile (Backend)
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Set permissions
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3001

CMD ["npm", "start"]
```

### Dockerfile (Frontend)
```dockerfile
# Build stage
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose (Production)
```yaml
version: '3.8'

services:
  # Database
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: skyraksys_hrm_prod
      POSTGRES_USER: hrm_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U hrm_user -d skyraksys_hrm_prod"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Redis (for caching)
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://hrm_user:${DB_PASSWORD}@postgres:5432/skyraksys_hrm_prod
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - FRONTEND_URL=${FRONTEND_URL}
    volumes:
      - ./backend/uploads:/app/uploads
      - ./logs:/app/logs
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
    restart: unless-stopped

  # Nginx Load Balancer (if scaling)
  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./logs:/var/log/nginx
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:

networks:
  default:
    name: skyraksys_hrm_network
```

## 🚀 Deployment Commands

### Development Deployment
```bash
# Clone repository
git clone https://github.com/your-username/skyrakskys_hrm.git
cd skyrakskys_hrm

# Create environment file
cp .env.production.template .env.production
# Edit .env.production with your settings

# Build and start services
docker-compose up -d

# Run database migrations
docker-compose exec backend npm run migrate
docker-compose exec backend npm run seed
```

### Production Deployment
```bash
# Pull latest changes
git pull origin main

# Build images without cache
docker-compose build --no-cache

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Health check
docker-compose ps
docker-compose logs
```

## 🔧 Environment Configuration

### .env.production
```bash
# Database
DB_PASSWORD=your_secure_db_password

# JWT
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters

# Application
FRONTEND_URL=https://your-domain.com
BACKEND_URL=https://api.your-domain.com

# SSL (if using)
SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
SSL_KEY_PATH=/etc/nginx/ssl/key.pem
```

## 🛡️ Security Configuration

### Nginx Configuration
```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3001;
    }

    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Backend API
        location /api/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            # Rate limiting
            limit_req zone=api burst=20 nodelay;
        }
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
}
```

## 📊 Monitoring & Logging

### Docker Compose with Monitoring
```yaml
  # Monitoring
  prometheus:
    image: prom/prometheus
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    restart: unless-stopped

  grafana:
    image: grafana/grafana
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
    ports:
      - "3000:3000"
    restart: unless-stopped

  # Log aggregation
  elasticsearch:
    image: elasticsearch:8.5.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"

  kibana:
    image: kibana:8.5.0
    environment:
      ELASTICSEARCH_HOSTS: http://elasticsearch:9200
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
```

## 🔄 Backup & Recovery

### Database Backup Script
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_$DATE.sql"

# Create backup
docker-compose exec -T postgres pg_dump -U hrm_user skyraksys_hrm_prod > ./backups/$BACKUP_FILE

# Compress backup
gzip ./backups/$BACKUP_FILE

# Remove old backups (keep last 30 days)
find ./backups -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

### Automated Backup (Cron)
```bash
# Add to crontab
# Daily backup at 2 AM
0 2 * * * /path/to/skyraksys_hrm/backup.sh

# Weekly full backup
0 2 * * 0 /path/to/skyraksys_hrm/full-backup.sh
```

## 🚑 Health Checks & Recovery

### Health Check Script
```bash
#!/bin/bash
# health-check.sh

echo "🔍 Health Check Starting..."

# Check containers
if ! docker-compose ps | grep -q "Up"; then
    echo "❌ Some containers are down"
    docker-compose up -d
fi

# Check database
if ! docker-compose exec -T postgres pg_isready -U hrm_user; then
    echo "❌ Database is down"
    docker-compose restart postgres
fi

# Check backend API
if ! curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "❌ Backend API is down"
    docker-compose restart backend
fi

echo "✅ Health Check Complete"
```

## 🛠️ Useful Commands

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Scale services
docker-compose up -d --scale backend=3

# Execute commands in containers
docker-compose exec backend npm run migrate
docker-compose exec postgres psql -U hrm_user -d skyraksys_hrm_prod

# Update and restart
git pull origin main
docker-compose build --no-cache
docker-compose up -d

# Clean up
docker system prune -a
docker volume prune
```

## 🔍 Troubleshooting

### Common Issues

1. **Container won't start**
   ```bash
   docker-compose logs container_name
   docker-compose restart container_name
   ```

2. **Database connection issues**
   ```bash
   docker-compose exec postgres pg_isready
   docker-compose restart postgres
   ```

3. **Port conflicts**
   ```bash
   docker-compose down
   sudo netstat -tlnp | grep :3001
   docker-compose up -d
   ```

4. **Out of disk space**
   ```bash
   docker system df
   docker system prune -a
   ```

---

**🎉 Your Docker deployment is ready for production!**
