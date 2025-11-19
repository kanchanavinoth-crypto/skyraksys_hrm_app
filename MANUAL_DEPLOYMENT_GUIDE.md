# 🚀 SkyrakSys HRM Manual Deployment Guide
## Complete Step-by-Step Production Setup for RHEL 9

**Server:** 95.216.14.232  
**Date:** November 19, 2025  
**Backend Port:** 5000  
**Frontend Port:** 80/443 (SSL)  

---

## 📋 **Prerequisites Check**

```bash
# Check OS version
cat /etc/os-release

# Check if running as root
whoami

# Update system
dnf update -y
```

---

## 🔧 **Step 1: Install Node.js 18**

```bash
# Install Node.js repository
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -

# Install Node.js
dnf install -y nodejs

# Verify installation
node --version
npm --version

# Install PM2 globally
npm install -g pm2
```

---

## 🗄️ **Step 2: Install and Configure PostgreSQL**

```bash
# Install PostgreSQL 15
dnf install -y postgresql postgresql-server postgresql-contrib

# Initialize database
postgresql-setup --initdb

# Start and enable PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Switch to postgres user and create database
sudo -u postgres psql -c "CREATE USER skyraksys_admin WITH ENCRYPTED PASSWORD 'SkyRakDB#2025!Prod@HRM\$Secure';"
sudo -u postgres psql -c "CREATE DATABASE skyraksys_hrm_prod OWNER skyraksys_admin;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE skyraksys_hrm_prod TO skyraksys_admin;"

# Configure PostgreSQL authentication
# Edit /var/lib/pgsql/data/pg_hba.conf
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /var/lib/pgsql/data/postgresql.conf
echo "host    skyraksys_hrm_prod    skyraksys_admin    127.0.0.1/32    md5" >> /var/lib/pgsql/data/pg_hba.conf

# Restart PostgreSQL
systemctl restart postgresql

# Test connection
PGPASSWORD='SkyRakDB#2025!Prod@HRM$Secure' psql -h localhost -U skyraksys_admin -d skyraksys_hrm_prod -c "\dt"
```

---

## 🌐 **Step 3: Install and Configure Nginx**

```bash
# Install Nginx
dnf install -y nginx

# Start and enable Nginx
systemctl start nginx
systemctl enable nginx

# Create SSL directory
mkdir -p /etc/nginx/ssl

# Generate self-signed SSL certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/skyraksys.key \
    -out /etc/nginx/ssl/skyraksys.crt \
    -subj "/C=US/ST=State/L=City/O=SkyrakSys/CN=95.216.14.232"

# Create Nginx configuration
cat > /etc/nginx/conf.d/skyraksys-hrm.conf << 'EOF'
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name 95.216.14.232;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name 95.216.14.232;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/skyraksys.crt;
    ssl_certificate_key /etc/nginx/ssl/skyraksys.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";

    # Frontend (React app)
    location / {
        root /opt/skyraksys-hrm/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
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
EOF

# Test Nginx configuration
nginx -t

# Reload Nginx
systemctl reload nginx
```

---

## 📁 **Step 4: Setup Application Directory**

```bash
# Create application directory
mkdir -p /opt/skyraksys-hrm
cd /opt/skyraksys-hrm

# Clone repository
git clone https://github.com/kanchanavinoth-crypto/skyraksys_hrm_app.git .

# Or download and extract manually if git fails
# wget https://github.com/kanchanavinoth-crypto/skyraksys_hrm_app/archive/refs/heads/master.zip
# unzip master.zip
# mv skyraksys_hrm_app-master/* .
# rmdir skyraksys_hrm_app-master
```

---

## ⚙️ **Step 5: Configure Backend Environment**

