# 🚀 Production Build Quick Reference

## One-Command Deployment

```bash
# Automated production deployment (RECOMMENDED)
sudo bash deploy.sh --auto

# With specific IP
sudo bash deploy.sh --auto 95.216.14.232

# With domain
sudo bash deploy.sh --auto hrm.company.com
```

## What Happens Automatically

✅ Auto-detects or uses production default IP (95.216.14.232)  
✅ **Auto-detects SSL certificate** (uses HTTPS if found, HTTP if not)  
✅ Generates secure 64-char JWT secrets  
✅ Generates secure 48-char session secrets  
✅ Creates production .env with 100+ variables  
✅ Creates nginx reverse proxy config  
✅ **Works with HTTP until SSL is installed** (easy upgrade path)  
✅ Applies strict CORS and rate limiting  
✅ Sets proper file permissions (chmod 600)  
✅ No CHANGE_THIS_ placeholders  
✅ **ZERO manual editing required**

## Generated Files

```
/opt/skyraksys-hrm/
├── backend/.env                              (600) Auto-generated
├── redhatprod/configs/nginx-hrm-production.conf    Auto-generated
└── PRODUCTION_CONFIG_SUMMARY.txt                   Deployment guide
```

## Production Defaults Applied

| Setting | Value |
|---------|-------|
| IP Address | 95.216.14.232 (or auto-detected) |
| Protocol | **HTTP/HTTPS (auto-detected based on SSL cert)** |
| JWT Secret | 64 chars (crypto-secure) |
| Session Secret | 48 chars (crypto-secure) |
| CORS | Strict (same-origin) |
| Rate Limiting | Enabled (10 req/sec API, 5 req/min login) |
| Security Headers | All enabled (HSTS if HTTPS, headers always) |
| DB Pool | 5-20 connections |
| Debug Mode | Disabled |

## Protocol Selection (HTTP/HTTPS)

```bash
# Auto-detect SSL certificate (recommended)
sudo bash 00_generate_configs_auto.sh
# Uses HTTPS if /etc/letsencrypt/live/SERVER/fullchain.pem exists
# Uses HTTP otherwise (safe for initial setup)

# Force HTTP (development/testing)
sudo bash 00_generate_configs_auto.sh 95.216.14.232 http

# Force HTTPS (production with SSL)
sudo bash 00_generate_configs_auto.sh 95.216.14.232 https
```

## Upgrade HTTP → HTTPS (Easy!)

```bash
# 1. Install SSL certificate
sudo certbot --nginx -d 95.216.14.232

# 2. Regenerate configs (auto-detects SSL now)
sudo bash redhatprod/scripts/00_generate_configs_auto.sh

# 3. Restart services
sudo systemctl restart hrm-backend hrm-frontend nginx

# Done! (~5 minutes total)
```

## Interactive Mode (Old Way Still Works)

```bash
# Interactive with prompts
sudo bash deploy.sh

# Will ask for IP (offers better defaults now)
# Will ask for HTTPS (defaults to Yes)
```

## Config Generation Only

```bash
# Generate configs without full deployment
sudo bash redhatprod/scripts/00_generate_configs_auto.sh

# With specific IP
sudo bash redhatprod/scripts/00_generate_configs_auto.sh 95.216.14.232

# With HTTP (not recommended)
sudo bash redhatprod/scripts/00_generate_configs_auto.sh 95.216.14.232 http
```

## Verify Deployment

```bash
# Check generated configs
cat /opt/skyraksys-hrm/backend/.env | grep -E '(JWT_SECRET|SESSION_SECRET|API_BASE_URL)'

# View deployment summary
cat /opt/skyraksys-hrm/PRODUCTION_CONFIG_SUMMARY.txt

# Check services
sudo systemctl status hrm-backend hrm-frontend

# Test health
curl https://95.216.14.232/api/health
```

## Troubleshooting

```bash
# View deployment logs
tail -f /var/log/skyraksys-hrm/deployment.log

# Regenerate configs
sudo bash redhatprod/scripts/00_generate_configs_auto.sh --force

# Restart services
sudo systemctl restart hrm-backend hrm-frontend
```

## Key Benefits

⚡ **30 seconds** to generate configs (vs 30 minutes manual)  
🔒 **Zero errors** (auto-generated, no typos)  
🛡️ **Security hardened** by default  
🎯 **Production-ready** configs  
📦 **No technical knowledge** required  

---

**Ready?** Run: `sudo bash deploy.sh --auto` 🚀
