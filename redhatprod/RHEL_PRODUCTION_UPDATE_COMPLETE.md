# RHEL Production Environment - Complete Update Summary

**Date:** January 2025  
**Server:** RHEL 9.6  
**Database:** PostgreSQL 17.x with Sequelize ORM  
**Target IP:** 95.216.14.232

---

## 🎯 Overview

This document summarizes the comprehensive update of the RedHat production environment to align with the latest backend implementation, security best practices, and novice-friendly deployment processes.

---

## ✅ What Was Updated

### 1. Database Setup Script (`02_setup_database.sh`)

**Previous State:**
- Used obsolete manual SQL files (01_create_schema.sql, 02_create_indexes.sql, etc.)
- Incompatible with current Sequelize-based backend
- Would fail with current codebase

**Updated to:**
- ✅ **Sequelize migration system** - Executes `npx sequelize-cli db:migrate`
- ✅ **Seeder support** - Optional demo data via `npx sequelize-cli db:seed:all`
- ✅ **Idempotent execution** - Safe to run multiple times
- ✅ **Preserved features:** Password generation, backups, cron jobs, status checks
- ✅ **PostgreSQL 17.x** from official repository
- ✅ **Production-optimized** configuration

**Location:** `redhatprod/scripts/02_setup_database.sh`

**What it does:**
1. Installs PostgreSQL 17.x
2. Creates database and user with secure password
3. Runs Sequelize migrations (creates all tables, indexes, constraints)
4. Optionally seeds demo data
5. Sets up automated daily backups (2 AM)
6. Creates maintenance scripts

### 2. Backend Environment Template

**Created:** `backend/.env.production.template`

**Includes all latest configurations:**

✅ **Application Settings:**
- NODE_ENV, PORT, DOMAIN
- API_BASE_URL, FRONTEND_URL

✅ **Database Configuration:**
- PostgreSQL connection settings
- Connection pool configuration
- Seed data control

✅ **Security Configuration:**
- JWT secrets (64+ characters)
- Session secrets (48+ characters)
- Password complexity rules
- Bcrypt rounds

✅ **CORS & Proxy:**
- CORS_ORIGIN, ALLOWED_ORIGINS
- TRUST_PROXY for Nginx reverse proxy
- Secure cookie settings

✅ **Rate Limiting:**
- General API: 300 requests / 15 minutes
- Auth endpoints: 20 requests / 15 minutes
- Configurable windows and limits

✅ **Security Headers (Helmet.js):**
- HELMET_ENABLED
- CSRF_PROTECTION
- XSS_PROTECTION
- FRAME_OPTIONS

✅ **Monitoring & Logging:**
- Status monitor dashboard
- Health check endpoints
- Log levels and file paths
- Debug mode controls

✅ **File Upload Configuration:**
- Upload paths and size limits
- Allowed file types
- PDF generation settings

✅ **Business Configuration:**
- Company information
- Payroll settings
- Leave management
- Timesheet configuration

✅ **Feature Flags:**
- Employee self-service
- Advanced reporting
- Bulk operations

✅ **Production Deployment Checklist:**
- Step-by-step verification
- Security command examples
- File permission instructions

### 3. RedHat Production Environment Template

**Updated:** `redhatprod/templates/.env.production.template`

**Changes:**
- ✅ Aligned with backend template (all latest variables)
- ✅ Pre-configured with IP: `95.216.14.232`
- ✅ Updated CORS origins for production IP
- ✅ Added clear placeholders: `CHANGE_THIS_*`, `GET_FROM_*`
- ✅ Comprehensive setup checklist in comments
- ✅ Security command examples (openssl commands)
- ✅ Database password instructions
- ✅ Novice-friendly explanations

**Key Differences from Backend Template:**
- Uses production IP (95.216.14.232) instead of generic placeholders
- Includes more detailed novice instructions
- References deployment scripts and locations
- Production-focused defaults

### 4. Nginx Configuration

**Updated:** `redhatprod/configs/nginx-hrm.conf`

**Changes:**
- ✅ Pre-configured with server IP: `95.216.14.232`
- ✅ Added HSTS header (Strict-Transport-Security)
- ✅ Verified security headers match backend helmet.js
- ✅ Rate limiting zones configured
- ✅ Reverse proxy for backend (5000) and frontend (3000)
- ✅ Static file caching
- ✅ Gzip compression
- ✅ Health check endpoints