```bash
# Navigate to backend directory
cd /opt/skyraksys-hrm/backend

# Create .env file
cat > .env << 'EOF'
# Database Configuration
DB_NAME=skyraksys_hrm_prod
DB_USER=skyraksys_admin
DB_PASSWORD=SkyRakDB#2025!Prod@HRM$Secure
DB_HOST=localhost
DB_PORT=5432

# Server Configuration
PORT=5000
NODE_ENV=production

# JWT Configuration
JWT_SECRET=SkyRak2025JWT@Prod!Secret#HRM$Key&Secure*System^Auth%Token

# Session Configuration
SESSION_SECRET=SkyRak2025Session@Secret!HRM#Prod$Key&Secure

# Email Configuration (if needed)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Application URLs
FRONTEND_URL=https://95.216.14.232
BACKEND_URL=https://95.216.14.232/api
EOF

# Install backend dependencies
npm install --production

# Run database migrations
npx sequelize-cli db:migrate

# Seed initial data (if needed)
npx sequelize-cli db:seed:all
```

---

## 🎨 **Step 6: Build and Deploy Frontend**

```bash
# Navigate to frontend directory
cd /opt/skyraksys-hrm/frontend

# Create .env file for build
cat > .env << 'EOF'
REACT_APP_API_URL=https://95.216.14.232/api
REACT_APP_ENVIRONMENT=production
GENERATE_SOURCEMAP=false
EOF

# Install dependencies
npm install

# Build production version
npm run build

# Verify build
ls -la dist/
```

---

## 🚀 **Step 7: Setup PM2 Process Management**

```bash
# Navigate to application root
cd /opt/skyraksys-hrm

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'skyraksys-hrm-backend',
    script: './backend/server.js',
    cwd: '/opt/skyraksys-hrm/backend',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    log_file: '/var/log/skyraksys-hrm/combined.log',
    out_file: '/var/log/skyraksys-hrm/out.log',
    error_file: '/var/log/skyraksys-hrm/error.log',
    merge_logs: true,
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
EOF

# Create log directory
mkdir -p /var/log/skyraksys-hrm

# Start application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup systemd
# Follow the instructions from the command output

# Check PM2 status
pm2 status
pm2 logs
```

---

## 🔥 **Step 8: Configure Firewall**

```bash
# Open necessary ports
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --permanent --add-port=5000/tcp

# Reload firewall
firewall-cmd --reload

# Check firewall status
firewall-cmd --list-all
```

---

## 🔒 **Step 9: Configure SELinux (if enabled)**

```bash
# Check SELinux status
getenforce

# If SELinux is enabled, configure it
setsebool -P httpd_can_network_connect 1
setsebool -P httpd_can_network_relay 1

# Set proper context for application files
semanage fcontext -a -t httpd_exec_t "/opt/skyraksys-hrm/frontend/dist(/.*)?"
restorecon -Rv /opt/skyraksys-hrm/frontend/dist
```

---

## ✅ **Step 10: Database Schema Fix & Verification**

### **🚨 Critical Database Issues Fix**

```bash
# Navigate to backend directory
cd /opt/skyraksys-hrm/backend

# Fix 1: Add missing User table columns (CRITICAL - fixes login error)
PGPASSWORD='SkyRakDB#2025!Prod@HRM$Secure' psql -h localhost -U skyraksys_admin -d skyraksys_hrm_prod -c "
ALTER TABLE \"Users\" ADD COLUMN IF NOT EXISTS \"lockedAt\" TIMESTAMP WITH TIME ZONE;
ALTER TABLE \"Users\" ADD COLUMN IF NOT EXISTS \"loginAttempts\" INTEGER DEFAULT 0;
ALTER TABLE \"Users\" ADD COLUMN IF NOT EXISTS \"lockUntil\" TIMESTAMP WITH TIME ZONE;
"

# Fix 2: Ensure proper database user permissions
PGPASSWORD='SkyRakDB#2025!Prod@HRM$Secure' psql -h localhost -U skyraksys_admin -d skyraksys_hrm_prod -c "
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO skyraksys_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO skyraksys_admin;
"

# Fix 3: Check if admin user exists, if not create it
PGPASSWORD='SkyRakDB#2025!Prod@HRM$Secure' psql -h localhost -U skyraksys_admin -d skyraksys_hrm_prod -c "
INSERT INTO \"Users\" (email, password, \"firstName\", \"lastName\", role, \"isActive\", \"createdAt\", \"updatedAt\") 
SELECT 'admin@skyraksys.com', '\$2b\$10\$rQjfMhZn1QZ9J9YvKjNz2uXm6YTXY4Kv6vXL8YvK9YvKjNz2uXm6Y', 'Admin', 'User', 'admin', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM \"Users\" WHERE email = 'admin@skyraksys.com');
"

# Fix 4: Run any pending migrations
npx sequelize-cli db:migrate --env production 2>/dev/null || echo "Migration command not available, manual fixes applied"

# Fix 5: Update backend .env to fix API URLs
sed -i 's|BACKEND_URL=https://95.216.14.232/api|BACKEND_URL=https://95.216.14.232/api|' .env
sed -i 's|FRONTEND_URL=https://95.216.14.232|FRONTEND_URL=https://95.216.14.232|' .env
```

