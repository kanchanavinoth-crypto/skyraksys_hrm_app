# Skyraksys HRM Production Environment - RHEL 9.6

This directory contains all the necessary components for deploying and maintaining the Skyraksys HRM system on Red Hat Enterprise Linux 9.6 with PostgreSQL 17.x and Sequelize ORM.

**Last Updated:** November 5, 2025  
**Production IP:** 95.216.14.232 (default, configurable)  
**Database:** PostgreSQL 17.x with Sequelize migrations  
**⚠️ CRITICAL UPDATE:** Read [MIGRATION_FIX_NOTICE.md](MIGRATION_FIX_NOTICE.md) and [DEPLOY_UPDATE_REQUIRED.md](DEPLOY_UPDATE_REQUIRED.md) before next deployment

---

## 🚀 Quick Start - One Command Deployment

**Deploy the entire system with a single command:**

```bash
cd /opt/skyraksys-hrm/redhatprod/scripts
sudo bash deploy.sh YOUR_SERVER_IP
```

**Examples:**
```bash
# Using production IP
sudo bash deploy.sh 95.216.14.232

# Using domain
sudo bash deploy.sh hrm.yourcompany.com

# Auto-detect IP (uses production default 95.216.14.232)
sudo bash deploy.sh
```

**What happens automatically:**
- ✅ Generates all configuration files (secrets, nginx, .env)
- ✅ Installs Node.js 22.x, PostgreSQL 17.x, Nginx
- ✅ Sets up database with Sequelize migrations (11 migrations)
- ✅ Optionally seeds demo data with configurable password
- ✅ Deploys backend and frontend
- ✅ Configures and starts systemd services
- ✅ Runs comprehensive health checks
- ✅ Validates database structure (15+ tables, 39 FKs, 574 indexes)

**Time**: 10-15 minutes | **Manual Steps**: ZERO

📘 **See**: `START_HERE.md` and `PRODUCTION_DEPLOYMENT_GUIDE.md` for complete guides

---

## Directory Structure

```
redhatprod/
├── 📘 README.md                            ⭐ This file - Start here!
├── 📘 START_HERE.md                        ⭐ Beginner-friendly deployment guide
├── 📘 PRODUCTION_DEPLOYMENT_GUIDE.md       📖 Comprehensive 1300-line manual
├── 📘 MIGRATION_GUIDE.md                   🗄️ Database migration with reporting (NEW - Nov 4)
├── 📄 DEPLOYMENT_CHEAT_SHEET.txt           📋 Quick command reference
├── 📊 DEPLOYMENT_ARCHITECTURE_DIAGRAM.txt  Visual deployment flow
│
├── scripts/                                🔧 Deployment & Management Scripts
│   ├── deploy.sh                           ⭐ Master orchestrator (one-command deployment)
│   ├── 00_generate_configs.sh              Auto-generates .env & nginx configs
│   ├── 00_generate_configs_auto.sh         Non-interactive config generation
│   ├── 01_install_prerequisites.sh         Node.js 22.x, PostgreSQL 17.x, Nginx
│   ├── 02_setup_database.sh                PostgreSQL + Sequelize migrations
│   ├── 03_deploy_application.sh            Application deployment & build
│   ├── 03_migrate_and_seed_production.sh   🗄️ Migration with before/after reports (NEW)
│   ├── 04_health_check.sh                  System health monitoring
│   ├── 05_maintenance.sh                   System maintenance tasks
│   ├── 06_setup_ssl.sh                     SSL certificate setup (Let's Encrypt/Self-signed)
│   ├── 10_open_firewall_and_selinux.sh     Firewall & SELinux configuration
│   ├── migration-report.sh                 Quick database snapshot utility
│   ├── validate-database.sh                🔍 Database validation (NEW)
│   └── fix_deployment_issues.sh            Troubleshooting & fixes
│
├── configs/                                ⚙️ Nginx Configuration Files
│   ├── nginx-hrm.conf                      Active config (auto-updated by scripts)
│   ├── nginx-hrm.production                Production template (95.216.14.232 default)
│   └── nginx-hrm-static.conf               Static content serving template
│
├── templates/                              📝 Environment Configuration
│   └── .env.production                     Production .env template (95.216.14.232 default)
│
├── systemd/                                🔄 Systemd Service Definitions
│   ├── hrm-backend.service                 Backend Node.js service
│   └── hrm-frontend.service                Frontend React service
│
├── maintenance/                            🛠️ Maintenance & Monitoring
│   ├── health_check.sh                     Comprehensive health monitoring
│   ├── database_maintenance.sh             DB optimization & cleanup
│   ├── backup_verification.sh              Backup integrity validation
│   ├── performance_monitor.sh              Performance metrics collection
│   └── setup_cron.sh                       Automated task scheduler
│
├── database/                               🗄️ Database Utilities (archived SQL files)
│
└── obsolete/                               📦 Archived Documentation
    └── completion-reports-2025/            Historical completion reports (Nov 4 cleanup)
```

