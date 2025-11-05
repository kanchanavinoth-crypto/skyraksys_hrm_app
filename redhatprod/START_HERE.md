# 🚀 START HERE - RHEL Production Setup

**Quick Guide for System Administrators**

---

## What You Have

Your RedHat production folder now contains everything needed for a production deployment:

```
redhatprod/
├── 📘 PRODUCTION_DEPLOYMENT_GUIDE.md    ⭐ Detailed guide
├── 📋 RHEL_PRODUCTION_UPDATE_COMPLETE.md (detailed change summary)
├── scripts/
│   ├── 🎯 deploy.sh                     ⭐ ONE-COMMAND DEPLOYMENT!
│   ├── 00_generate_configs.sh           (automatic config generation)
│   ├── 01_install_prerequisites.sh      (Node.js, PostgreSQL, Nginx)
│   └── 02-06_*.sh                       (setup scripts)
├── configs/                              (Nginx configuration)
├── templates/                            (.env configuration templates)
└── systemd/                              (service definitions)
```

---

## 🎯 RECOMMENDED: One-Command Deployment

**Deploy everything with a single command!**

```bash
# On your RHEL 9.6 server
cd /opt
sudo git clone <your-repository> skyraksys-hrm
cd skyraksys-hrm/redhatprod/scripts

# Deploy with your server IP (that's it!)
sudo bash deploy.sh 95.216.14.232
```

**What happens automatically:**
- ✅ Generates all configuration files (secrets, nginx, .env)
- ✅ Installs Node.js 22.16, PostgreSQL 17, Nginx
- ✅ Sets up database with Sequelize migrations
- ✅ Deploys backend and frontend applications
- ✅ Configures and starts systemd services
- ✅ Opens firewall ports
- ✅ Runs health checks
- ✅ Shows deployment summary

**Result**: Fully working HRM system in ~10-15 minutes!

---

## Alternative: Step-by-Step Deployment

For advanced users who want more control:

### 1️⃣ Upload Application

```bash
# On your RHEL 9.6 server
cd /opt
sudo git clone <your-repository> skyraksys-hrm
cd skyraksys-hrm
```

### 2️⃣ Generate Configurations

```bash
cd redhatprod/scripts

# Auto-generate ALL configuration files with your IP
sudo bash 00_generate_configs.sh 95.216.14.232

# All configs are now ready:
# ✅ .env file with JWT/session secrets auto-generated
# ✅ nginx config with your IP configured
# ✅ Database password from .db_password file
# ✅ CORS origins set correctly
# ✅ All 100+ variables configured
```

### 3️⃣ Run Setup Scripts

```bash
# Install system dependencies (Node.js, PostgreSQL, Nginx)
sudo bash 01_install_prerequisites.sh

# Setup database (creates DB, runs Sequelize migrations)
sudo bash 02_setup_database.sh

# Deploy application (uses auto-generated .env)
sudo bash 03_deploy_application.sh

# Start services (automatically configured)
sudo bash 04_health_check.sh

# Verify
curl http://95.216.14.232/api/health
```

**🎉 Done! No manual configuration editing required!**

---

## 📖 Detailed Documentation

For step-by-step instructions, see:

**📘 `PRODUCTION_DEPLOYMENT_GUIDE.md`** - Complete deployment guide with:
- Pre-deployment checklist
- Detailed setup steps
- Security configuration
- Database setup (Sequelize)
- Environment configuration
- Troubleshooting
- Maintenance procedures

---

## 🔑 Important Files

### Automated Configuration Generator ⭐

- **`scripts/00_generate_configs.sh`** - **RUN THIS FIRST!**
  - Auto-generates `.env` with all secrets
  - Auto-generates nginx config with your IP
  - **ZERO manual editing required!**
  - Usage: `sudo bash 00_generate_configs.sh 95.216.14.232`

### Configuration Templates (Reference Only)

- **`templates/.env.production.template`** - Environment variables template
  - Pre-configured with IP: 95.216.14.232
  - All latest security settings
  - Complete variable reference

### Setup Scripts

1. **`scripts/01_setup_system.sh`** - Installs Node.js, PostgreSQL, Nginx
2. **`scripts/02_setup_database.sh`** - Sets up PostgreSQL + runs Sequelize migrations
3. **`scripts/03_setup_nginx.sh`** - Configures Nginx reverse proxy
4. **`scripts/04_deploy_app.sh`** - Deploys and starts application

### Configuration Files

- **`configs/nginx-hrm.conf`** - Nginx configuration (pre-configured with IP)
- **`systemd/hrm-backend.service`** - Backend service definition
- **`systemd/hrm-frontend.service`** - Frontend service definition

---

## ✅ What's New (November 5, 2025 Update)

### 🔥 Critical Migration Fixes

**Production deployment migration issues RESOLVED:**

- ✅ **Complete migration architecture** - New base migration creates all 15 core tables
- ✅ **Idempotent migrations** - All migrations now safe to run multiple times
- ✅ **Fresh database support** - Tested successfully from empty database
- ✅ **Fixed ordering bugs** - Migrations now run in correct dependency order
- ✅ **10 working migrations** - All migration files updated with existence checks

