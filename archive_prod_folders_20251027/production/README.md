# 🏭 SkyRakSys HRM - Production Deployment Configurations

This directory contains all production deployment configurations for different platforms.

---

## 📁 Directory Structure

```
production/
├── redhat-deployment/     # ⭐ Primary: RedHat Enterprise Linux configurations
│   ├── base/             # Base RHEL setup and configs
│   └── prod/             # Production-specific RHEL configs
│
├── windows/              # Windows Server deployment
│   ├── docker/          # Docker Compose for Windows
│   ├── nginx/           # Windows Nginx configuration
│   └── scripts/         # Windows deployment scripts
│
└── unix/                 # General Unix/Linux deployment
    ├── docker/          # Docker Compose for Unix
    ├── nginx/           # Unix Nginx configuration
    └── scripts/         # Unix deployment scripts
```

---

## 🎯 Choose Your Deployment Platform

### RedHat Enterprise Linux / CentOS (Recommended)
**Location**: `redhat-deployment/`

**Best for**:
- Enterprise production environments
- High-security requirements
- Professional support needed

**Start here**: `redhat-deployment/README.md`

**Key Features**:
- Complete RHEL 8+ deployment guide
- SELinux security policies
- Systemd service management
- Comprehensive monitoring
- Automated backups

---

### Windows Server
**Location**: `windows/`

**Best for**:
- Windows-based infrastructure
- IIS integration
- Active Directory authentication

**Start here**: `windows/README.md`

**Key Features**:
- Docker Desktop for Windows
- Windows Service integration
- IIS reverse proxy option
- Windows authentication

---

### General Unix/Linux
**Location**: `unix/`

**Best for**:
- Ubuntu, Debian, or other Linux distributions
- Cloud deployments (AWS, Azure, GCP)
- Containerized deployments

**Start here**: `unix/README.md`

**Key Features**:
- Docker Compose setup
- Shell script automation
- Nginx configuration
- Cloud-ready

---

## 🚀 Quick Deployment Guide

### Prerequisites (All Platforms)
- Node.js 18+ LTS
- PostgreSQL 14+
- Nginx (or equivalent reverse proxy)
- PM2 (for process management)
- Git

### Environment Configuration
All platforms require a `.env.production` file. Templates are provided in each platform directory.

**Key Variables**:
```env
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skyraksys_hrm
DB_USER=hrm_user
DB_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=https://your-domain.com
```

---

## 📊 Production Features

All deployment configurations include:

### Security
- ✅ SSL/TLS encryption
- ✅ JWT authentication
- ✅ Rate limiting
- ✅ SQL injection protection
- ✅ XSS protection
- ✅ CORS configuration

### Performance
- ✅ Process clustering (PM2)
- ✅ Connection pooling
- ✅ Static file caching
- ✅ Gzip compression
- ✅ CDN-ready

### Reliability
- ✅ Auto-restart on crash
- ✅ Graceful shutdown
- ✅ Health check endpoints
- ✅ Error logging
- ✅ Performance monitoring

### Maintenance
- ✅ Automated backups
- ✅ Log rotation
- ✅ Database migrations
- ✅ Zero-downtime updates
- ✅ Rollback capability

---

## 🔐 Server Details & Credentials

### Production Server Information

**IMPORTANT**: All sensitive information (IP addresses, passwords, API keys) should be stored in:
- `.env.production` files (not in git)
- Secure password manager
- Encrypted configuration management system

### Configuration Files Location by Platform

#### RedHat Production Server
All RedHat production server details are in:
- `redhat-deployment/prod/configs/` - Server configurations
- `redhat-deployment/prod/.env.production.template` - Environment template
- `redhat-deployment/prod/RHEL_PRODUCTION_DEPLOYMENT_GUIDE.md` - Server specifications

**Server Specifications Documented**:
- Server hostname and IP
- Database connection details
- SSL certificate information
- Nginx configuration
- PM2 setup
- Systemd service definitions

#### Windows Server
- `windows/.env.production.template`
- `windows/configs/`

#### Unix Server
- `unix/.env.production.template`
- `unix/configs/`

---

## 📋 Deployment Checklist

Before deploying to ANY platform:

### Pre-Deployment
- [ ] Read platform-specific README
- [ ] Server meets minimum specifications
- [ ] All prerequisites installed
- [ ] Firewall rules configured
- [ ] SSL certificates obtained
- [ ] `.env.production` created with correct values
- [ ] Database created and accessible
- [ ] Backup system tested

### Deployment
- [ ] Code deployed to server
- [ ] Dependencies installed (`npm install --production`)
- [ ] Database migrated
- [ ] PM2 configured and started
- [ ] Nginx configured and restarted
- [ ] SSL certificates installed
- [ ] Health checks passing

### Post-Deployment
- [ ] Application accessible via browser
- [ ] Login functionality working
- [ ] API endpoints responding
- [ ] Database connections stable
- [ ] Logs being generated correctly
- [ ] Backups configured and running
- [ ] Monitoring set up
- [ ] Documentation updated

---

## 🚨 Emergency Procedures

### Quick Rollback
```bash
# PM2 rollback
pm2 stop skyraksys-hrm
pm2 delete skyraksys-hrm
cd /path/to/previous/version
pm2 start ecosystem.config.js
```

