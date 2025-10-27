# SkyrakSys HRM - Linux Server Deployment Guide

## 🐧 Linux Server Deployment Setup

### Prerequisites
- Ubuntu 20.04+ or CentOS 8+
- Node.js 18+ 
- PostgreSQL 13+
- Docker & Docker Compose
- Nginx (for reverse proxy)
- SSL certificates (Let's Encrypt)

---

## 🚀 Deployment Steps

### 1. Server Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Docker
sudo apt install docker.io docker-compose -y
sudo systemctl enable docker
sudo systemctl start docker

# Install Nginx
sudo apt install nginx -y
```

### 2. Database Setup
```bash
# Create PostgreSQL database and user
sudo -u postgres psql << EOF
CREATE DATABASE skyraksys_hrm;
CREATE USER hrm_user WITH PASSWORD 'YOUR_SECURE_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE skyraksys_hrm TO hrm_user;
ALTER USER hrm_user CREATEDB;
\q
EOF
```

### 3. Application Deployment
```bash
# Clone repository (or upload files)
git clone <your-repo-url> /opt/skyraksys-hrm
cd /opt/skyraksys-hrm

# Set proper permissions
sudo chown -R $USER:$USER /opt/skyraksys-hrm

# Install backend dependencies
cd backend
npm install --production

# Install frontend dependencies and build
cd ../frontend
npm install
npm run build

# Copy built frontend to nginx directory
sudo cp -r build/* /var/www/html/
```

### 4. Environment Configuration
```bash
# Create production environment file
sudo tee /opt/skyraksys-hrm/backend/.env << EOF
NODE_ENV=production
PORT=8080
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skyraksys_hrm
DB_USER=hrm_user
DB_PASSWORD=YOUR_SECURE_PASSWORD
DB_DIALECT=postgres
JWT_SECRET=YOUR_SECURE_JWT_SECRET
FRONTEND_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com
EOF
```

### 5. Database Migration
```bash
cd /opt/skyraksys-hrm/backend
npm run db:migrate
npm run db:seed
```

### 6. Create Systemd Service
```bash
# Create systemd service file
sudo tee /etc/systemd/system/skyraksys-hrm.service << EOF
[Unit]
Description=SkyrakSys HRM Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=$USER
WorkingDirectory=/opt/skyraksys-hrm/backend
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl enable skyraksys-hrm
sudo systemctl start skyraksys-hrm
```

### 7. Nginx Configuration
```bash
# Create Nginx configuration
sudo tee /etc/nginx/sites-available/skyraksys-hrm << EOF
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend (React build)
    root /var/www/html;
    index index.html index.htm;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/skyraksys-hrm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 8. SSL Configuration (Let's Encrypt)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 9. Firewall Configuration
```bash
# Configure UFW
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 5432  # PostgreSQL (if external access needed)
sudo ufw enable
```

### 10. Monitoring & Maintenance
```bash
# Check service status
sudo systemctl status skyraksys-hrm
sudo systemctl status postgresql
sudo systemctl status nginx

# View logs
sudo journalctl -u skyraksys-hrm -f
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Database backup script
sudo tee /opt/backup-hrm-db.sh << EOF
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)
pg_dump -U hrm_user -h localhost skyraksys_hrm > /opt/backups/hrm_backup_\$DATE.sql
find /opt/backups -name "hrm_backup_*.sql" -mtime +7 -delete
EOF

sudo chmod +x /opt/backup-hrm-db.sh
sudo mkdir -p /opt/backups
sudo crontab -e
# Add: 0 2 * * * /opt/backup-hrm-db.sh
```

---

## 🛡️ Security Checklist

- [ ] PostgreSQL password is secure and unique
- [ ] JWT secret is secure and unique
- [ ] SSL/TLS certificates are installed
- [ ] Firewall is configured
- [ ] Regular security updates enabled
- [ ] Database backups scheduled
- [ ] Monitoring is configured
- [ ] Log rotation is set up
- [ ] Rate limiting is enabled
- [ ] CORS is properly configured

---

## 📊 Performance Optimization

### Database Optimization
```sql
-- Add indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_timesheets_user_id ON timesheets(user_id);
CREATE INDEX idx_leaves_user_id ON leaves(user_id);
CREATE INDEX idx_employees_department_id ON employees(department_id);
```

### Node.js Optimization
```javascript
// In production, use PM2 for process management
npm install -g pm2

# Create PM2 ecosystem file
tee ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'skyraksys-hrm',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 8080
    }
  }]
}
EOF

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

---

## 🔍 Troubleshooting

### Common Issues
1. **Database Connection Failed**
   - Check PostgreSQL service: `sudo systemctl status postgresql`
   - Verify credentials in `.env` file
   - Check firewall settings

2. **Application Not Starting**
   - Check logs: `sudo journalctl -u skyraksys-hrm`
   - Verify Node.js version: `node --version`
   - Check file permissions

3. **Frontend Not Loading**
   - Check Nginx configuration: `sudo nginx -t`
   - Verify build files in `/var/www/html`
   - Check browser console for errors

---

## 📞 Support

For deployment assistance:
- Check logs first: `sudo journalctl -u skyraksys-hrm -f`
- Verify configuration files
- Test database connection
- Check service status

---

**Your SkyrakSys HRM system is now ready for production deployment on Linux servers! 🚀**
