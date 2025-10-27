# Best Production Deployment (Novice-Friendly) – RHEL 9.6

This guide gives you the simplest, most reliable way to deploy HRM to a Red Hat server so you can log in successfully without tripping over Node/ESM or CORS issues. It also includes a prefilled config for IP 95.216.14.232 so novices can deploy with minimal edits.

Key choices in this setup:
- Nginx serves the React build directly (no Node static server). Fewer moving parts, no ESM errors.
- Nginx proxies /api to the backend on localhost:5000 (same-origin = no CORS headaches).
- Frontend build points to /api, or you can embed your domain at build time via the deploy script.

## What you’ll end up with
- Frontend: http://YOUR_DOMAIN/ (served by Nginx from build folder)
- API: http://YOUR_DOMAIN/api (proxied by Nginx to backend at 127.0.0.1:5000)
- Login: admin@skyraksys.com / admin123

## 1) One-time prerequisites

Run the standard scripts in order (as root):
- scripts/01_install_prerequisites.sh
- scripts/02_setup_database.sh

Then copy an env file:
- Easiest (prefilled for this server IP): redhatprod/templates/.env.95.216.14.232.example -> /opt/skyraksys-hrm/.env
  - This requires almost no edits and disables email by default (SMTP not required to log in).
- Or use the general template: redhatprod/templates/.env.production.template -> /opt/skyraksys-hrm/.env
  - Email is optional; leave SMTP_ENABLED=false to skip email setup.

Quick check:
- /opt/skyraksys-hrm/.env has DOMAIN=95.216.14.232 and API_BASE_URL=http://95.216.14.232/api

## 2) Recommended Nginx config (static frontend + API proxy)

We provide ready configs:
- For any domain/IP: redhatprod/configs/nginx-hrm-static.conf
- Preconfigured for this server IP: redhatprod/configs/nginx-hrm-static.95.216.14.232.conf

To use the prefilled IP config:
- Copy redhatprod/configs/nginx-hrm-static.95.216.14.232.conf to /etc/nginx/conf.d/hrm.conf
- Reload Nginx: systemctl restart nginx

Why this is better for novices:
- No Node process is needed to serve static files (no pm2 or serve package)
- No ESM errors from serve/build tools
- Same-origin URLs (http://YOUR_DOMAIN and http://YOUR_DOMAIN/api) remove CORS problems

## 3) Deploy the application

Option A: Use the automated deploy script (recommended)
- scripts/03_deploy_application.sh will:
  - Install backend and frontend dependencies
  - Build the frontend with REACT_APP_API_URL embedded (using API_BASE_URL from /opt/skyraksys-hrm/.env). If you set DOMAIN=95.216.14.232, it will embed http://95.216.14.232/api automatically.
  - Create and enable systemd services for backend and (optionally) a Node static server
  - Configure Nginx (a proxy config is generated; you can swap to static config afterward)

Option B: Manual minimal steps (backend + Nginx static)
- Backend
  - cd /opt/skyraksys-hrm/backend
  - npm ci --only=production
  - Copy /opt/skyraksys-hrm/.env -> /opt/skyraksys-hrm/backend/.env
  - Create and start a systemd service (see hrm-backend.service in this repo)
- Frontend
  - cd /opt/skyraksys-hrm/frontend
  - npm ci
  - Build with same-origin API: REACT_APP_API_URL=/api npm run build
  - Ensure Nginx is using the static config pointing root to /opt/skyraksys-hrm/frontend/build

## 4) Ensure the admin user exists (so you can log in)

Two ways this happens:
1) Database sample data (from 02_setup_database.sh) inserts users with a bcrypt-hashed default. The documented default admin password is admin123.
2) If needed, you can run backend/scripts/create-admin.js to create the admin with password admin123.

Check admin script:
- backend/scripts/create-admin.js creates admin@skyraksys.com with admin123 if missing.

## 5) Success checks

- Backend health:
  - curl -s http://localhost:5000/api/health (should be 200/OK if available)
- Nginx proxy:
  - curl -s http://YOUR_DOMAIN (should return the frontend HTML)
  - curl -s http://YOUR_DOMAIN/api/docs (if swagger is enabled)
- Frontend build uses the right API:
  - grep -R "/api" /opt/skyraksys-hrm/frontend/build | head
  - or if you set API_BASE_URL, grep for that URL in build files

## 6) Login details

- Username: admin@skyraksys.com
- Password: admin123

If login fails:
- Ensure backend can reach the database (journalctl -u hrm-backend -f)
- Ensure /opt/skyraksys-hrm/backend/.env database credentials are correct
- Run: node /opt/skyraksys-hrm/backend/scripts/create-admin.js
- Check browser console network calls go to http://YOUR_DOMAIN/api and not localhost

## 7) Common pitfalls avoided by this setup

- ERR_REQUIRE_ESM when serving static files: avoided by using Nginx for static
- CORS errors: avoided by using same-origin /api via Nginx
  - If you need to test cross-origin briefly, set CORS_ALLOW_ALL=true in /opt/skyraksys-hrm/backend/.env and restart backend. Turn it off after testing.
- CRA env confusion: REACT_APP_* is embedded at build time; use deploy script or set REACT_APP_API_URL=/api

## 8) Optional: lock down CORS in backend

If you’re serving frontend via the same domain, set backend CORS to allow only your domain or disable cross-origin entirely. This is already low-risk thanks to same-origin via Nginx.

---

With this approach, a novice user can reliably deploy and log in without touching pm2 or battling ESM issues.

## 0) Clean up any previous deployment (recommended)

If you’ve deployed an older version before, run these steps to start clean:

1) Stop services (ignore errors if a service doesn’t exist)
- sudo systemctl stop hrm-frontend || true
- sudo systemctl stop hrm-backend || true
- sudo systemctl stop nginx || true

2) Disable legacy frontend service (if switching to static Nginx)
- sudo systemctl disable hrm-frontend || true

3) Remove/backup old Nginx config
- if [ -f /etc/nginx/conf.d/hrm.conf ]; then sudo mv /etc/nginx/conf.d/hrm.conf /etc/nginx/conf.d/hrm.conf.bak-$(date +%s); fi

4) Clean old frontend build and caches
- sudo rm -rf /opt/skyraksys-hrm/frontend/build
- sudo rm -f /var/log/skyraksys-hrm/frontend*.log
- Optional (force a fresh dependency install): sudo rm -rf /opt/skyraksys-hrm/frontend/node_modules

5) Handle the environment file
- Backup existing env: if [ -f /opt/skyraksys-hrm/.env ]; then sudo cp /opt/skyraksys-hrm/.env /opt/skyraksys-hrm/.env.bak-$(date +%s); fi
- You may delete it to let the deploy script auto-provision the default for 95.216.14.232:
  - sudo rm -f /opt/skyraksys-hrm/.env
  - The deployment script will create one from the prefilled example automatically.

6) Restart Nginx after reconfiguration later in this guide
- sudo nginx -t && sudo systemctl restart nginx

Tip: We also provide an optional helper script at redhatprod/scripts/00_cleanup_previous_deployment.sh that automates these steps.