### Emergency Contacts
- See `redhat-deployment/prod/RHEL_PRODUCTION_DEPLOYMENT_GUIDE.md`
- Check platform-specific troubleshooting guides

---

## 📚 Documentation Index

### Platform-Specific Documentation
- **RedHat**: `redhat-deployment/README.md`
- **Windows**: `windows/README.md`
- **Unix**: `unix/README.md`

### General Documentation
- **Architecture**: `../docs/COMPREHENSIVE_HRM_REVIEW_REPORT.md`
- **API Documentation**: `../backend/README.md` + Swagger UI
- **Deployment Checklist**: `../docs/production/PRODUCTION_DEPLOYMENT_CHECKLIST.md`
- **Production Readiness**: `../docs/production/PRODUCTION_READINESS_REPORT.md`

---

## 🔧 Maintenance

### Regular Maintenance Tasks

#### Daily
- Check application logs
- Verify backups completed
- Monitor system resources

#### Weekly
- Review error logs
- Update dependencies (if needed)
- Test backup restoration

#### Monthly
- Database optimization
- Log cleanup
- Security patches
- Certificate renewal check

### Maintenance Scripts
Each platform directory contains maintenance scripts:
- `backup.sh` / `backup.bat` - Backup script
- `update.sh` / `update.bat` - Update script
- `health-check.sh` / `health-check.bat` - Health check

---

## 📞 Support & Troubleshooting

### Platform-Specific Issues
- **RedHat**: See `redhat-deployment/base/TROUBLESHOOTING.md`
- **Windows**: See `windows/TROUBLESHOOTING.md`
- **Unix**: See `unix/TROUBLESHOOTING.md`

### Common Issues

#### Application Won't Start
1. Check PM2 logs: `pm2 logs`
2. Verify `.env.production` file exists and is correct
3. Check database connectivity
4. Verify Node.js version

#### Database Connection Issues
1. Check PostgreSQL is running
2. Verify credentials in `.env.production`
3. Check firewall rules
4. Test connection: `psql -h HOST -U USER -d DATABASE`

#### Nginx Issues
1. Test config: `nginx -t`
2. Check error logs: `/var/log/nginx/error.log`
3. Verify upstream is running
4. Check SSL certificates

---

## ⚡ Performance Optimization

### Database
- Regular `VACUUM` and `ANALYZE`
- Index optimization
- Connection pool tuning
- Query optimization

### Application
- PM2 cluster mode (multi-core utilization)
- Redis caching (optional)
- Static file CDN
- API response caching

### Web Server
- Nginx caching
- Gzip compression
- HTTP/2 enabled
- Keep-alive connections

---

## 🔒 Security Best Practices

### Must Do
1. ✅ Use HTTPS with valid SSL certificates
2. ✅ Strong JWT secret (min 32 characters)
3. ✅ Strong database password
4. ✅ Firewall configured (allow only necessary ports)
5. ✅ Regular security updates
6. ✅ Rate limiting enabled
7. ✅ Input validation and sanitization
8. ✅ Regular backups with offsite storage

### Should Do
- Security headers (Helmet.js)
- CSRF protection
- Database encryption at rest
- Audit logging
- Intrusion detection
- Vulnerability scanning

---

## 📈 Monitoring & Logging

### Application Monitoring
- **PM2 Built-in**: `pm2 monit`
- **Custom Dashboard**: Setup instructions in platform guides
- **Health Endpoint**: `GET /api/health`

### Log Locations
- **Application**: `logs/` or `/var/log/skyraksys-hrm/`
- **Nginx**: `/var/log/nginx/`
- **PostgreSQL**: `/var/lib/postgresql/data/log/`
- **PM2**: `~/.pm2/logs/`

### Metrics to Monitor
- CPU usage
- Memory usage
- Disk space
- Database connections
- Response times
- Error rates
- User sessions

---

## 🎓 Training Resources

### For System Administrators
1. Read platform-specific deployment guide
2. Review troubleshooting documentation
3. Practice deployment on staging server
4. Learn PM2 commands
5. Understand backup/restore procedures

### For Developers
1. Review `../docs/COMPREHENSIVE_HRM_REVIEW_REPORT.md`
2. Study API documentation (Swagger)
3. Understand database schema
4. Learn deployment workflow
5. Practice with development environment

---

## 📝 Change Log

Track production changes in: `../CHANGELOG.md`

---

## ⚠️ Important Reminders

1. **NEVER** commit `.env.production` files to git
2. **ALWAYS** test on staging before production
3. **BACKUP** before any changes
4. **DOCUMENT** custom configurations
5. **MONITOR** after deployment
6. **COMMUNICATE** with team about changes

---

**Ready to Deploy?**

1. Choose your platform (RedHat recommended)
2. Read platform-specific README
3. Follow deployment guide step-by-step
4. Complete deployment checklist
5. Verify everything works
6. Set up monitoring
7. Document your deployment

**Need Help?**
- Check troubleshooting guides in platform directories
- Review `../docs/production/` documentation
- Create an issue in the repository

---

*Last Updated: October 26, 2025*
*Version: 2.0.0*
