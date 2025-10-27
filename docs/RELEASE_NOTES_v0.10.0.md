# Release Notes — v0.10.0 (2025-10-15)

This release focuses on admin operational controls, production hardening, and a novice-friendly deployment path.

## 🚀 Features
- Admin Config API (admin-only):
  - GET /api/admin/config — safe config snapshot
  - POST /api/admin/config/toggle-seeding — toggle SEED_DEMO_DATA (in-memory)
  - POST /api/admin/config/seed-now — run demo seeding
  - POST /api/admin/config/purge-demo — purge known demo data
- Frontend Admin Config page (admin-only) with diagnostics (health, auth protection, OPTIONS preflight, base URL reachability)
- Swagger docs: “Admin Config” tag and endpoint annotations

## 🔧 Changes
- Backend
  - Health/docs URLs now: /api/health, /api/docs, /api/docs.json
  - CORS allow-list enforced by default; CORS_ALLOW_ALL override available for testing
  - Env-driven rate limiting for general API and login endpoints
  - Centralized demo seeding/purge utilities with deterministic IDs; ensures prodadmin test user if missing
- Frontend
  - Added AdminConfigPage and route (/admin/config) and sidebar entry for admin
  - http-common now respects REACT_APP_API_URL or falls back to /api; sturdier axios interceptors
  - EmployeeEdit fixed to use setSuccess/setError instead of undefined setAlert

## 📘 Documentation & Ops
- Red Hat production docs updated:
  - BEST_PROD_DEPLOYMENT_FOR_NOVICES.md (new): Prefer Nginx static serving + /api proxy, avoids ESM and CORS pitfalls
  - RHEL_PRODUCTION_DEPLOYMENT_GUIDE.md: Added SEED_DEMO_DATA guidance; mitigations for ERR_REQUIRE_ESM
  - README.md references ESM section
- Configs & scripts:
  - Nginx static configs (redhatprod/configs/nginx-hrm-static*.conf)
  - Systemd frontend uses serve@14 to avoid ESM errors
  - Deploy script embeds API URL at build time, prefers static Nginx
  - Templates standardized on DB_USER; rate limit vars included

## ⚠️ Upgrade Notes
- If you used DB_USERNAME, change to DB_USER in environments and scripts
- For same-origin deployments, set REACT_APP_API_URL=/api before build or rely on default
- SEED_DEMO_DATA=true is for pre-prod; disable before go-live and use purge endpoint to clean demo data

## 🔐 Security & Hardening
- Rate limiting via env: general API and auth endpoints
- CORS restricted by default; allow-list or override for troubleshooting

## 📦 Artifacts
- Tag: v0.10.0
- Diff highlights include new admin endpoints/UI, demo seed utils, docs/configs/scripts for RHEL, and frontend/backend adjustments