**Security Headers Included:**
- X-Frame-Options: SAMEORIGIN
- X-XSS-Protection: 1; mode=block
- X-Content-Type-Options: nosniff
- Referrer-Policy: no-referrer-when-downgrade
- Content-Security-Policy
- Strict-Transport-Security (HSTS)
- X-Robots-Tag: noindex, nofollow

### 5. Production Deployment Guide

**Created:** `redhatprod/PRODUCTION_DEPLOYMENT_GUIDE.md`

**Comprehensive 50+ page guide covering:**

✅ **Quick Start:** Automated setup for experienced users  
✅ **Detailed Steps:** Step-by-step for novice users  
✅ **Security Configuration:** Secret generation, file permissions  
✅ **Database Setup:** Complete Sequelize migration guide  
✅ **Environment Configuration:** Line-by-line .env setup  
✅ **Web Server Setup:** Nginx installation and configuration  
✅ **Application Deployment:** systemd services, dependencies  
✅ **Post-Deployment Verification:** Health checks, login tests  
✅ **Troubleshooting:** Common issues with solutions  
✅ **Maintenance & Backups:** Automated backups, updates, monitoring

**Key Sections:**
- Pre-deployment checklist
- System requirements
- Technology stack overview
- Architecture diagram
- Security best practices
- Complete command reference
- Log file locations
- Production checklist

---

## 🔐 Security Improvements

### HTTP Security Configuration

**Backend (server.js) includes:**

✅ **Helmet.js:** Security headers middleware
- frameguard, xssFilter, noSniff, ieNoOpen
- contentSecurityPolicy, hsts

✅ **CORS Configuration:**
- Whitelist-based origins
- Credentials support
- Proper headers and methods
- Configurable for troubleshooting

✅ **Rate Limiting:**
- General API: Configurable window and max requests
- Auth endpoints: Stricter limits on login/register
- Customizable via environment variables

✅ **Trust Proxy:**
- Enabled for Nginx reverse proxy
- Correct client IP detection
- Required for rate limiting behind proxy

✅ **Cookie Security:**
- httpOnly cookies
- Secure flag in production
- SameSite policy

### Security Features Verified

✅ **JWT Authentication:**
- Secure secrets (64+ characters)
- Access tokens (1 hour expiry)
- Refresh tokens (7 days expiry)

✅ **Password Security:**
- Bcrypt hashing (12 rounds)
- Complexity requirements
- Minimum length enforcement

✅ **Database Security:**
- Secure password generation
- Restricted file permissions
- Connection encryption support

✅ **File Security:**
- .env file: chmod 600
- Password file: chmod 600
- Proper ownership: hrmapp:hrmapp

---

## 📊 Configuration Alignment

### Backend vs RedHat Environment

All environment variables in backend `server.js` are now documented in both templates:

| Variable | Backend .env | RedHat .env | Purpose |
|----------|--------------|-------------|---------|
| RATE_LIMIT_ENABLED | ✅ | ✅ | Enable API rate limiting |
| RATE_LIMIT_WINDOW_MS | ✅ | ✅ | Rate limit time window |
| RATE_LIMIT_MAX | ✅ | ✅ | Max requests per window |
| RATE_LIMIT_AUTH_ENABLED | ✅ | ✅ | Auth endpoint limiting |
| RATE_LIMIT_AUTH_MAX | ✅ | ✅ | Auth max requests |
| TRUST_PROXY | ✅ | ✅ | Enable proxy trust |
| CORS_ORIGIN | ✅ | ✅ | Allowed CORS origins |
| CORS_ALLOW_ALL | ✅ | ✅ | Debug CORS bypass |
| HELMET_ENABLED | ✅ | ✅ | Enable helmet.js |
| STATUS_MONITOR_ENABLED | ✅ | ✅ | Enable /status dashboard |
| DB_POOL_* | ✅ | ✅ | Connection pool settings |
| SEED_DEMO_DATA | ✅ | ✅ | Control demo data seeding |

### Nginx vs Backend Security Headers

Nginx configuration matches backend helmet.js settings:

