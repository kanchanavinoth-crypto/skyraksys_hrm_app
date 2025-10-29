# Production Folders Archive - October 27, 2025

## Purpose
This archive contains obsolete production deployment folders that have been consolidated into the primary `redhatprod` folder.

## Archived Folders

### 1. PROD (Created: Sep 4, 2025)
- **Purpose**: Windows-focused production deployment
- **Status**: Superseded by redhatprod
- **Key Contents**:
  - Windows batch scripts for setup
  - Docker configurations for Windows
  - Nginx config for Windows
  - .env.production.template

### 2. PRODUnix (Created: Sep 4, 2025)
- **Purpose**: Unix/Linux general production deployment
- **Status**: Superseded by redhatprod
- **Key Contents**:
  - Unix shell scripts for setup
  - Docker configurations for Unix
  - Nginx config for Unix
  - Multi-platform support (Ubuntu, Debian, CentOS, RHEL, Arch, macOS)

### 3. production (Last Modified: Oct 26, 2025)
- **Purpose**: Multi-platform deployment organization
- **Status**: Redundant structure, content migrated to redhatprod
- **Key Contents**:
  - redhat-deployment/base/ - Basic RHEL setup
  - redhat-deployment/prod/ - Duplicate of redhatprod content
  - windows/ - Windows Server deployment
  - unix/ - General Unix deployment

### 4. redhat (Created: Sep 11, 2025)
- **Purpose**: RedHat Linux deployment package
- **Status**: Superseded by more comprehensive redhatprod
- **Key Contents**:
  - BEGINNER_GUIDE.md
  - INSTALLATION_GUIDE.md
  - TROUBLESHOOTING.md
  - Basic scripts and configs

## Current Production Folder

### redhatprod (Last Modified: Oct 22, 2025) - **ACTIVE**
This is the **official and most comprehensive** production deployment folder.

**Location**: `/d/skyraksys_hrm/redhatprod/`

**Key Features**:
- ✅ Complete RHEL 9.6 deployment guide
- ✅ Database setup (schema, indexes, triggers, sample data)
- ✅ Automated installation scripts
- ✅ Production configurations (Nginx, systemd services)
- ✅ Maintenance and monitoring scripts
- ✅ Security best practices
- ✅ Comprehensive documentation

**Structure**:
```
redhatprod/
├── database/          # Complete database setup files
├── scripts/           # Automated deployment and maintenance
├── configs/           # Production configs (Nginx, systemd)
├── maintenance/       # Health checks, backups, monitoring
├── systemd/           # Service definitions
└── templates/         # Configuration templates
```

## Why These Were Archived

1. **Consolidation**: Multiple overlapping production folders created confusion
2. **Latest Content**: redhatprod has the most recent and comprehensive content
3. **Single Source of Truth**: All production deployment should reference redhatprod
4. **Maintainability**: Easier to maintain one authoritative production folder

## What to Use Going Forward

**For ALL production deployments**: Use `redhatprod/`

- Primary guide: `redhatprod/RHEL_PRODUCTION_DEPLOYMENT_GUIDE.md`
- Quick start: `redhatprod/README.md`
- Scripts: `redhatprod/scripts/`

## Recovery Instructions

If you need to reference or recover any archived content:

1. Content is preserved in this archive folder
2. Review the specific folder's README.md for details
3. Consider whether the content should be integrated into redhatprod
4. Do NOT restore folders to main directory without consolidation

## Archive Retention

- **Retention Period**: Keep for 6 months (until April 27, 2026)
- **Review Date**: January 27, 2026
- **Deletion Criteria**: If no issues arise, safe to delete after retention period

## Notes

- All archived folders contained valid deployment configurations
- No critical data was lost - all relevant content exists in redhatprod
- Windows and general Unix deployments can still be referenced from archive if needed
- The redhatprod folder serves as the authoritative source for RHEL production deployments

---

**Archive Created**: October 27, 2025  
**Created By**: Automated consolidation process  
**Review Status**: ✅ Content verified before archival
