# RedHat Production Folder Audit - October 2025

## Executive Summary

This audit reviews the `redhatprod/` folder to ensure it contains all necessary components for deploying the Skyraksys HRM system on RHEL 9.6 with PostgreSQL, using the latest backend implementation with Sequelize ORM.

**Date**: October 29, 2025  
**Database**: PostgreSQL 17.x (via Sequelize migrations)  
**Backend**: Node.js 22.x with Express.js  
**Current Status**: **REQUIRES UPDATES**

---

## Current State Assessment

### ✅ KEEP - Modern & Correct

1. **Scripts** (`scripts/`)
   - ✅ `01_install_prerequisites.sh` - Installs Node.js 22.x, PostgreSQL, Nginx
   - ✅ `02_setup_database.sh` - Sets up PostgreSQL with secure password management
   - ✅ `03_deploy_application.sh` - Deploys backend and frontend
   - ✅ `04_health_check.sh` - System health monitoring
   - ✅ `05_maintenance.sh` - System maintenance tasks
   - ✅ `06_setup_ssl.sh` - SSL certificate setup
   - ✅ `10_open_firewall_and_selinux.sh` - Firewall and SELinux configuration

2. **Nginx Configuration** (`configs/`)
   - ✅ `nginx-hrm.conf` - Reverse proxy configuration
   - ✅ `nginx-hrm-static.conf` - Static file serving (preferred for production)
   - ⚠️ `nginx-hrm-static.95.216.14.232.conf` - IP-specific config (keep for reference)

3. **Systemd Services** (`systemd/`)
   - ✅ `hrm-backend.service` - Backend service definition
   - ✅ `hrm-frontend.service` - Frontend service definition (if needed)

4. **Environment Templates** (`templates/`)
   - ✅ `.env.production.template` - General production template
   - ⚠️ `.env.95.216.14.232.example` - IP-specific example (keep for reference)
   - ⚠️ `.env.95.216.14.232.prebaked` - Prebaked config (keep for reference)

5. **Maintenance Scripts** (`maintenance/`)
   - ✅ `health_check.sh` - Health monitoring
   - ✅ `database_maintenance.sh` - Database optimization
   - ✅ `backup_verification.sh` - Backup integrity checks
   - ✅ `performance_monitor.sh` - Performance monitoring
   - ✅ `setup_cron.sh` - Automated task setup

6. **Documentation**
   - ✅ `README.md` - Main readme
   - ✅ `RHEL_PRODUCTION_DEPLOYMENT_GUIDE.md` - Comprehensive deployment guide
   - ✅ `BEST_PROD_DEPLOYMENT_FOR_NOVICES.md` - Novice-friendly guide
   - ✅ `QUICK_DEPLOYMENT_CHECKLIST.md` - Quick reference

### ❌ OBSOLETE - Move to `obsolete/` folder

1. **Database SQL Files** (`database/`)
   - ❌ `01_create_schema.sql` - **OBSOLETE**: Uses manual SQL instead of Sequelize migrations
   - ❌ `02_create_indexes.sql` - **OBSOLETE**: Indexes should be in migrations
   - ❌ `03_create_triggers.sql` - **OBSOLETE**: Triggers should be in migrations
   - ❌ `04_insert_sample_data.sql` - **OBSOLETE**: Use Sequelize seeders instead

   **Reason**: The current backend (October 2025) uses **Sequelize ORM** with:
   - Sequelize migrations for schema changes
   - Sequelize seeders for sample data
   - Model-based schema definition
   - No manual SQL schema files needed

2. **Redundant Documentation**
   - ⚠️ `PRODUCTION_DEPLOYMENT_GUIDE_COMPLETE.md` - Redundant with RHEL guide
   - ⚠️ `PRODUCTION_DEPLOYMENT_STEP_BY_STEP.md` - Redundant with RHEL guide
   - ⚠️ `CONFIGURATION_SUMMARY.md` - Outdated information
   - ⚠️ `CORS_CONFIGURATION_VERIFICATION.md` - Specific issue, not general guide
   - ⚠️ `DEPLOYMENT_AUDIT_SUMMARY.md` - Old audit reports
   - ⚠️ `FINAL_DEPLOYMENT_AUDIT_REPORT.md` - Old audit reports
   - ⚠️ `PRODUCTION_SETUP_REVIEW_SUMMARY.md` - Old audit reports
   - ⚠️ `RHEL_DEPLOYMENT_AUDIT_REPORT.md` - Old audit reports
   - ⚠️ `NOVICE_MANUAL_SETUP_GUIDE.md` - Redundant with BEST_PROD_DEPLOYMENT
   - ⚠️ `QUICK_ENV_SETUP_FOR_NOVICES.md` - Redundant with BEST_PROD_DEPLOYMENT

---

## Required Updates

### 1. Database Setup Script Updates

**File**: `scripts/02_setup_database.sh`

**Current Issue**: References obsolete SQL files in `database/` folder

**Required Changes**:
```bash
# REMOVE: Old SQL execution
# psql -U postgres -d $DB_NAME -f ../database/01_create_schema.sql

# ADD: Sequelize migration execution
cd /opt/skyraksys-hrm/backend
npm install
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

**Rationale**: Backend uses Sequelize migrations, not manual SQL files.

### 2. Update .env.production.template

**File**: `templates/.env.production.template`

**Add Missing Variables**:
```env
# Performance Monitoring
ENABLE_STATUS_MONITOR=true
STATUS_MONITOR_PATH=/status

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=/var/log/skyraksys-hrm

# Rate Limiting (from backend)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
BCRYPT_ROUNDS=12
HELMET_ENABLED=true