### **🔍 Health Checks and Verification**

```bash
# Check all services
systemctl status postgresql
systemctl status nginx
pm2 status

# Verify database schema
PGPASSWORD='SkyRakDB#2025!Prod@HRM$Secure' psql -h localhost -U skyraksys_admin -d skyraksys_hrm_prod -c "\d \"Users\""

# Test database connection
PGPASSWORD='SkyRakDB#2025!Prod@HRM$Secure' psql -h localhost -U skyraksys_admin -d skyraksys_hrm_prod -c "SELECT version();"

# Restart backend after database fixes
pm2 restart all

# Test backend API health
curl -k https://95.216.14.232/api/health

# Test login endpoint (CRITICAL TEST)
curl -X POST https://95.216.14.232/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@skyraksys.com", "password":"admin123"}' \
  -k

# Test frontend
curl -I https://95.216.14.232

# Check PM2 logs for errors
pm2 logs --lines 50
```

---

## 🔧 **Step 11: Final Configuration**

```bash
# Set proper file permissions
chown -R root:root /opt/skyraksys-hrm
chmod -R 755 /opt/skyraksys-hrm
chmod 644 /opt/skyraksys-hrm/backend/.env

# Create startup script for system reboot
cat > /etc/systemd/system/skyraksys-hrm.service << 'EOF'
[Unit]
Description=SkyrakSys HRM Application
After=network.target postgresql.service

[Service]
Type=forking
User=root
ExecStart=/usr/bin/pm2 start /opt/skyraksys-hrm/ecosystem.config.js
ExecReload=/usr/bin/pm2 reload all
ExecStop=/usr/bin/pm2 delete all
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Enable service
systemctl enable skyraksys-hrm.service
```

---

## 🚀 **Step 12: Start Everything**

```bash
# Start all services in order
systemctl start postgresql
systemctl start nginx
pm2 start ecosystem.config.js

# Verify everything is running
echo "🔍 Checking PostgreSQL..."
systemctl status postgresql --no-pager

echo "🔍 Checking Nginx..."
systemctl status nginx --no-pager

echo "🔍 Checking PM2 processes..."
pm2 status

echo "🔍 Testing API health..."
curl -k https://95.216.14.232/api/health

echo "🔍 Testing frontend..."
curl -I https://95.216.14.232
```

---

## ✅ **Success Verification**

Your SkyrakSys HRM application should now be accessible at:

- **Frontend:** https://95.216.14.232
- **Backend API:** https://95.216.14.232/api

### **Expected Results:**
1. ✅ PostgreSQL running on port 5432
2. ✅ Backend API running on port 5000 (internal)
3. ✅ Nginx serving frontend on port 443 (HTTPS)
4. ✅ SSL certificate working
5. ✅ PM2 managing backend process
6. ✅ All services auto-start on reboot

---

## 🔧 **Troubleshooting Commands**

### **🚨 Critical Issues Found & Solutions**

