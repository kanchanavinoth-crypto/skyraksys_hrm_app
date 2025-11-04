# Production Templates Ready - Copy-Paste Deployment

**Date**: October 29, 2025  
**Status**: ✅ **PRODUCTION READY**

---

## 🎯 Quick Start

**Master production templates are now copy-paste ready with all defaults filled in.**

### Two Master Templates

1. **`templates/.env.production`** - Environment configuration (100+ variables)
2. **`configs/nginx-hrm.production`** - Nginx reverse proxy configuration

**Pre-configured for**: 95.216.14.232 (SKYRAKSYS production server)

---

## 📋 5-Command Production Deployment

```bash
# 1. Copy environment file
cp templates/.env.production /opt/skyraksys-hrm/backend/.env

# 2. Regenerate secrets (CRITICAL for security)
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH=$(openssl rand -hex 32)
SESSION=$(openssl rand -base64 36 | tr -d '\n' | head -c 48)

sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" /opt/skyraksys-hrm/backend/.env
sed -i "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=$JWT_REFRESH/" /opt/skyraksys-hrm/backend/.env
sed -i "s/SESSION_SECRET=.*/SESSION_SECRET=$SESSION/" /opt/skyraksys-hrm/backend/.env

# 3. Copy nginx config
sudo cp configs/nginx-hrm.production /etc/nginx/conf.d/hrm.conf

# 4. Test nginx
sudo nginx -t

# 5. Reload nginx
sudo systemctl reload nginx
```

**Done!** Your production server is now configured and running.

---

## 🔍 What's Pre-Configured

### Environment File (`.env.production`)

**Application**:
- `DOMAIN=95.216.14.232`
- `API_BASE_URL=http://95.216.14.232/api`
- `FRONTEND_URL=http://95.216.14.232`
- `PORT=5000` (backend)
- `NODE_ENV=production`

**Database**:
- `DB_HOST=localhost`
- `DB_PORT=5432`
- `DB_NAME=skyraksys_hrm_prod`
- `DB_USER=hrm_app`
- `DB_PASSWORD=Sk7R@k$y$_DB_2024!#` ✅ Actual password
- `DB_DIALECT=postgres`

**Security** (⚠️ REGENERATE THESE):
- `JWT_SECRET=8f2e4c1a9b7d5e3f...` (example - 64 chars)
- `JWT_REFRESH_SECRET=9a8b7c6d5e4f...` (example - 64 chars)
- `SESSION_SECRET=Nm8*pL5$wX3@rQ9%...` (example - 48 chars)

**CORS**:
- `CORS_ORIGIN=http://95.216.14.232`
- `ALLOWED_ORIGINS=http://95.216.14.232`

**Plus 90+ more variables** (all configured)

### Nginx Config (`nginx-hrm.production`)

**Upstreams**:
- Backend: `localhost:5000` with keepalive
- Frontend: `localhost:3000` with keepalive

**Rate Limiting**:
- API: 10 requests/second
- Login: 5 requests/minute
- Upload: 2 requests/second
- General: 20 requests/second

**Security Headers**:
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Content-Security-Policy configured
- HSTS ready (commented until SSL)

**SSL Configuration**:
- Certificate paths: `/etc/letsencrypt/live/95.216.14.232/`
- All lines commented (uncomment after certbot)

**Other Features**:
- Gzip compression (level 6)
- Static asset caching (1 year)
- Client body size: 10M (50M for uploads)
- Health check endpoint: `/api/health`
- Access restrictions: Denies .env, .git, config files

---

## 🔐 Security Checklist

### Before Production Deployment