# Validation
ENABLE_VALIDATION=true
VALIDATION_STRICT_MODE=true
```

### 3. Create New Migration Guide

**New File**: `DATABASE_MIGRATION_GUIDE.md`

Document how Sequelize migrations work:
- How to run migrations on production
- How to create new migrations
- How to rollback migrations
- Migration best practices

---

## Folder Structure (After Cleanup)

```
redhatprod/
├── obsolete/                          # ⬅️ NEW: Archived obsolete files
│   ├── database/                      # Old SQL files
│   ├── CONFIGURATION_SUMMARY.md       # Old docs
│   ├── DEPLOYMENT_AUDIT_SUMMARY.md    # Old audits
│   └── ...                            # Other redundant docs
├── configs/                           # ✅ KEEP: Nginx configurations
│   ├── nginx-hrm.conf
│   ├── nginx-hrm-static.conf
│   └── nginx-hrm-static.95.216.14.232.conf
├── scripts/                           # ✅ KEEP: Deployment scripts (update 02)
│   ├── 01_install_prerequisites.sh
│   ├── 02_setup_database.sh          # ⚠️ NEEDS UPDATE
│   ├── 03_deploy_application.sh
│   ├── 04_health_check.sh
│   ├── 05_maintenance.sh
│   ├── 06_setup_ssl.sh
│   └── 10_open_firewall_and_selinux.sh
├── systemd/                           # ✅ KEEP: Systemd service files
│   ├── hrm-backend.service
│   └── hrm-frontend.service
├── templates/                         # ✅ KEEP: Environment templates (update)
│   ├── .env.production.template       # ⚠️ NEEDS UPDATE
│   ├── .env.95.216.14.232.example
│   └── .env.95.216.14.232.prebaked
├── maintenance/                       # ✅ KEEP: Maintenance scripts
│   ├── health_check.sh
│   ├── database_maintenance.sh
│   ├── backup_verification.sh
│   ├── performance_monitor.sh
│   └── setup_cron.sh
├── README.md                          # ✅ KEEP: Main documentation
├── RHEL_PRODUCTION_DEPLOYMENT_GUIDE.md # ✅ KEEP: Primary deployment guide
├── BEST_PROD_DEPLOYMENT_FOR_NOVICES.md # ✅ KEEP: Novice guide
├── QUICK_DEPLOYMENT_CHECKLIST.md      # ✅ KEEP: Quick reference
└── DATABASE_MIGRATION_GUIDE.md        # ⬅️ NEW: Sequelize migration guide
```

---

## Action Items

### Immediate Actions

1. ✅ Create `obsolete/` folder
2. ⬜ Move obsolete database SQL files to `obsolete/database/`
3. ⬜ Move redundant documentation to `obsolete/docs/`
4. ⬜ Update `scripts/02_setup_database.sh` to use Sequelize migrations
5. ⬜ Update `templates/.env.production.template` with missing variables
6. ⬜ Create `DATABASE_MIGRATION_GUIDE.md`
7. ⬜ Update `README.md` to reference Sequelize migrations
8. ⬜ Test updated scripts on clean RHEL 9.6 system

### Documentation Updates

1. ⬜ Update RHEL_PRODUCTION_DEPLOYMENT_GUIDE.md
   - Remove references to SQL files
   - Add Sequelize migration instructions
   - Add troubleshooting for Sequelize issues

2. ⬜ Update BEST_PROD_DEPLOYMENT_FOR_NOVICES.md
   - Clarify database setup uses Sequelize
   - Add migration examples

3. ⬜ Create SEQUELIZE_PRODUCTION_GUIDE.md
   - How migrations work
   - How seeders work
   - Production best practices

---

## Current Backend Implementation (Reference)

### Sequelize Migrations
Located in: `backend/migrations/`

Key migrations:
- `20250127020000-create-leave-requests.js`
- `20250824000000-create-payslip-template.js`
- `20250917000001-add-weekly-timesheet-columns.js`
- `20251026000001-remove-unique-timesheet-constraint.js`
- `20251027000001-add-performance-indexes.js`

### Sequelize Seeders
Located in: `backend/seeders/`

Default seeders create:
- Admin user (admin@skyraksys.com / admin123)
- Sample departments, positions
- Leave types
- Sample employees
- Demo data for testing

### Database Commands
```bash
# Run migrations
npx sequelize-cli db:migrate

# Run seeders
npx sequelize-cli db:seed:all

# Check migration status
npx sequelize-cli db:migrate:status

# Rollback last migration
npx sequelize-cli db:migrate:undo

# Rollback all migrations
npx sequelize-cli db:migrate:undo:all
```

---

## Verification Checklist

After updates, verify:

- [ ] Fresh RHEL 9.6 installation works with updated scripts
- [ ] Database created successfully via Sequelize migrations
- [ ] Seeders populate sample data correctly
- [ ] Backend starts and connects to database
- [ ] Frontend connects to backend API
- [ ] Nginx serves frontend and proxies API
- [ ] SSL certificate setup works
- [ ] Systemd services start automatically
- [ ] Health checks pass
- [ ] Maintenance scripts execute successfully
- [ ] All documentation is accurate and up-to-date

---

## Conclusion

The `redhatprod/` folder is **mostly current** but requires updates to:

1. **Remove obsolete SQL files** - Backend now uses Sequelize migrations
2. **Update database setup script** - Execute Sequelize migrations instead of SQL files
3. **Update environment template** - Add new configuration variables
4. **Consolidate documentation** - Move redundant docs to obsolete folder
5. **Add Sequelize migration guide** - Document migration workflow

**Priority**: HIGH - The SQL files are actively misleading and will cause deployment failures.

**Estimated Effort**: 2-3 hours to update scripts and documentation.

**Risk**: LOW - Changes are straightforward and well-documented.

---

**Next Steps**: Execute the action items listed above to modernize the production deployment setup.