**Action Required:** Pull commit `cb801fa` or later before deploying to production.

### Previous Updates (January 2025)

### Database Setup
- ✅ **Sequelize migrations** (no manual SQL files)
- ✅ Automated schema creation
- ✅ Seeder support for demo data
- ✅ Automated backups (daily at 2 AM)

### Security
- ✅ Complete security configuration
- ✅ Rate limiting enabled
- ✅ Helmet.js security headers
- ✅ HSTS header in Nginx
- ✅ Proper CORS configuration

### Configuration
- ✅ Complete `.env` template with all variables
- ✅ Pre-configured with production IP
- ✅ All latest backend features documented
- ✅ Security best practices included

### Documentation
- ✅ 50+ page deployment guide
- ✅ Novice-friendly instructions
- ✅ Troubleshooting section
- ✅ Maintenance procedures
- ✅ Quick reference commands

---

## 🔐 Security Checklist

Before going live:

- [ ] Generate unique JWT secrets (64+ characters)
- [ ] Generate unique session secret (48+ characters)
- [ ] Update all IP addresses/domains in `.env`
- [ ] Set `.env` file permissions: `chmod 600`
- [ ] Set `.env` ownership: `chown hrmapp:hrmapp`
- [ ] Disable demo data: `SEED_DEMO_DATA=false`
- [ ] Disable debug mode: `DEBUG_MODE=false`
- [ ] Enable proxy trust: `TRUST_PROXY=true`
- [ ] Configure firewall (only ports 80, 443)
- [ ] Verify backups scheduled (cron job)

---

## 🆘 Getting Help

### Quick Health Check

```bash
# Check application health
curl http://your-server-ip/api/health

# Check database
sudo bash /opt/skyraksys-hrm/scripts/check-database.sh

# Check services
sudo systemctl status hrm-backend
sudo systemctl status hrm-frontend
sudo systemctl status nginx
sudo systemctl status postgresql-17
```

### View Logs

```bash
# Application logs
sudo tail -f /var/log/skyraksys-hrm/application.log

# Error logs
sudo tail -f /var/log/skyraksys-hrm/error.log

# Service logs
sudo journalctl -u hrm-backend -f
sudo journalctl -u hrm-frontend -f

# Nginx logs
sudo tail -f /var/log/nginx/hrm_error.log
```

### Common Issues

**Backend won't start?**
```bash
# Check .env file exists and has correct permissions
ls -l /opt/skyraksys-hrm/backend/.env
# Should show: -rw------- 1 hrmapp hrmapp

# Check database password is correct
cat /opt/skyraksys-hrm/.db_password
# Update DB_PASSWORD in .env with this value
```

**Database connection failed?**
```bash
# Start PostgreSQL
sudo systemctl start postgresql-17

# Test connection
sudo -u postgres psql -d skyraksys_hrm_prod -c "SELECT 1;"
```

**Nginx 502 error?**
```bash
# Check backend is running
sudo systemctl status hrm-backend
sudo systemctl start hrm-backend

# Test backend directly
curl http://localhost:5000/api/health
```

---

## 📚 Documentation Index

1. **`PRODUCTION_DEPLOYMENT_GUIDE.md`** ⭐
   - Complete deployment guide
   - Step-by-step instructions
   - Troubleshooting
   - Maintenance

2. **`RHEL_PRODUCTION_UPDATE_COMPLETE.md`**
   - What was updated
   - Why it was updated
   - Technical details
   - Change summary

3. **`REDHATPROD_AUDIT_2025.md`**
   - Audit results
   - Obsolete files
   - Current structure
   - Recommendations

4. **`CLEANUP_COMPLETE_SUMMARY.md`**
   - Cleanup actions
   - Files archived
   - New structure

5. **Backend README** (`../backend/README.md`)
   - API documentation
   - Development guide
   - Testing instructions

---

## 🎯 Next Steps

1. **Read the deployment guide:** `PRODUCTION_DEPLOYMENT_GUIDE.md`
2. **Run setup scripts** in order (01, 02, 03, 04)
3. **Configure `.env` file** with your values
4. **Start services** and verify deployment
5. **Setup monitoring** and backups
6. **Test application** thoroughly

---

## 💡 Tips for Success

✅ **Follow the order:** Run scripts in sequence (01 → 02 → 03 → 04)  
✅ **Read error messages:** Scripts provide detailed error information  
✅ **Check logs:** Most issues are revealed in log files  
✅ **Verify each step:** Test after each major step  
✅ **Keep backups:** System automatically backs up database daily  
✅ **Document changes:** Keep notes of any customizations  

---

## 📞 Support

**Need help?**

1. Check `PRODUCTION_DEPLOYMENT_GUIDE.md` troubleshooting section
2. Review relevant logs (see "View Logs" section above)
3. Run health checks (see "Quick Health Check" section)
4. Verify all prerequisites are met
5. Check that all configuration values are correct

---

**🎉 You're ready to deploy!**

Start with the **`PRODUCTION_DEPLOYMENT_GUIDE.md`** for complete instructions.

---

*Last Updated: January 2025*  
*RHEL 9.6 | PostgreSQL 17.x | Node.js 22.16.0*  
*Status: Production Ready ✅*