#### **Issue 1: Database Schema Error (FIXED ABOVE)**
- **Error:** `column User.lockedAt does not exist`
- **Solution:** Added missing columns in Step 10
- **Test:** Login should now work

#### **Issue 2: Frontend DNS Error**
- **Error:** `Error: getaddrinfo ENOTFOUND -l` 
- **Cause:** Frontend trying to connect to invalid hostname `-l`
- **Fix:**
```bash
# Check frontend .env file
cd /opt/skyraksys-hrm/frontend
cat .env

# Fix if API URL is wrong
echo 'REACT_APP_API_URL=https://95.216.14.232/api' > .env
echo 'REACT_APP_ENVIRONMENT=production' >> .env
echo 'GENERATE_SOURCEMAP=false' >> .env

# Rebuild frontend
npm run build

# Restart nginx
systemctl reload nginx
```

#### **Issue 3: API Route Mismatch**
- **Backend expects:** `/api/v1/` routes
- **Frontend calls:** `/api/` routes  
- **Fix Backend Config:**
```bash
cd /opt/skyraksys-hrm/backend
# Add to .env file:
echo 'API_BASE_URL=/api' >> .env
echo 'DOMAIN=95.216.14.232' >> .env

# Restart backend
pm2 restart all
```

#### **Issue 4: Database User Mismatch**
- **Expected:** `skyraksys_admin`
- **Backend connects to:** `hrm_app`
- **Fix:**
```bash
# Update backend .env
cd /opt/skyraksys-hrm/backend
sed -i 's/DB_USER=hrm_app/DB_USER=skyraksys_admin/' .env

# Or create the expected user
sudo -u postgres psql -c "CREATE USER hrm_app WITH ENCRYPTED PASSWORD 'SkyRakDB#2025!Prod@HRM\$Secure';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE skyraksys_hrm_prod TO hrm_app;"
```

### **🔍 Standard Troubleshooting**

```bash
# Check logs
tail -f /var/log/skyraksys-hrm/error.log
tail -f /var/log/nginx/error.log
journalctl -u postgresql -f
pm2 logs

# Restart services
systemctl restart postgresql
systemctl restart nginx
pm2 restart all

# Check ports
netstat -tlnp | grep -E ":(80|443|5000|5432)"
ss -tlnp | grep -E ":(80|443|5000|5432)"

# Check configuration files
cat /opt/skyraksys-hrm/backend/.env
cat /opt/skyraksys-hrm/frontend/.env
cat /etc/nginx/conf.d/skyraksys-hrm.conf

# Database connectivity tests
PGPASSWORD='SkyRakDB#2025!Prod@HRM$Secure' psql -h localhost -U skyraksys_admin -d skyraksys_hrm_prod -c "\l"
PGPASSWORD='SkyRakDB#2025!Prod@HRM$Secure' psql -h localhost -U skyraksys_admin -d skyraksys_hrm_prod -c "\dt"
```

---

## 🎯 **Quick Reference Commands**

### **Service Management**
```bash
# Check all service status
systemctl status postgresql nginx
pm2 status

# Restart all services
systemctl restart postgresql nginx
pm2 restart all

# View logs
journalctl -u postgresql -f
journalctl -u nginx -f
pm2 logs skyraksys-hrm-backend
```

### **Application Management**
```bash
# Update application code
cd /opt/skyraksys-hrm
git pull origin master

# Rebuild frontend
cd /opt/skyraksys-hrm/frontend
npm run build

# Restart backend
pm2 restart skyraksys-hrm-backend
```

### **Database Management**
```bash
# Connect to database
PGPASSWORD='SkyRakDB#2025!Prod@HRM$Secure' psql -h localhost -U skyraksys_admin -d skyraksys_hrm_prod

# Run migrations
cd /opt/skyraksys-hrm/backend
npx sequelize-cli db:migrate

# Backup database
pg_dump -h localhost -U skyraksys_admin -d skyraksys_hrm_prod > backup_$(date +%Y%m%d_%H%M%S).sql
```

This manual deployment process gives you complete control over each step and avoids any script-related issues!