# 🚀 Production Deployment Guide

## 📋 Pre-Deployment Checklist

### ✅ Environment Setup
- [ ] Node.js 16+ installed on production server
- [ ] PostgreSQL 13+ database configured
- [ ] Domain name configured with DNS
- [ ] SSL certificate installed
- [ ] Firewall configured (ports 80, 443, 3001)

### ✅ Security Configuration
- [ ] Strong JWT secrets generated
- [ ] Database passwords updated
- [ ] Environment variables secured
- [ ] CORS origins configured
- [ ] Rate limiting enabled

## 🔧 Deployment Steps

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Create application user
sudo useradd -m -s /bin/bash hrm
sudo usermod -aG sudo hrm
```

### 2. Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE skyraksys_hrm_prod;
CREATE USER hrm_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE skyraksys_hrm_prod TO hrm_user;
\q
```

### 3. Application Deployment

```bash
# Clone repository
git clone https://github.com/your-username/skyrakskys_hrm.git
cd skyrakskys_hrm

# Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..

# Configure environment
cp .env.production.template .env.production
nano .env.production  # Configure your settings

# Build frontend
npm run build

# Run database migrations
cd backend
npm run migrate
npm run seed
cd ..
```

### 4. Start Application with PM2

```bash
# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### 5. Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/ssl/certificate.crt;
    ssl_certificate_key /path/to/ssl/private.key;

    # Frontend
    location / {
        root /path/to/skyraksys_hrm/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔄 CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: |
        npm install
        cd backend && npm install
        cd ../frontend && npm install
        
    - name: Build frontend
      run: npm run build
      
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.PRIVATE_KEY }}
        script: |
          cd /path/to/skyraksys_hrm
          git pull origin main
          npm install
          cd backend && npm install
          cd ../frontend && npm install && npm run build
          cd ..
          pm2 restart ecosystem.config.js
```

## 📊 Monitoring & Maintenance

### Health Checks

```bash
# Check application status
pm2 status

# Check logs
pm2 logs

# Monitor system resources
pm2 monit

# Check database connection
node scripts/testing/quick-api-test.js
```

### Backup Strategy

```bash
# Database backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U hrm_user skyraksys_hrm_prod > backup_$DATE.sql

# Keep only last 30 days of backups
find ./backups -name "backup_*.sql" -mtime +30 -delete
```

### Log Rotation

```bash
# Install logrotate
sudo apt install logrotate

# Configure log rotation
echo '/path/to/skyraksys_hrm/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    postrotate
        pm2 reloadLogs
    endscript
}' | sudo tee /etc/logrotate.d/skyraksys-hrm
```

## 🛡️ Security Best Practices

### Firewall Configuration
```bash
# Enable firewall
sudo ufw enable

# Allow SSH
sudo ufw allow ssh

# Allow HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow backend port (if needed)
sudo ufw allow 3001
```

### SSL/TLS Setup
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Generate SSL certificate
sudo certbot --nginx -d your-domain.com
```

## 🔍 Troubleshooting

### Common Issues

1. **Port 3001 already in use**
   ```bash
   sudo lsof -i :3001
   pm2 restart all
   ```

2. **Database connection errors**
   ```bash
   sudo -u postgres psql -c "SELECT version();"
   ```

3. **Permission errors**
   ```bash
   sudo chown -R hrm:hrm /path/to/skyraksys_hrm
   ```

4. **PM2 not starting on boot**
   ```bash
   pm2 unstartup
   pm2 startup
   pm2 save
   ```

## 📞 Support

For deployment support:
- Documentation: `docs/deployment/`
- Issues: GitHub Issues
- Email: support@your-domain.com

## 🎯 Performance Optimization

### Database Optimization
```sql
-- Create indexes for better performance
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_salary_structures_employee ON salary_structures(employee_id);
```

### Application Optimization
- Enable gzip compression
- Implement Redis caching
- Configure CDN for static assets
- Monitor with APM tools

---

**🎉 Congratulations! Your SkyrakSys HRM is now production-ready!**