---

## Deployment Methods

### Method 1: One-Command (Recommended ⭐)

**Single command deploys everything:**

```bash
cd /opt/skyraksys-hrm/redhatprod/scripts
sudo bash deploy.sh 95.216.14.232
```

This script automatically handles all configuration, installation, and deployment steps.

### Method 2: Database Migration & Validation (NEW)

**After deployment, use these for database operations:**

```bash
# Run migrations with before/after reporting
cd /opt/skyraksys-hrm/redhatprod/scripts
sudo bash 03_migrate_and_seed_production.sh

# Validate database structure and data
sudo bash validate-database.sh

# Quick database snapshot
sudo bash migration-report.sh
```

See `MIGRATION_GUIDE.md` for complete database management.

### Method 3: Step-by-Step (Advanced)

**For users who want more control:**

```bash
cd /opt/skyraksys-hrm/redhatprod/scripts

# Step 1: Generate configs
sudo bash 00_generate_configs.sh 95.216.14.232

# Step 2: Install prerequisites
sudo bash 01_install_prerequisites.sh

# Step 3: Setup database
sudo bash 02_setup_database.sh

# Step 4: Deploy application
sudo bash 03_deploy_application.sh

# Step 5: Health check
sudo bash 04_health_check.sh
```

See `START_HERE.md` for details.

---

## Important: Database Setup

⚠️ **The backend uses Sequelize ORM with migrations** - do not use the old SQL files in `obsolete/database/`.

1. **Prerequisites Installation**
   ```bash
   sudo ./scripts/01_install_prerequisites.sh
   ```

2. **Database Setup** (PostgreSQL + Sequelize migrations)
   ```bash
   sudo ./scripts/02_setup_database.sh
   ```
   This script will:
   - Create PostgreSQL database and user
   - Install backend dependencies
   - Run Sequelize migrations to create schema
   - Run Sequelize seeders to populate sample data

3. **Application Deployment**
   ```bash
   sudo ./scripts/03_deploy_application.sh
   ```

4. **Setup Automated Maintenance**
   ```bash
   sudo ./maintenance/setup_cron.sh
   ```

## Key Features

### Database Management
- **Complete Schema**: 15+ tables with relationships, constraints, and indexes
- **Performance Optimization**: GIN indexes for JSON data, composite indexes for common queries
- **Business Logic**: Triggers for audit logging, validation, and data consistency
- **Sample Data**: Realistic test data including Indian payroll calculations

### Automated Deployment
- **Prerequisites**: Automated installation of Node.js 18.x, PostgreSQL 15, Nginx
- **Database Setup**: Automated database creation, user setup, schema deployment
- **Application Deployment**: Multiple deployment methods (Git, ZIP, local copy)
- **Service Configuration**: Systemd services with security hardening

### Production Configuration
- **Nginx Reverse Proxy**: Rate limiting, compression, security headers
- **SSL Ready**: Easy SSL certificate integration (currently disabled as requested)
- **Service Management**: Systemd units with automatic restart and logging
- **Security**: SELinux compatibility, firewall configuration, user isolation

### Monitoring & Maintenance
- **Health Monitoring**: System resources, service status, database performance
- **Performance Monitoring**: Response times, database connections, query analysis
- **Automated Backups**: Daily database backups with compression and retention
- **Backup Verification**: Automated restore testing and integrity checks
- **Database Maintenance**: VACUUM, ANALYZE, cleanup, optimization
- **Alert System**: Email notifications for critical issues

## Database Schema Overview

The system includes the following main entities:

### Core Tables
- **users**: System authentication and authorization
- **employees**: Employee master data with department relationships
- **departments**: Organizational structure
- **positions**: Job positions and salary structures

### Payroll System
- **payslip_templates**: Configurable payslip templates with Indian compliance
- **payslips**: Generated payslips with calculation results
- **payslip_items**: Individual salary components (earnings/deductions)

### Time & Attendance
- **attendance**: Daily attendance records
- **leaves**: Leave applications and approvals
- **timesheets**: Weekly timesheet submissions
- **timesheet_entries**: Daily time entries with project/task tracking

### Project Management
- **projects**: Project master data
- **tasks**: Task management with time tracking

### Audit & Compliance
- **audit_logs**: Complete audit trail for all data changes

## Security Features

### Application Security
- JWT-based authentication with secure token handling
- Role-based access control (Admin, HR, Manager, Employee)
- Password encryption with bcrypt
- Input validation and sanitization
- SQL injection prevention with Sequelize ORM

