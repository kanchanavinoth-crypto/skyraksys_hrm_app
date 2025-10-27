# 🚀 SkyRakSys HRM - Production Setup Guide

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Setup](#quick-setup)
4. [Manual Setup](#manual-setup)
5. [Database Setup](#database-setup)
6. [SSL Configuration](#ssl-configuration)
7. [Docker Deployment](#docker-deployment)
8. [Security Configuration](#security-configuration)
9. [Monitoring & Logging](#monitoring--logging)
10. [Backup & Recovery](#backup--recovery)
11. [Troubleshooting](#troubleshooting)
12. [Maintenance](#maintenance)

## 📌 Overview

This guide provides comprehensive instructions for setting up SkyRakSys HRM in a production environment. The system includes:

- **Backend**: Node.js/Express API server
- **Frontend**: React application with Material-UI
- **Database**: PostgreSQL
- **Caching**: Redis (optional)
- **Web Server**: Nginx (reverse proxy)
- **Process Manager**: PM2
- **Containerization**: Docker support

## 🔧 Prerequisites

### System Requirements

- **Operating System**: Windows Server 2019+, Ubuntu 20.04+, or CentOS 8+
- **CPU**: 2+ cores (4+ recommended)
- **RAM**: 4GB minimum (8GB+ recommended)
- **Storage**: 50GB minimum (SSD recommended)
- **Network**: Public IP address and domain name

### Software Requirements

- **Node.js**: 16.0.0 or higher
- **npm**: 8.0.0 or higher
- **PostgreSQL**: 12.0 or higher
- **Git**: Latest version
- **PM2**: Global installation
- **Nginx**: Latest stable version (optional)
- **Docker**: Latest version (for containerized deployment)

## ⚡ Quick Setup

### Option 1: Automated Setup Script

1. **Download and run the setup script**:
   ```batch
   cd C:\
   git clone https://github.com/yourusername/skyraksys-hrm.git
   cd skyraksys-hrm\PROD
   .\setup-production.bat
   ```

2. **Follow the interactive prompts**:
   - Choose installation method (Git clone/Copy files/Manual)
   - Configure database (PostgreSQL/Docker/Existing)
   - Set up SSL certificates
   - Configure environment variables

3. **Start the application**:
   ```batch
   .\start.bat
   ```

### Option 2: Docker Deployment

1. **Clone repository**:
   ```batch
   git clone https://github.com/yourusername/skyraksys-hrm.git
   cd skyraksys-hrm\PROD\docker
   ```

2. **Configure environment**:
   ```batch
   copy .env.example .env
   # Edit .env with your production values
   ```

3. **Start with Docker Compose**:
   ```batch
   docker-compose -f docker-compose.prod.yml up -d
   ```

## 🔨 Manual Setup

### Step 1: Environment Preparation

1. **Create production directory**:
   ```batch
   mkdir C:\SkyRakSys-HRM-Production
   cd C:\SkyRakSys-HRM-Production
   ```

2. **Create directory structure**:
   ```batch
   mkdir backend frontend database logs uploads config ssl scripts
   ```

### Step 2: Source Code Setup

1. **Clone or copy source code**:
   ```batch
   # Option A: Clone from repository
   git clone https://github.com/yourusername/skyraksys-hrm.git temp
   xcopy temp\backend\* backend\ /E /I /Y
   xcopy temp\frontend\* frontend\ /E /I /Y
   rmdir temp /S /Q

   # Option B: Copy from existing project
   xcopy "path\to\your\project\backend\*" backend\ /E /I /Y
   xcopy "path\to\your\project\frontend\*" frontend\ /E /I /Y
   ```

### Step 3: Dependencies Installation

1. **Install backend dependencies**:
   ```batch
   cd backend
   npm install --production
   cd ..
   ```

2. **Install frontend dependencies and build**:
   ```batch
   cd frontend
   npm install
   npm run build
   cd ..
   ```

### Step 4: Environment Configuration

1. **Create backend environment file**:
   ```batch
   copy config\.env.production.template backend\.env
   ```

2. **Edit backend/.env** with your production values:
   ```env
   NODE_ENV=production
   PORT=8080
   DB_HOST=your-db-host
   DB_NAME=skyraksys_hrm_prod
   DB_USER=hrm_prod_user
   DB_PASSWORD=your-secure-password
   JWT_SECRET=your-jwt-secret-64-characters-minimum
   CORS_ORIGIN=https://yourdomain.com
   ```

3. **Create frontend environment file**:
   ```batch
   echo REACT_APP_API_URL=https://yourdomain.com/api > frontend\.env.production
   echo REACT_APP_ENV=production >> frontend\.env.production
   ```

## 🗄️ Database Setup

### Option 1: Local PostgreSQL

1. **Install PostgreSQL**:
   ```batch
   # Download from: https://www.postgresql.org/download/windows/
   # Or use package manager:
   winget install PostgreSQL.PostgreSQL
   ```

2. **Create database and user**:
   ```sql
   -- Connect as postgres superuser
   psql -U postgres

   -- Create database
   CREATE DATABASE skyraksys_hrm_prod;
   CREATE USER hrm_prod_user WITH ENCRYPTED PASSWORD 'your-secure-password';
   GRANT ALL PRIVILEGES ON DATABASE skyraksys_hrm_prod TO hrm_prod_user;

   -- Grant schema privileges
   \c skyraksys_hrm_prod
   GRANT ALL ON SCHEMA public TO hrm_prod_user;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO hrm_prod_user;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO hrm_prod_user;
   ```

3. **Run migrations and seeds**:
   ```batch
   cd backend
   npm run migrate
   npm run seed
   cd ..
   ```

### Option 2: Docker PostgreSQL

1. **Create docker-compose.yml**:
   ```yaml
   version: '3.8'
   services:
     postgres:
       image: postgres:15-alpine
       environment:
         POSTGRES_DB: skyraksys_hrm_prod
         POSTGRES_USER: hrm_prod_user
         POSTGRES_PASSWORD: your-secure-password
       ports:
         - "5432:5432"
       volumes:
         - postgres_data:/var/lib/postgresql/data
   volumes:
     postgres_data:
   ```

2. **Start PostgreSQL**:
   ```batch
   docker-compose up -d postgres
   ```

### Option 3: Cloud Database

Popular cloud database options:
- **AWS RDS**: Amazon Relational Database Service
- **Azure Database**: Microsoft Azure PostgreSQL
- **Google Cloud SQL**: Google Cloud Platform
- **DigitalOcean Databases**: Managed PostgreSQL

Update your `.env` file with the cloud database connection details.

## 🔒 SSL Configuration

### Option 1: Self-Signed Certificates (Development/Testing)

```batch
# Run the SSL generation script
.\scripts\generate-ssl.bat
# Choose option 1 for self-signed certificates
```

### Option 2: Let's Encrypt (Recommended for Production)

1. **Install Certbot**:
   ```batch
   winget install Certbot.Certbot
   ```

2. **Generate certificate**:
   ```batch
   certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
   ```

3. **Copy certificates**:
   ```batch
   copy "C:\Certbot\live\yourdomain.com\fullchain.pem" ssl\cert.pem
   copy "C:\Certbot\live\yourdomain.com\privkey.pem" ssl\key.pem
   ```

4. **Set up automatic renewal**:
   ```batch
   # Create scheduled task for certificate renewal
   schtasks /create /tn "Certbot Renewal" /tr "certbot renew" /sc daily /st 02:00
   ```

### Option 3: Commercial Certificate

1. Purchase SSL certificate from a trusted CA
2. Generate CSR using the provided script
3. Submit CSR to your CA
4. Install the issued certificate

## 🐳 Docker Deployment

### Complete Docker Setup

1. **Navigate to docker directory**:
   ```batch
   cd docker
   ```

2. **Configure environment**:
   ```batch
   copy .env.example .env
   # Edit .env with your production values
   ```

3. **Build and start services**:
   ```batch
   # Build custom images
   docker-compose -f docker-compose.prod.yml build

   # Start all services
   docker-compose -f docker-compose.prod.yml up -d

   # Start with monitoring tools
   docker-compose -f docker-compose.prod.yml --profile monitoring up -d

   # Start with database tools
   docker-compose -f docker-compose.prod.yml --profile tools up -d
   ```

4. **Verify deployment**:
   ```batch
   # Check service status
   docker-compose -f docker-compose.prod.yml ps

   # View logs
   docker-compose -f docker-compose.prod.yml logs -f

   # Check health
   curl http://localhost/health
   curl http://localhost:8080/health
   ```

### Docker Management Commands

```batch
# Stop all services
docker-compose -f docker-compose.prod.yml down

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Update images
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs [service-name]

# Execute commands in containers
docker-compose -f docker-compose.prod.yml exec backend bash
docker-compose -f docker-compose.prod.yml exec postgres psql -U hrm_prod_user -d skyraksys_hrm_prod
```

## 🛡️ Security Configuration

### Essential Security Settings

1. **Firewall Configuration**:
   ```batch
   # Windows Firewall
   netsh advfirewall firewall add rule name="HTTP" dir=in action=allow protocol=TCP localport=80
   netsh advfirewall firewall add rule name="HTTPS" dir=in action=allow protocol=TCP localport=443
   netsh advfirewall firewall add rule name="SSH" dir=in action=allow protocol=TCP localport=22

   # Block direct access to backend
   netsh advfirewall firewall add rule name="Block Backend" dir=in action=block protocol=TCP localport=8080
   ```

2. **Environment Security**:
   - Use strong, unique passwords
   - Generate secure JWT secrets (64+ characters)
   - Enable HTTPS only
   - Configure CORS properly
   - Set secure session cookies

3. **Database Security**:
   - Use dedicated database user with limited privileges
   - Enable SSL connections
   - Regular security updates
   - Backup encryption

4. **Application Security**:
   ```env
   # Rate limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100

   # Security headers
   HELMET_ENABLED=true
   CORS_CREDENTIALS=true
   SESSION_SECURE=true
   SESSION_HTTP_ONLY=true
   ```

### Security Monitoring

1. **Log Analysis**:
   - Monitor authentication failures
   - Track unusual API access patterns
   - Set up alerts for security events

2. **Regular Security Tasks**:
   - Update dependencies weekly
   - Review access logs daily
   - Backup verification weekly
   - Security scan monthly

## 📊 Monitoring & Logging

### Application Monitoring

1. **PM2 Monitoring**:
   ```batch
   # Monitor processes
   pm2 monit

   # View logs
   pm2 logs

   # Check status
   pm2 status
   ```

2. **Health Checks**:
   ```batch
   # Application health
   curl http://localhost:8080/health

   # Database health
   curl http://localhost:8080/health/db

   # System health
   node scripts\health-check.js
   ```

### Logging Configuration

1. **Application Logs**:
   - Location: `logs/backend/`
   - Rotation: Daily, keep 30 days
   - Levels: error, warn, info, debug

2. **Nginx Logs** (if using):
   - Access log: `logs/nginx/access.log`
   - Error log: `logs/nginx/error.log`

3. **Database Logs**:
   - PostgreSQL logs in standard location
   - Configure log rotation

### Optional: Advanced Monitoring

1. **Prometheus + Grafana**:
   ```batch
   # Start monitoring stack
   docker-compose -f docker-compose.prod.yml --profile monitoring up -d

   # Access Grafana: http://localhost:3001
   # Access Prometheus: http://localhost:9090
   ```

2. **External Monitoring Services**:
   - New Relic
   - DataDog
   - AWS CloudWatch
   - Azure Monitor

## 💾 Backup & Recovery

### Automated Backup Setup

1. **Database Backup Script**:
   ```batch
   # Run backup script
   .\backup.bat

   # Manual database backup
   pg_dump -h localhost -U hrm_prod_user -d skyraksys_hrm_prod > backup_%date%.sql
   ```

2. **File Backup**:
   ```batch
   # Backup uploads directory
   xcopy uploads backups\%date%\uploads\ /E /I /Y

   # Backup configuration
   copy backend\.env backups\%date%\env_backup.txt
   ```

3. **Scheduled Backups**:
   ```batch
   # Create daily backup task
   schtasks /create /tn "HRM Daily Backup" /tr "C:\path\to\backup.bat" /sc daily /st 02:00
   ```

### Recovery Procedures

1. **Database Recovery**:
   ```sql
   -- Restore from backup
   psql -h localhost -U hrm_prod_user -d skyraksys_hrm_prod < backup_file.sql
   ```

2. **Application Recovery**:
   ```batch
   # Stop application
   pm2 stop all

   # Restore files
   xcopy backups\latest\uploads\ uploads\ /E /I /Y

   # Restart application
   pm2 start ecosystem.config.js
   ```

## 🔧 Troubleshooting

### Common Issues

1. **Application Won't Start**:
   ```batch
   # Check logs
   pm2 logs

   # Verify environment
   node -e "console.log(process.env.NODE_ENV)"

   # Test database connection
   cd backend
   node -e "const {sequelize} = require('./models'); sequelize.authenticate().then(() => console.log('Connected')).catch(err => console.error(err));"
   ```

2. **Database Connection Issues**:
   ```batch
   # Test PostgreSQL connection
   psql -h localhost -U hrm_prod_user -d skyraksys_hrm_prod -c "SELECT version();"

   # Check PostgreSQL service
   sc query postgresql-x64-13
   ```

3. **Frontend Not Loading**:
   - Check if build exists: `frontend/build/`
   - Verify nginx configuration
   - Check browser console for errors

4. **SSL Issues**:
   ```batch
   # Test SSL certificate
   openssl x509 -in ssl\cert.pem -text -noout

   # Verify certificate chain
   openssl verify -CAfile ssl\ca.pem ssl\cert.pem
   ```

### Performance Issues

1. **Database Performance**:
   ```sql
   -- Check slow queries
   SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;

   -- Analyze tables
   ANALYZE;

   -- Vacuum tables
   VACUUM;
   ```

2. **Application Performance**:
   ```batch
   # Monitor process resources
   pm2 monit

   # Check memory usage
   tasklist /fi "imagename eq node.exe"
   ```

### Log Analysis

1. **Application Logs**:
   ```batch
   # View recent errors
   findstr "ERROR" logs\backend\*.log

   # Monitor real-time logs
   pm2 logs --lines 100
   ```

2. **System Logs**:
   ```batch
   # Windows Event Viewer
   eventvwr.msc

   # Check system performance
   perfmon.exe
   ```

## 🔄 Maintenance

### Regular Maintenance Tasks

#### Daily Tasks
- [ ] Check application status
- [ ] Review error logs
- [ ] Monitor resource usage
- [ ] Verify backup completion

#### Weekly Tasks
- [ ] Update dependencies
- [ ] Review security logs
- [ ] Check disk space
- [ ] Test backup restore
- [ ] Performance review

#### Monthly Tasks
- [ ] Security audit
- [ ] Database maintenance
- [ ] SSL certificate check
- [ ] Documentation update
- [ ] Disaster recovery test

### Maintenance Scripts

1. **Health Check**:
   ```batch
   # Full system health check
   node scripts\health-check.js
   ```

2. **Database Maintenance**:
   ```sql
   -- Run monthly maintenance
   \i database\scripts\03-maintenance.sql
   ```

3. **Log Cleanup**:
   ```batch
   # Clean old logs (keep 30 days)
   forfiles /p logs /m *.log /d -30 /c "cmd /c del @path"
   ```

4. **Security Update**:
   ```batch
   # Update all dependencies
   cd backend && npm update
   cd ../frontend && npm update
   ```

### Performance Optimization

1. **Database Optimization**:
   - Regular VACUUM and ANALYZE
   - Index optimization
   - Query performance review
   - Connection pooling tuning

2. **Application Optimization**:
   - Memory usage monitoring
   - Response time analysis
   - Cache implementation
   - CDN for static assets

3. **Infrastructure Optimization**:
   - Load balancer configuration
   - Auto-scaling setup
   - Resource monitoring
   - Network optimization

## 📞 Support

### Getting Help

1. **Documentation**: Check this guide and inline comments
2. **Logs**: Always check application and system logs first
3. **Community**: GitHub Issues and discussions
4. **Professional Support**: Contact SkyRakSys support team

### Reporting Issues

When reporting issues, include:
- Operating system and version
- Node.js and npm versions
- Error messages and logs
- Steps to reproduce
- Environment configuration (sanitized)

---

## ✅ Production Checklist

Before going live, ensure:

- [ ] All passwords and secrets are changed from defaults
- [ ] SSL certificates are properly configured
- [ ] Database is secured and backed up
- [ ] Firewall is properly configured
- [ ] Monitoring and logging are set up
- [ ] Performance testing is completed
- [ ] Security audit is conducted
- [ ] Backup and recovery procedures are tested
- [ ] Documentation is updated
- [ ] Team is trained on production procedures

---

**🎉 Congratulations! Your SkyRakSys HRM production environment is ready!**

For support and updates, visit: [https://github.com/skyraksys/hrm-system](https://github.com/skyraksys/hrm-system)