- [x] Database password included (Sk7R@k$y$_DB_2024!#)
- [ ] **CRITICAL**: Regenerate JWT secrets (see command above)
- [ ] **CRITICAL**: Regenerate session secret (see command above)
- [ ] Review CORS origins (default: same server)
- [ ] Update server IP if different from 95.216.14.232
- [ ] After SSL: Uncomment HTTPS config in nginx
- [ ] After SSL: Uncomment HSTS header
- [ ] After SSL: Uncomment HTTP→HTTPS redirect

### After Production Deployment

- [ ] Test HTTP access: `curl http://95.216.14.232/api/health`
- [ ] Install SSL: `sudo certbot --nginx -d 95.216.14.232`
- [ ] Uncomment SSL config in nginx
- [ ] Test HTTPS access: `curl https://95.216.14.232/api/health`
- [ ] Enable HSTS header (uncomment in nginx)
- [ ] Monitor logs: `tail -f /var/log/nginx/hrm_error.log`
- [ ] Test rate limiting with load test
- [ ] Verify systemd services: `systemctl status hrm-backend hrm-frontend`

---

## 📁 File Structure

### Production Templates (KEEP)

```
redhatprod/
├── templates/
│   └── .env.production              ⭐ Master environment template
├── configs/
│   ├── nginx-hrm.production         ⭐ Master nginx template
│   ├── nginx-hrm.conf                  Alternative config (kept)
│   └── nginx-hrm-static.conf           Static serving alternative (kept)
└── obsolete/
    ├── templates/
    │   ├── .env.95.216.14.232.example     (moved - superseded)
    │   ├── .env.95.216.14.232.prebaked    (moved - superseded)
    │   └── .env.production.template       (moved - superseded)
    └── configs/
        └── nginx-hrm-static.95.216.14.232.conf  (moved - superseded)
```

### What Was Moved to Obsolete

**Templates**:
- `.env.95.216.14.232.example` - IP-specific example (superseded)
- `.env.95.216.14.232.prebaked` - Duplicate file (superseded)
- `.env.production.template` - Placeholder-based old format (superseded)

**Configs**:
- `nginx-hrm-static.95.216.14.232.conf` - IP-specific static config (superseded)

**Reason**: Replaced by master templates with actual values filled in.

---

## 🆚 Old vs New Approach

### Old Way (Placeholders)

```bash
# .env.production.template (OLD)
DOMAIN={{SERVER_IP}}              # ❌ Manual find/replace
DB_PASSWORD={{DB_PASSWORD}}       # ❌ Manual find/replace
JWT_SECRET={{JWT_SECRET}}         # ❌ Manual generation + replace
CORS_ORIGIN=http://{{SERVER_IP}}  # ❌ Manual find/replace
```

**Problems**:
- Manual find/replace for every {{PLACEHOLDER}}
- Multiple duplicate files causing confusion
- No actual values provided
- Easy to miss a placeholder

### New Way (Actual Values)

```bash
# .env.production (NEW)
DOMAIN=95.216.14.232                    # ✅ Pre-filled
DB_PASSWORD=Sk7R@k$y$_DB_2024!#         # ✅ Actual password
JWT_SECRET=8f2e4c1a9b7d5e3f...          # ✅ Example (regenerate)
CORS_ORIGIN=http://95.216.14.232        # ✅ Pre-filled
```

**Benefits**:
- Copy-paste ready (no find/replace)
- Single master template (no confusion)
- Actual production values included
- Clear documentation on what to change

---

## 🔄 Upgrade Path: HTTP → HTTPS

### Current State (HTTP)

Templates are configured for **HTTP by default** (port 80):
- Safe for initial deployment
- No SSL certificate required
- Immediate testing possible

### After SSL Installation

```bash
# 1. Install SSL certificate
sudo certbot --nginx -d 95.216.14.232

# 2. Edit nginx config
sudo nano /etc/nginx/conf.d/hrm.conf

# 3. Uncomment these sections:
#    - listen 443 ssl http2;
#    - ssl_certificate /etc/letsencrypt/live/95.216.14.232/fullchain.pem;
#    - ssl_certificate_key /etc/letsencrypt/live/95.216.14.232/privkey.pem;
#    - add_header Strict-Transport-Security "...";
#    - HTTP→HTTPS redirect server block (at bottom)

# 4. Update .env for HTTPS
sed -i 's|http://95.216.14.232|https://95.216.14.232|g' /opt/skyraksys-hrm/backend/.env

# 5. Test and reload
sudo nginx -t && sudo systemctl reload nginx
sudo systemctl restart hrm-backend hrm-frontend
```

**Easy upgrade**: Just uncomment SSL lines and update URLs from http → https.

---

## 🛠️ When to Update Templates

### Change Server IP

If deploying to different IP (not 95.216.14.232):

```bash
# Find and replace in .env.production
sed -i 's/95.216.14.232/YOUR_IP/g' templates/.env.production

# Find and replace in nginx-hrm.production
sed -i 's/95.216.14.232/YOUR_IP/g' configs/nginx-hrm.production
```

### Change Database Password

```bash
# Update in .env.production
sed -i 's/DB_PASSWORD=.*/DB_PASSWORD=YOUR_NEW_PASSWORD/' templates/.env.production
```

### Regenerate All Secrets

```bash
# Generate new secrets
JWT=$(openssl rand -hex 32)
REFRESH=$(openssl rand -hex 32)
SESSION=$(openssl rand -base64 36 | tr -d '\n' | head -c 48)

# Update in .env.production
sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT/" templates/.env.production
sed -i "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=$REFRESH/" templates/.env.production
sed -i "s/SESSION_SECRET=.*/SESSION_SECRET=$SESSION/" templates/.env.production
```

---

## 📚 Related Documentation

**Deployment Guides**:
- `ONE_COMMAND_DEPLOYMENT.md` - Automated deployment (uses `deploy.sh`)
- `DEPLOYMENT_CHEAT_SHEET.txt` - Quick reference commands
- `START_HERE.md` - First-time setup guide

**Configuration Automation**:
- `scripts/00_generate_configs_auto.sh` - Auto-generates configs (non-interactive)
- `scripts/00_generate_configs.sh` - Interactive config generator
- `scripts/deploy.sh` - Master deployment script (use `--auto` for non-interactive)

**Audit Reports**:
- `ENVIRONMENT_CONFIG_AUDIT_COMPLETE.md` - Complete config audit
- `CONFIG_AUDIT_EXECUTIVE_SUMMARY.md` - Quick audit summary
- `obsolete/README.md` - Phase 4 cleanup details

---

## ✅ Validation

### Templates Verified

- [x] `.env.production` has 100+ variables configured
- [x] `.env.production` has actual IP (95.216.14.232)
- [x] `.env.production` has actual DB password
- [x] `.env.production` has example secrets (must regenerate)
- [x] `nginx-hrm.production` has actual IP throughout
- [x] `nginx-hrm.production` has rate limiting configured
- [x] `nginx-hrm.production` has security headers enabled
- [x] `nginx-hrm.production` has SSL config ready (commented)
- [x] Obsolete files moved to `obsolete/` folder
- [x] `obsolete/README.md` updated with Phase 4 info

### Cleanup Completed

- [x] Moved 3 obsolete template files to `obsolete/templates/`
- [x] Moved 1 obsolete config file to `obsolete/configs/`
- [x] Kept only master production templates in active directories
- [x] Updated obsolete/README.md with cleanup details
- [x] Documented usage instructions
- [x] Created this summary document

---

## 🎓 Philosophy

**One Master Template Per Config Type**:
- No duplicates
- No placeholders
- Actual production values
- Clear documentation
- Copy-paste ready

**Security by Default**:
- Example secrets included (must regenerate)
- Database password included (actual)
- CORS restricted to same origin
- Rate limiting enabled
- Security headers configured

**Easy Upgrade Path**:
- HTTP works immediately (no SSL required)
- HTTPS ready (uncomment after certbot)
- Clear upgrade instructions
- Zero downtime migration

---

## 🚀 Summary

✅ **Production templates are ready for copy-paste deployment**  
✅ **All defaults filled in (95.216.14.232, DB password, example secrets)**  
✅ **Obsolete files cleaned up and moved**  
✅ **Single master template per config type**  
✅ **Clear documentation and upgrade path**

**Deploy in 5 commands. No placeholders. No manual editing. Production-ready.**

---

**For questions or issues, see**:
- `obsolete/README.md` - What changed and why
- `ENVIRONMENT_CONFIG_AUDIT_COMPLETE.md` - Complete config audit
- `ONE_COMMAND_DEPLOYMENT.md` - Automated deployment guide