### System Security
- SELinux compatibility mode
- Firewall configuration with minimal port exposure
- Service isolation with systemd security features
- File permission restrictions
- User privilege separation

### Data Security
- Database connection encryption
- Audit logging for all data modifications
- Backup encryption ready (implement as needed)
- Secure session management

## Performance Optimization

### Database Performance
- Optimized indexes for common query patterns
- JSON data indexing with GIN indexes
- Connection pooling configuration
- Query optimization for reporting

### Application Performance
- Node.js cluster mode for backend scaling
- React production build optimization
- Nginx compression and caching
- Static asset optimization

### System Performance
- Resource limits for services
- Memory and CPU monitoring
- Automated performance tuning recommendations
- Log rotation and cleanup

## Maintenance Schedule

### Automated Tasks
- **Every 5 minutes**: Health checks and service monitoring
- **Every 15 minutes**: Performance monitoring and alerting
- **Daily 2:00 AM**: Database backup creation
- **Daily 3:00 AM**: Backup verification and integrity testing
- **Weekly Sunday 1:00 AM**: Database maintenance (VACUUM, ANALYZE)
- **Monthly 1st midnight**: System optimization and cleanup

### Manual Tasks
- **Monthly**: Review performance reports and optimization recommendations
- **Quarterly**: Security updates and dependency upgrades
- **Annually**: Disaster recovery testing and documentation updates

## Troubleshooting

### Common Issues
1. **Service Not Starting**: Check systemd logs with `journalctl -u service-name`
2. **Database Connection Issues**: Verify PostgreSQL status and connection strings
3. **High Resource Usage**: Check performance monitoring logs
4. **Backup Failures**: Review backup verification reports
### Frontend ERR_REQUIRE_ESM Issues**: See `PRODUCTION_DEPLOYMENT_GUIDE.md`. Use Nginx to serve static build or pin `serve@14` in systemd.

### Log Locations
- System logs: `/var/log/skyraksys-hrm/`
- Application logs: `/opt/skyraksys-hrm/logs/`
- Service logs: `journalctl -u hrm-backend` or `journalctl -u hrm-frontend`
- Database logs: PostgreSQL logs in `/var/lib/pgsql/17/data/log/`

### Monitoring Tools
- Health check: `sudo ./maintenance/health_check.sh`
- Performance check: `sudo ./maintenance/performance_monitor.sh`
- Database maintenance: `sudo ./maintenance/database_maintenance.sh`
- Backup verification: `sudo ./maintenance/backup_verification.sh`

## Support & Documentation

For detailed deployment instructions, see `PRODUCTION_DEPLOYMENT_GUIDE.md`.

For application documentation, refer to the main project documentation in the parent directory.

---

## 📋 Configuration Audit Summary (November 4, 2025)

### Default Configuration
- **Production IP**: `95.216.14.232` (hardcoded in multiple locations)
- **PostgreSQL Version**: `17.x` (updated from 15.x)
- **Node.js Version**: `22.16.0`
- **Database Name**: `skyraksys_hrm_prod`
- **Database User**: `hrm_app`

