# Obsolete Documentation Archive

This directory contains historical documentation that has been completed, fixed, or superseded by current documentation.

**Date Archived:** November 5, 2025

---

## Directory Structure

### `2025-11-05/` - Migration Fixes (Nov 5, 2025)
Documentation related to the database migration architecture overhaul:
- SYSTEM_STATUS_REPORT.md - Health check after migration fixes
- DATABASE_USER_FIX_COMPLETE.md - Database user configuration fix
- DATABASE_USER_CONFIG_ANALYSIS.md - Analysis of user mismatch issue
- PRODUCTION_DOCS_UPDATE_COMPLETE.md - Documentation update summary

**Why Archived:** Migration issues fixed and integrated into main production guides.

**See Instead:** 
- `redhatprod/PRODUCTION_DEPLOYMENT_GUIDE.md` (updated with fixes)
- `redhatprod/MIGRATION_GUIDE.md` (current migration reference)

---

### `production-fixes/` - Production Issue Fixes
Temporary documentation for production deployment troubleshooting:
- PRODUCTION_ISSUES_ANALYSIS.md
- MANUAL_FIX_STEPS.md

**Why Archived:** Issues resolved, fixes integrated into deployment scripts.

**See Instead:**
- `redhatprod/PRODUCTION_DEPLOYMENT_GUIDE.md`
- `redhatprod/START_HERE.md`

---

### `deployment/` - Deployment Packages
Temporary deployment documentation:
- PRODUCTION_DEPLOYMENT_PACKAGE.md

**Why Archived:** Deployment process standardized in production guides.

**See Instead:**
- `redhatprod/` directory (complete production deployment)

---

### `testing/` - Testing Documentation
Local testing guides:
- LOCAL_TESTING_GUIDE.md

**Why Archived:** Testing procedures documented in main guides.

**See Instead:**
- `frontend/e2e/README.md` (E2E testing)
- `backend/README.md` (Backend testing)
- `tests/README.md` (Test suite)

---

### `cleanup-reports/` - Documentation Cleanup Reports
Historical cleanup audits:
- DOCUMENTATION_CLEANUP_COMPLETE.md
- COMPLETE_DOCUMENTATION_CLEANUP_AUDIT.md

**Why Archived:** Cleanup completed, current structure documented.

**See Instead:**
- `docs/DOCUMENTATION_INDEX.md` (current structure)
- `docs/README.md` (documentation overview)

---

### `fixes/` - Individual Fix Reports
Single-issue fix documentation:
- CRITICAL_PROXY_ISSUE.md

**Why Archived:** Issues resolved and fixed in codebase.

---

### Root Level
Miscellaneous obsolete documentation:
- DATABASE_SEEDING_GUIDE.md (covered in backend/README.md)
- DEPLOYMENT_GUIDE.md (duplicate, see docs/deployment/)
- QUICK_REFERENCE_GUIDE.md (outdated)

---

## Accessing Current Documentation

### For Production Deployment:
📁 **Start Here:** `redhatprod/START_HERE.md`
- Complete deployment guide: `redhatprod/PRODUCTION_DEPLOYMENT_GUIDE.md`
- Migration reference: `redhatprod/MIGRATION_GUIDE.md`

### For Development:
📁 **Start Here:** `README.md` (root)
- Backend: `backend/README.md`
- Frontend: `frontend/e2e/README.md`
- Documentation: `docs/README.md`

### For Users:
📁 **Start Here:** `docs/README.md`
- User guides: `docs/user-guides/`
- Feature documentation: `docs/features/`

---

## Why Archive Instead of Delete?

✅ **Historical Reference** - Track how issues were resolved  
✅ **Audit Trail** - Maintain record of fixes and changes  
✅ **Learning Resource** - Future troubleshooting reference  
✅ **Rollback Information** - Context if issues reoccur  

---

## Archive Policy

Documentation is moved to `obsolete/` when:
1. ✅ Issue/feature is completed and integrated
2. ✅ Documentation is superseded by updated guides
3. ✅ Content is duplicated elsewhere
4. ✅ Temporary fixes are permanently resolved

Documentation is kept in main structure when:
- ⭐ Actively maintained and current
- ⭐ Primary reference for a feature/component
- ⭐ Part of standard workflow

---

**Last Updated:** November 5, 2025  
**Next Review:** When major features complete or documentation accumulates
