# 🏭 Production Deployment - RedHat Enterprise Linux

This directory contains all production deployment configurations and documentation for RedHat/RHEL systems.

---

## 📁 Directory Structure

```
production/redhat-deployment/
├── base/                          # Base RedHat configurations
│   ├── QUICK_START.md            # Quick start guide
│   ├── BEGINNER_GUIDE.md         # Beginner's deployment guide
│   ├── TROUBLESHOOTING.md        # Common issues and solutions
│   ├── config/                   # Base configuration files
│   ├── nginx/                    # Nginx configuration
│   ├── scripts/                  # Utility scripts
│   └── systemd/                  # Systemd service files
│
└── prod/                         # Production-specific configs
    ├── RHEL_PRODUCTION_DEPLOYMENT_GUIDE.md          # ⭐ Main deployment guide
    ├── BEST_PROD_DEPLOYMENT_FOR_NOVICES.md         # For beginners
    ├── NOVICE_MANUAL_SETUP_GUIDE.md                # Manual setup steps
    ├── PRODUCTION_DEPLOYMENT_STEP_BY_STEP.md       # Detailed walkthrough
    ├── QUICK_DEPLOYMENT_CHECKLIST.md               # Quick reference
    ├── QUICK_ENV_SETUP_FOR_NOVICES.md             # Environment setup
    ├── CONFIGURATION_SUMMARY.md                    # Config overview
    ├── DEPLOYMENT_AUDIT_SUMMARY.md                 # Deployment audit
    ├── FINAL_DEPLOYMENT_AUDIT_REPORT.md           # Final audit report
    ├── PRODUCTION_SETUP_REVIEW_SUMMARY.md         # Setup review
    ├── CORS_CONFIGURATION_VERIFICATION.md         # CORS setup
    ├── configs/                   # Production configuration files
    ├── database/                  # Database setup and scripts
    ├── maintenance/               # Backup, monitoring, updates
    ├── scripts/                   # Deployment automation
    ├── systemd/                   # Production systemd services
    └── templates/                 # Configuration templates
```

---

## 🚀 Quick Start

### For Experienced Users
```bash
# 1. Review main guide
cat prod/RHEL_PRODUCTION_DEPLOYMENT_GUIDE.md

# 2. Run deployment script
cd prod/scripts
sudo ./deploy.sh

# 3. Verify installation
sudo ./health-check.sh
```

### For Beginners
1. Start with `prod/BEST_PROD_DEPLOYMENT_FOR_NOVICES.md`
2. Follow `prod/PRODUCTION_DEPLOYMENT_STEP_BY_STEP.md`
3. Use `prod/QUICK_DEPLOYMENT_CHECKLIST.md` as reference

---

## 📋 Deployment Guides

### Primary Guides
| Document | Audience | Purpose |
|----------|----------|---------|
| **RHEL_PRODUCTION_DEPLOYMENT_GUIDE.md** | All | Complete production deployment guide |
| **BEST_PROD_DEPLOYMENT_FOR_NOVICES.md** | Beginners | Simplified deployment for new users |
| **PRODUCTION_DEPLOYMENT_STEP_BY_STEP.md** | Intermediate | Detailed step-by-step instructions |
| **NOVICE_MANUAL_SETUP_GUIDE.md** | Beginners | Manual setup without automation |

### Quick References
| Document | Purpose |
|----------|---------|
| **QUICK_DEPLOYMENT_CHECKLIST.md** | Fast deployment checklist |
| **QUICK_ENV_SETUP_FOR_NOVICES.md** | Quick environment setup |

### Configuration & Audit
| Document | Purpose |
|----------|---------|
| **CONFIGURATION_SUMMARY.md** | Overview of all configurations |
| **CORS_CONFIGURATION_VERIFICATION.md** | CORS setup and verification |
| **DEPLOYMENT_AUDIT_SUMMARY.md** | Deployment audit results |
| **FINAL_DEPLOYMENT_AUDIT_REPORT.md** | Final pre-production audit |
| **PRODUCTION_SETUP_REVIEW_SUMMARY.md** | Setup review and validation |

---

## 🗂️ Configuration Files

