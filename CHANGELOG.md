# Changelog

All notable changes to this project will be documented in this file.

## [v0.10.0] - 2025-10-15

Highlights:
- Admin Config endpoints (view config, toggle demo seeding, seed now, purge demo) with Swagger docs
- New Admin Config frontend page (admin-only) with diagnostics
- Health/docs URL alignment to /api/health and /api/docs(.json)
- Hardened CORS and env-driven rate limiting
- Centralized demo seed/purge utilities with deterministic IDs
- RHEL novice-friendly deployment docs and configs (Nginx static, serve@14), plus templates and scripts

Added:
- backend/routes/admin-config.routes.js: Admin-only endpoints
- backend/utils/demoSeed.js: Central seeding/purge utilities
- frontend/src/components/features/admin/AdminConfigPage.jsx: Admin UI for config and diagnostics
- redhatprod/configs/nginx-hrm-static.conf and nginx-hrm-static.95.216.14.232.conf: Static build via Nginx with API proxy
- redhatprod/BEST_PROD_DEPLOYMENT_FOR_NOVICES.md and scripts/00_cleanup_previous_deployment.sh
- redhatprod/templates/.env.95.216.14.232.example

Changed:
- backend/server.js: Health/docs URLs, mount admin-config routes, tightened CORS with allow-list and optional CORS_ALLOW_ALL, env-driven rate limits
- backend/config/swagger.js: Added "Admin Config" tag
- frontend/src/App.js and layout to wire in Admin Config page and navigation
- frontend/src/http-common.js: Use REACT_APP_API_URL or /api and improved interceptors

Fixed:
- frontend EmployeeEdit undefined setAlert usage; now uses setSuccess/setError

Docs/Deployment:
- Red Hat production guide updates (SEED_DEMO_DATA guidance, ERR_REQUIRE_ESM mitigation)
- Systemd frontend service pins serve@14 to avoid ESM errors
- Deploy script embeds API URL at build, prefers static Nginx for novices
- Templates standardized on DB_USER and include rate limit vars

Security/Hardening:
- Rate limiting enabled via env for general and auth endpoints
- Clearer DB connection logging; CORS restricted by default with override switch

Upgrade notes:
- If you previously used DB_USERNAME in env or scripts, switch to DB_USER
- Ensure REACT_APP_API_URL is set at build time or rely on same-origin /api via Nginx
- For pre-prod testing, SEED_DEMO_DATA=true is supported; disable before go-live and use purge endpoint if needed

[v0.10.0]: https://github.com/Otyvino/skyt_hrm/releases/tag/v0.10.0