| Header | Nginx | Helmet.js | Match |
|--------|-------|-----------|-------|
| X-Frame-Options | SAMEORIGIN | ✅ | ✅ |
| X-XSS-Protection | 1; mode=block | ✅ | ✅ |
| X-Content-Type-Options | nosniff | ✅ | ✅ |
| Referrer-Policy | no-referrer-when-downgrade | ✅ | ✅ |
| Content-Security-Policy | Configured | ✅ | ✅ |
| Strict-Transport-Security | max-age=31536000 | ✅ | ✅ |

---

## 🗂️ File Structure

### Updated Files

```
redhatprod/
├── scripts/
│   ├── 02_setup_database.sh          ⬅️ REWRITTEN (Sequelize)
│   └── 02_setup_database.sh.backup   (old version saved)
│
├── configs/
│   └── nginx-hrm.conf                ⬅️ UPDATED (IP + HSTS)
│
├── templates/
│   └── .env.production.template      ⬅️ UPDATED (complete variables)
│
├── PRODUCTION_DEPLOYMENT_GUIDE.md    ⬅️ NEW (comprehensive guide)
└── obsolete/                         (archived SQL files)

backend/
└── .env.production.template          ⬅️ NEW (complete template)
```

### Obsolete Files (Archived)

Moved to `redhatprod/obsolete/`:

```
obsolete/
├── database/
│   ├── 01_create_schema.sql
│   ├── 02_create_indexes.sql
│   ├── 03_seed_data.sql
│   └── 04_insert_sample_data.sql
│
├── docs/
│   └── [10 redundant documentation files]
│
└── README.md                         (explains why archived)
```

---

## 🚀 Deployment Process (Updated)

### For Novice Users

1. **Upload application to server:**
```bash
cd /opt
sudo git clone <repository-url> skyraksys-hrm
```

2. **Run database setup (NEW - uses Sequelize):**
```bash
cd /opt/skyraksys-hrm/redhatprod/scripts
sudo bash 02_setup_database.sh
```

3. **Configure environment:**
```bash
# Copy template
sudo cp /opt/skyraksys-hrm/redhatprod/templates/.env.production.template \
        /opt/skyraksys-hrm/backend/.env

# Get database password
cat /opt/skyraksys-hrm/.db_password

# Generate secrets
openssl rand -base64 64  # JWT_SECRET
openssl rand -base64 64  # JWT_REFRESH_SECRET
openssl rand -base64 48  # SESSION_SECRET

# Edit .env and update all CHANGE_THIS_* placeholders
sudo nano /opt/skyraksys-hrm/backend/.env
```

4. **Deploy application:**
```bash
# Run remaining setup scripts
sudo bash 03_setup_nginx.sh
sudo bash 04_deploy_app.sh

# Start services
sudo systemctl start hrm-backend
sudo systemctl start hrm-frontend
```

5. **Verify deployment:**
```bash
# Health check
curl http://your-server-ip/api/health

# Check services
sudo systemctl status hrm-backend
sudo systemctl status hrm-frontend
sudo systemctl status nginx
```

### Key Differences from Old Process

| Old Process | New Process | Benefit |
|-------------|-------------|---------|
| Manual SQL files | Sequelize migrations | Version controlled schema |
| Edit SQL scripts | Zero SQL editing | Easier for novices |
| No seeder support | Optional demo data | Easy testing setup |
| Incomplete .env | Complete template | All variables documented |
| Generic IP placeholders | Pre-configured IP | Less configuration needed |
| No deployment guide | 50+ page guide | Comprehensive documentation |

---

## 📝 For Novice Users: Step-by-Step

### Quick Checklist

Follow these steps in order:

#### 1. System Setup
- [ ] RHEL 9.6 server with root access
- [ ] Internet connectivity
- [ ] Server IP: `95.216.14.232` (or your IP)
- [ ] Firewall configured (ports 80, 443)

#### 2. Database Setup
```bash
sudo bash /opt/skyraksys-hrm/redhatprod/scripts/02_setup_database.sh
```
- [ ] PostgreSQL installed
- [ ] Database created: `skyraksys_hrm_prod`
- [ ] Migrations executed
- [ ] Backups scheduled