### `/prod/configs/` - Production Configurations
- **nginx/** - Nginx reverse proxy configuration
  - SSL/TLS certificates setup
  - Load balancing
  - Static file serving
  
- **pm2/** - PM2 process manager configuration
  - Node.js application management
  - Auto-restart and clustering
  - Log management

- **postgresql/** - Database configuration
  - Connection settings
  - Performance tuning
  - Backup configurations

- **.env.production.template** - Environment variables template

### `/prod/database/` - Database Setup
- Initial schema setup scripts
- Migration scripts
- Seed data for production
- Backup and restore scripts

### `/prod/systemd/` - System Services
- `skyraksys-hrm.service` - Main application service
- `skyraksys-postgres.service` - Database service (if applicable)
- `skyraksys-nginx.service` - Web server service

---

## 🔧 Scripts

### Deployment Scripts (`/prod/scripts/`)
- `deploy.sh` - Main deployment script
- `pre-deploy-check.sh` - Pre-deployment validation
- `post-deploy-verify.sh` - Post-deployment verification
- `rollback.sh` - Rollback to previous version

### Maintenance Scripts (`/prod/maintenance/`)
- `backup.sh` - Database and files backup
- `monitor.sh` - System health monitoring
- `update.sh` - Application update script
- `logs-cleanup.sh` - Log rotation and cleanup

### Health Checks
- `health-check.sh` - Comprehensive health check
- `db-check.sh` - Database connectivity check
- `api-check.sh` - API endpoints validation

---

## 🖥️ Server Specifications (Production)

> **Note**: Actual server details (IP addresses, credentials, etc.) are stored in:
> - `.env.production` (not in git)
> - `configs/` with specific server configurations
> - Internal secure documentation

### Recommended Specifications
- **OS**: RedHat Enterprise Linux 8+ or CentOS 8+
- **CPU**: 4+ cores
- **RAM**: 8GB+ (16GB recommended)
- **Storage**: 100GB+ SSD
- **Network**: Static IP with firewall configured

### Required Software
- Node.js 18+ LTS
- PostgreSQL 14+
- Nginx 1.20+
- PM2 (latest)
- Git

---

## 🔐 Security Configuration

### Firewall Rules
```bash
# Open required ports
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --permanent --add-port=5432/tcp  # PostgreSQL (if needed)
sudo firewall-cmd --reload
```

### SELinux Configuration
See `prod/RHEL_PRODUCTION_DEPLOYMENT_GUIDE.md` for SELinux policies.

### SSL/TLS Certificates
- Located in `configs/nginx/ssl/`
- Renewal scripts in `maintenance/ssl-renewal.sh`
- Let's Encrypt recommended for auto-renewal

---

## 📊 Monitoring & Logs

### Application Logs
- **Location**: `/var/log/skyraksys-hrm/`
- **Backend**: `backend.log`, `backend-error.log`
- **Nginx**: `access.log`, `error.log`

### PM2 Monitoring
```bash
pm2 status
pm2 logs skyraksys-hrm
pm2 monit
```

### Database Logs
- **Location**: `/var/lib/postgresql/data/log/`

---

## 🔄 Backup & Recovery

### Automatic Backups
- **Frequency**: Daily at 2 AM
- **Location**: `/backup/skyraksys-hrm/`
- **Retention**: 30 days
- **Script**: `maintenance/backup.sh`

### Manual Backup
```bash
cd /path/to/production/redhat-deployment/prod/maintenance
sudo ./backup.sh manual
```

### Restore
```bash
cd /path/to/production/redhat-deployment/prod/maintenance
sudo ./restore.sh /backup/path/backup-file.tar.gz
```

---

## 🚨 Troubleshooting

### Quick Diagnostics
```bash
# Check application status
pm2 status

# Check application logs
pm2 logs skyraksys-hrm --lines 100

# Check system resources
top
df -h

# Check network
sudo netstat -tulpn | grep -E '(80|443|5000|5432)'

# Check database
sudo -u postgres psql -c "\l"
```

### Common Issues
See `base/TROUBLESHOOTING.md` and `prod/RHEL_PRODUCTION_DEPLOYMENT_GUIDE.md` for detailed troubleshooting.

---

## 📞 Support

### Documentation
- Main guide: `prod/RHEL_PRODUCTION_DEPLOYMENT_GUIDE.md`
- Troubleshooting: `base/TROUBLESHOOTING.md`
- Configuration: `prod/CONFIGURATION_SUMMARY.md`

### Deployment Checklist
Before deploying, complete: `prod/QUICK_DEPLOYMENT_CHECKLIST.md`

---

## ⚠️ Important Notes

1. **Environment Variables**: Always use `.env.production`, never commit to git
2. **Backups**: Verify backups work BEFORE deployment
3. **Testing**: Test on staging server first
4. **Rollback Plan**: Have `rollback.sh` ready before deployment
5. **Monitoring**: Set up monitoring before going live
6. **SSL Certificates**: Ensure valid certificates before HTTPS
7. **Database Migrations**: Run migrations in maintenance window

---

## 📝 Deployment Checklist

- [ ] Read `RHEL_PRODUCTION_DEPLOYMENT_GUIDE.md`
- [ ] Server meets specifications
- [ ] All software installed (Node.js, PostgreSQL, Nginx, PM2)
- [ ] Firewall configured correctly
- [ ] SELinux policies applied
- [ ] `.env.production` configured with production values
- [ ] SSL certificates installed (for HTTPS)
- [ ] Database created and migrated
- [ ] Application deployed and started via PM2
- [ ] Nginx configured and restarted
- [ ] Systemd services enabled
- [ ] Health checks passing
- [ ] Backups configured and tested
- [ ] Monitoring set up
- [ ] Documentation reviewed
- [ ] Team trained on deployment procedures

---

**Ready to Deploy?**

👉 Start here: `prod/RHEL_PRODUCTION_DEPLOYMENT_GUIDE.md`

For questions or issues, refer to documentation or create an issue in the repository.