### IP Address References
**Total References**: 407 across all files
- ✅ **Scripts**: 250+ references (scripts/*.sh)
- ✅ **Config Files**: 40+ references (configs/nginx-*.conf)
- ✅ **Templates**: 24+ references (templates/.env.production)
- ✅ **Documentation**: 90+ references (*.md files)

### Localhost References  
**Total References**: 15 across scripts and configs
- `localhost:5000` (backend health checks) - 10 references
- `localhost:3000` (frontend health checks) - 5 references
- ✅ **All are for internal health monitoring** (not exposed externally)

### Automation Status
✅ **Fully Automated**:
- Config generation (00_generate_configs.sh, 00_generate_configs_auto.sh)
- IP/Domain replacement throughout all files
- Secret generation (JWT, session keys)
- Database password generation
- Nginx configuration
- Environment file creation
- Migration with reporting (03_migrate_and_seed_production.sh)
- Database validation (validate-database.sh)

✅ **Semi-Automated**:
- SSL setup (06_setup_ssl.sh) - requires domain/certificate choice
- Database seeding - interactive prompts for safety

✅ **Manual**:
- None - all steps can be automated

### Key Scripts Audit
1. **deploy.sh** - Master orchestrator
   - ✅ Auto-detects or uses 95.216.14.232 as default
   - ✅ Calls all sub-scripts in correct order
   - ✅ Comprehensive health checks

2. **00_generate_configs.sh** - Config generator
   - ✅ Replaces IP in all templates
   - ✅ Generates secure secrets
   - ✅ Creates backend .env and nginx config

3. **03_migrate_and_seed_production.sh** (NEW - Nov 4)
   - ✅ Before/after database reports
   - ✅ Migration tracking
   - ✅ Optional demo data seeding
   - ✅ Uses SEED_DEFAULT_PASSWORD from env

4. **validate-database.sh** (NEW - Nov 4)
   - ✅ Validates 15+ required tables
   - ✅ Checks 39 foreign keys
   - ✅ Verifies 574 indexes
   - ✅ Validates seed data integrity
   - ✅ Exit code 0 (pass) / 1 (fail)

### Migration Files Audit
**Total**: 11 migrations in backend/migrations/
1. ✅ create-initial-schema.js
2. ✅ add-timestamps.js
3. ✅ add-unique-constraints.js
4. ✅ add-indexes.js
5. ✅ create-leave-requests.js
6. ✅ create-payslip-template.js
7. ✅ add-weekly-timesheet-columns.js
8. ✅ remove-unique-timesheet-constraint.js
9. ✅ add-performance-indexes.js
10. ✅ add-cascade-deletes.js
11. ✅ add-audit-fields.js

**Status**: All migrations tested and production-ready

### Environment Variables Audit
**Template**: `templates/.env.production`
- ✅ 100+ environment variables configured
- ✅ Default IP: 95.216.14.232
- ✅ Database credentials
- ✅ JWT secrets (auto-generated)
- ✅ CORS origins configured
- ✅ SEED_DEFAULT_PASSWORD support (NEW)
- ✅ BCRYPT_ROUNDS (default: 12)
- ✅ Email/SMTP configuration
- ✅ File upload configuration
- ✅ Session configuration

### Nginx Configuration Audit
**Template**: `configs/nginx-hrm.production`
- ✅ Default server_name: 95.216.14.232
- ✅ Reverse proxy to backend (port 5000)
- ✅ Reverse proxy to frontend (port 3000)
- ✅ API routes (/api/*)
- ✅ Static file serving
- ✅ WebSocket support (socket.io)
- ✅ Security headers configured
- ✅ Rate limiting enabled
- ✅ CORS headers
- ✅ SSL/TLS ready (commented out, enable via 06_setup_ssl.sh)

### Security Audit
✅ **Implemented**:
- Password hashing (bcrypt, 12 rounds)
- JWT authentication
- Session security
- CORS protection
- Rate limiting
- SQL injection prevention (Sequelize ORM)
- XSS protection headers
- File upload validation
- Environment variable protection

⚠️ **Recommendations**:
- Enable SSL/TLS in production (run 06_setup_ssl.sh)
- Rotate secrets regularly
- Implement IP whitelisting if needed
- Enable fail2ban for brute force protection
- Regular security updates (automated via 05_maintenance.sh)

### Testing Status
✅ **Local Testing Complete** (Nov 4):
- Structure validation: PASSED (15 tables, 39 FKs, 574 indexes)
- Data validation: PASSED (all seed data present)
- Operations test: PASSED (15/15 tests - SELECT, INSERT, UPDATE, DELETE, FK, Transactions)
- Integrity check: PASSED (0 orphaned records)

🚀 **Production Ready**: All validations passed locally, safe for production deployment



## Environment Variables

Key environment variables for production:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skyraksys_hrm_prod
DB_USER=hrm_app
DB_PASS=secure_password_here

# Application
NODE_ENV=production
PORT=3001
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here

# Email (for notifications)
SMTP_HOST=your_smtp_server
SMTP_PORT=587
SMTP_USER=your_email@domain.com
SMTP_PASS=your_email_password
```

## Backup & Recovery

### Backup Strategy
- **Daily automated backups** with 30-day retention
- **Compressed storage** to minimize disk usage
- **Integrity verification** with automated restore testing
- **Multiple backup locations** (implement as needed)

### Recovery Procedures
1. **Database Recovery**: Use latest verified backup with `psql`
2. **Application Recovery**: Redeploy from Git repository or backup
3. **Configuration Recovery**: Restore from `/opt/skyraksys-hrm/configs/`
4. **Data Recovery**: Follow procedures in deployment guide

## Scalability Considerations

### Horizontal Scaling
- **Database**: PostgreSQL read replicas for reporting
- **Application**: Multiple backend instances behind load balancer
- **Static Assets**: CDN integration for frontend assets

### Vertical Scaling
- **Memory**: Increase PostgreSQL shared_buffers and work_mem
- **CPU**: Enable Node.js cluster mode
- **Storage**: SSD storage for database and application data

---

**Note**: This production environment is configured for RHEL 9.6 without SSL as requested. For SSL/TLS implementation, update the Nginx configuration and obtain appropriate certificates.