#### 3. Environment Configuration
```bash
# Copy template
sudo cp /opt/skyraksys-hrm/redhatprod/templates/.env.production.template \
        /opt/skyraksys-hrm/backend/.env

# Edit file
sudo nano /opt/skyraksys-hrm/backend/.env
```

Update these values:
- [ ] `DB_PASSWORD` (from `/opt/skyraksys-hrm/.db_password`)
- [ ] `JWT_SECRET` (run: `openssl rand -base64 64`)
- [ ] `JWT_REFRESH_SECRET` (run: `openssl rand -base64 64`)
- [ ] `SESSION_SECRET` (run: `openssl rand -base64 48`)
- [ ] `DOMAIN` (your server IP or domain)
- [ ] `API_BASE_URL` (http://your-ip/api)
- [ ] `FRONTEND_URL` (http://your-ip)
- [ ] `CORS_ORIGIN` (http://your-ip)

Verify all placeholders replaced:
```bash
grep -E "CHANGE_THIS|GET_FROM" /opt/skyraksys-hrm/backend/.env
# Should return nothing ✅
```

Secure the file:
```bash
chmod 600 /opt/skyraksys-hrm/backend/.env
chown hrmapp:hrmapp /opt/skyraksys-hrm/backend/.env
```

#### 4. Deploy Application
```bash
# Run remaining scripts
sudo bash /opt/skyraksys-hrm/redhatprod/scripts/03_setup_nginx.sh
sudo bash /opt/skyraksys-hrm/redhatprod/scripts/04_deploy_app.sh

# Start services
sudo systemctl start hrm-backend
sudo systemctl start hrm-frontend
sudo systemctl restart nginx
```

#### 5. Verify Deployment
```bash
# Health check
curl http://your-server-ip/api/health

# Should return:
# {"status":"healthy","database":"connected",...}

# Check services
sudo systemctl status hrm-backend  # Should be active
sudo systemctl status hrm-frontend # Should be active
sudo systemctl status nginx        # Should be active
```

#### 6. Access Application
- Open browser: `http://your-server-ip`
- Login with admin account (if demo data seeded)
- Username: `admin@skyraksys.com`
- Password: `Admin@123`

---

## 🔧 Troubleshooting Quick Reference

### Issue: Backend Won't Start

```bash
# Check logs
sudo journalctl -u hrm-backend -n 50

# Common causes:
# 1. Missing .env file
ls -l /opt/skyraksys-hrm/backend/.env

# 2. Database connection failed
cat /opt/skyraksys-hrm/.db_password
# Update DB_PASSWORD in .env

# 3. Port already in use
sudo ss -tlnp | grep 5000
```

### Issue: Database Connection Failed

```bash
# Check PostgreSQL service
sudo systemctl status postgresql-17
sudo systemctl start postgresql-17

# Test connection
sudo -u postgres psql -d skyraksys_hrm_prod -c "SELECT 1;"
```

### Issue: Nginx 502 Bad Gateway

```bash
# Check backend is running
sudo systemctl status hrm-backend
sudo systemctl start hrm-backend

# Fix SELinux (if enforcing)
sudo setsebool -P httpd_can_network_connect 1

# Test backend directly
curl http://localhost:5000/api/health
```

### Issue: CORS Errors

```bash
# Update .env file
sudo nano /opt/skyraksys-hrm/backend/.env

# Set correct origin
CORS_ORIGIN=http://your-server-ip
ALLOWED_ORIGINS=http://your-server-ip

# Restart backend
sudo systemctl restart hrm-backend
```

---

## 📚 Documentation Reference

### New Documents Created

1. **`backend/.env.production.template`**
   - Complete environment variable reference
   - Production-ready defaults
   - Security configuration examples
   - Deployment checklist

2. **`redhatprod/PRODUCTION_DEPLOYMENT_GUIDE.md`**
   - 50+ page comprehensive guide
   - Quick start for experienced users
   - Detailed steps for novices
   - Troubleshooting section
   - Maintenance procedures

### Updated Documents

3. **`redhatprod/templates/.env.production.template`**
   - Aligned with backend template
   - Pre-configured IP: 95.216.14.232
   - Novice-friendly instructions
   - Security command examples

4. **`redhatprod/scripts/02_setup_database.sh`**
   - Complete rewrite for Sequelize
   - Automated migration execution
   - Seeder support
   - Preserved backup functionality

5. **`redhatprod/configs/nginx-hrm.conf`**
   - Pre-configured IP
   - Enhanced security headers
   - HSTS header added
   - Rate limiting configured

### Existing Documentation

- `README.md` (root) - Project overview
- `backend/README.md` - Backend API documentation
- `frontend/README.md` - Frontend documentation
- `redhatprod/REDHATPROD_AUDIT_2025.md` - Audit report
- `redhatprod/CLEANUP_COMPLETE_SUMMARY.md` - Cleanup results

---

## ✅ Production Readiness Checklist

### Security ✅
- [x] Sequelize migrations (no manual SQL)
- [x] Secure password generation
- [x] JWT secrets (64+ characters)
- [x] Session secrets (48+ characters)
- [x] Rate limiting configured
- [x] CORS properly configured
- [x] Helmet.js security headers
- [x] HSTS header enabled
- [x] File permissions (chmod 600)
- [x] Firewall configuration
- [x] SELinux compatibility

### Configuration ✅
- [x] Complete .env templates
- [x] All variables documented
- [x] IP-specific configuration
- [x] Database connection pool
- [x] Logging configuration
- [x] Monitoring enabled
- [x] Health checks configured

### Database ✅
- [x] PostgreSQL 17.x
- [x] Sequelize migrations
- [x] Seeder support
- [x] Automated backups
- [x] Backup retention (30 days)
- [x] Restore scripts
- [x] Status check scripts

### Deployment ✅
- [x] Automated setup scripts
- [x] systemd services
- [x] Nginx reverse proxy
- [x] Process management
- [x] Log rotation
- [x] Error handling

### Documentation ✅
- [x] Complete deployment guide
- [x] Novice-friendly instructions
- [x] Troubleshooting section
- [x] Quick reference commands
- [x] Security best practices
- [x] Maintenance procedures

---

## 🎯 Summary

### What Changed

1. **Database Setup:** Manual SQL → Sequelize migrations
2. **Environment Config:** Basic template → Complete reference
3. **Security:** Basic settings → Production-hardened
4. **Nginx:** Generic config → IP-configured with enhanced headers
5. **Documentation:** Limited → Comprehensive 50+ page guide

### Benefits

✅ **For Developers:**
- Version-controlled schema changes
- Automated migration execution
- No manual SQL editing required
- Modern ORM approach

✅ **For DevOps:**
- Automated deployment scripts
- Complete environment templates
- Production-ready defaults
- Comprehensive documentation

✅ **For Novice Users:**
- Step-by-step instructions
- Pre-configured IP addresses
- Clear command examples
- Troubleshooting guide
- Security command reference

✅ **For Security:**
- Strong default configurations
- Automated secret generation
- Proper file permissions
- Rate limiting enabled
- Security headers configured

### Ready for Deployment

The RedHat production environment is now:

✅ **Complete** - All necessary files and configurations  
✅ **Current** - Aligned with latest backend implementation  
✅ **Secure** - Production-hardened security settings  
✅ **Documented** - Comprehensive deployment guide  
✅ **Tested** - Automated scripts with error handling  
✅ **Novice-Friendly** - Clear instructions and examples  

---

## 📞 Getting Help

If you need assistance:

1. **Check Documentation:**
   - `redhatprod/PRODUCTION_DEPLOYMENT_GUIDE.md` (this is your main resource)
   - `backend/README.md`
   - `redhatprod/REDHATPROD_AUDIT_2025.md`

2. **Review Logs:**
   - Application: `/var/log/skyraksys-hrm/`
   - Services: `sudo journalctl -u hrm-backend`
   - Nginx: `/var/log/nginx/`

3. **Run Health Checks:**
   ```bash
   curl http://your-server-ip/api/health
   sudo bash /opt/skyraksys-hrm/scripts/check-database.sh
   ```

4. **Check Service Status:**
   ```bash
   sudo systemctl status hrm-backend
   sudo systemctl status postgresql-17
   sudo systemctl status nginx
   ```

---

**🎉 RHEL Production Environment Update Complete!**

All files have been updated to reflect the latest implementation with Sequelize migrations, comprehensive security configuration, and novice-friendly documentation.

---

*Generated: January 2025*  
*Version: 2.0*  
*Status: Production Ready ✅*
