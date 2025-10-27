# 📋 SkyRakSys HRM - Documentation Navigation Guide

**Last Updated**: October 26, 2025  
**Version**: 2.0.0  
**Status**: Production Ready (95%)

---

## 🎯 Quick Navigation

| I want to... | Go to... |
|--------------|----------|
| **Deploy to Production (RedHat)** | [`../production/redhat-deployment/`](../production/redhat-deployment/README.md) |
| **Understand the System** | [COMPREHENSIVE_HRM_REVIEW_REPORT.md](./COMPREHENSIVE_HRM_REVIEW_REPORT.md) |
| **Review Recent Audits** | [`audits/`](#-system-audits) folder |
| **Setup Development** | [`../README.md`](../README.md) → [`../backend/README.md`](../backend/README.md) + [`../frontend/README.md`](../frontend/README.md) |
| **Troubleshoot Issues** | [`guides/DATABASE_TOOLS_TROUBLESHOOTING.md`](./guides/DATABASE_TOOLS_TROUBLESHOOTING.md) |
| **View API Documentation** | Swagger UI at `http://localhost:5000/api-docs` |

---

## 📁 Documentation Structure

```
docs/
├── 📄 README.md (this file)             # Master navigation guide
├── 📄 COMPREHENSIVE_HRM_REVIEW_REPORT.md          # Complete system overview
├── 📄 COMPREHENSIVE_PAYSLIP_SYSTEM_DOCUMENTATION.md  # Payslip deep dive
├── 📄 COMPREHENSIVE_CONTEXT_DOCUMENTATION.md       # System context & history
├── 📄 PROJECT_STRUCTURE_ANALYSIS.md     # Codebase organization
├── 📄 MASTER_FIXES_LOG.md               # All fixes and changes log
├── 📄 RELEASE_2.0.0_ANNOUNCEMENT.md     # Latest release notes
│
├── 📂 audits/                           # System audit reports
│   ├── TIMESHEET_COMPREHENSIVE_AUDIT_REPORT.md
│   ├── PAYSLIP_SYSTEM_AUDIT_REPORT.md
│   ├── API_FUNCTIONALITY_AUDIT.md
│   └── AUDIT_ISSUES_STATUS_TRACKER.md
│
├── 📂 production/                       # Production deployment docs
│   ├── PRODUCTION_DEPLOYMENT_CHECKLIST.md
│   ├── PRODUCTION_READINESS_REPORT.md
│   ├── PRODUCTION_CREDENTIALS_VERIFICATION.md
│   ├── FINAL_PRODUCTION_READINESS_CHECKLIST.md
│   ├── DEPLOYMENT-DOCUMENTATION.md
│   └── SWAGGER_PRODUCTION_GUIDE.md
│
├── 📂 guides/                           # User & admin guides
│   ├── TIMESHEET_QUICK_REFERENCE.md
│   ├── PAYSLIP_TEMPLATE_OPTIONS_GUIDE.md
│   ├── DEFAULT_TEMPLATES_AND_LOGO_GUIDE.md
│   └── DATABASE_TOOLS_TROUBLESHOOTING.md
│
└── 📂 features/                         # Feature-specific documentation
    └── (Coming soon)
```

---

## 📚 Core Documentation

### System Overview
| Document | Description | For |
|----------|-------------|-----|
| [**COMPREHENSIVE_HRM_REVIEW_REPORT.md**](./COMPREHENSIVE_HRM_REVIEW_REPORT.md) | Complete system architecture, features, and technical details | All roles |
| [**COMPREHENSIVE_PAYSLIP_SYSTEM_DOCUMENTATION.md**](./COMPREHENSIVE_PAYSLIP_SYSTEM_DOCUMENTATION.md) | Complete payslip module documentation | HR, Payroll, Developers |
| [**COMPREHENSIVE_CONTEXT_DOCUMENTATION.md**](./COMPREHENSIVE_CONTEXT_DOCUMENTATION.md) | Project history and context | Project managers, Developers |
| [**PROJECT_STRUCTURE_ANALYSIS.md**](./PROJECT_STRUCTURE_ANALYSIS.md) | Codebase organization and file structure | Developers |

### Change Management
| Document | Description |
|----------|-------------|
| [**MASTER_FIXES_LOG.md**](./MASTER_FIXES_LOG.md) | Comprehensive log of all fixes and changes |
| [**RELEASE_2.0.0_ANNOUNCEMENT.md**](./RELEASE_2.0.0_ANNOUNCEMENT.md) | Latest release notes and features |
| [**../CHANGELOG.md**](../CHANGELOG.md) | Historical change log |

---

## 🔍 System Audits

Located in: [`audits/`](./audits/)

| Audit Report | Date | Status | Key Findings |
|--------------|------|--------|--------------|
| [**Timesheet Comprehensive Audit**](./audits/TIMESHEET_COMPREHENSIVE_AUDIT_REPORT.md) | Oct 2025 | ✅ 95% Complete | 27 issues identified, 14 fixed (95% production ready) |
| [**Payslip System Audit**](./audits/PAYSLIP_SYSTEM_AUDIT_REPORT.md) | 2024 | ✅ Complete | System functional and production-ready |
| [**API Functionality Audit**](./audits/API_FUNCTIONALITY_AUDIT.md) | 2024 | ✅ Complete | All endpoints validated |
| [**Audit Issues Status Tracker**](./audits/AUDIT_ISSUES_STATUS_TRACKER.md) | Live | 📊 Tracking | Real-time status of all audit issues |

---

## 🏭 Production & Deployment

Located in: [`production/`](./production/) and [`../production/`](../production/)

### Documentation
| Document | Purpose |
|----------|---------|
| [**Production Deployment Checklist**](./production/PRODUCTION_DEPLOYMENT_CHECKLIST.md) | Pre-deployment verification |
| [**Production Readiness Report**](./production/PRODUCTION_READINESS_REPORT.md) | System readiness assessment |
| [**Production Credentials Verification**](./production/PRODUCTION_CREDENTIALS_VERIFICATION.md) | Security setup guide |
| [**Final Production Readiness Checklist**](./production/FINAL_PRODUCTION_READINESS_CHECKLIST.md) | Final pre-launch checks |
| [**Deployment Documentation**](./production/DEPLOYMENT-DOCUMENTATION.md) | General deployment guide |
| [**Swagger Production Guide**](./production/SWAGGER_PRODUCTION_GUIDE.md) | API documentation setup |

### Deployment Configurations
See [`../production/`](../production/) for platform-specific deployment:

| Platform | Location | Documentation |
|----------|----------|---------------|
| **RedHat/RHEL** (Primary) | [`../production/redhat-deployment/`](../production/redhat-deployment/) | [README](../production/redhat-deployment/README.md) |
| **Windows Server** | [`../production/windows/`](../production/windows/) | README.md |
| **Unix/Linux** | [`../production/unix/`](../production/unix/) | README.md |

---

## 📖 User & Admin Guides

Located in: [`guides/`](./guides/)

### For Employees & Managers
| Guide | Purpose |
|-------|---------|
| [**Timesheet Quick Reference**](./guides/TIMESHEET_QUICK_REFERENCE.md) | How to create and submit timesheets |

### For HR & Administrators
| Guide | Purpose |
|-------|---------|
| [**Payslip Template Options**](./guides/PAYSLIP_TEMPLATE_OPTIONS_GUIDE.md) | Configure and customize payslip templates |
| [**Default Templates and Logo**](./guides/DEFAULT_TEMPLATES_AND_LOGO_GUIDE.md) | Branding and template customization |

### For Developers & DBAs
| Guide | Purpose |
|-------|---------|
| [**Database Tools Troubleshooting**](./guides/DATABASE_TOOLS_TROUBLESHOOTING.md) | Database issues and solutions |

---

## 🔧 Technical Documentation

### Backend
- **Location**: `../backend/`
- **Documentation**: [`../backend/README.md`](../backend/README.md)
- **API Documentation**: Swagger UI at `http://localhost:5000/api-docs`
- **Technologies**: Node.js 18+, Express, Sequelize, PostgreSQL

### Frontend
- **Location**: `../frontend/`
- **Documentation**: [`../frontend/README.md`](../frontend/README.md)
- **Technologies**: React 18, Material-UI v5, Axios, Day.js

### Database
- **Type**: PostgreSQL 14+
- **Scripts**: `../scripts/database/`
- **Schema**: See audit reports for current schema

---

## 🎯 Common Use Cases

### I'm a New Developer
1. Read [COMPREHENSIVE_HRM_REVIEW_REPORT.md](./COMPREHENSIVE_HRM_REVIEW_REPORT.md)
2. Setup development environment: [`../README.md`](../README.md)
3. Review [PROJECT_STRUCTURE_ANALYSIS.md](./PROJECT_STRUCTURE_ANALYSIS.md)
4. Check backend docs: [`../backend/README.md`](../backend/README.md)
5. Check frontend docs: [`../frontend/README.md`](../frontend/README.md)
6. Browse audit reports in [`audits/`](./audits/)

### I'm Deploying to Production
1. Choose platform: [`../production/README.md`](../production/README.md)
2. **For RedHat**: See [`../production/redhat-deployment/`](../production/redhat-deployment/README.md)
3. Review [Production Deployment Checklist](./production/PRODUCTION_DEPLOYMENT_CHECKLIST.md)
4. Follow [Production Readiness Report](./production/PRODUCTION_READINESS_REPORT.md)
5. Verify credentials: [Production Credentials Guide](./production/PRODUCTION_CREDENTIALS_VERIFICATION.md)

### I Need to Fix a Bug
1. Check [Audit Issues Status Tracker](./audits/AUDIT_ISSUES_STATUS_TRACKER.md)
2. Review [MASTER_FIXES_LOG.md](./MASTER_FIXES_LOG.md)
3. Check [DATABASE_TOOLS_TROUBLESHOOTING.md](./guides/DATABASE_TOOLS_TROUBLESHOOTING.md)
4. Review relevant audit report in [`audits/`](./audits/)

### I'm Creating a Feature
1. Review [COMPREHENSIVE_HRM_REVIEW_REPORT.md](./COMPREHENSIVE_HRM_REVIEW_REPORT.md)
2. Check API documentation: `http://localhost:5000/api-docs`
3. Review database schema in audit reports
4. Follow coding standards in [`../backend/README.md`](../backend/README.md)

### I'm Managing the Project
1. Check [Audit Issues Status Tracker](./audits/AUDIT_ISSUES_STATUS_TRACKER.md)
2. Review [MASTER_FIXES_LOG.md](./MASTER_FIXES_LOG.md)
3. See [RELEASE_2.0.0_ANNOUNCEMENT.md](./RELEASE_2.0.0_ANNOUNCEMENT.md)
4. Plan with [Production Readiness Report](./production/PRODUCTION_READINESS_REPORT.md)

---

## 🗂️ Archive

**Location**: [`../archive/`](../archive/)

The archive contains historical files for reference:
- **test-scripts/** - All test and validation scripts
- **debug-scripts/** - Debug and diagnostic scripts
- **old-docs/** - Superseded documentation
- **reports/** - Historical project reports
- **test-results/** - Past test execution results

> **Note**: Archive files are kept for reference but are not actively maintained.

---

## ⚠️ Important Information

### Production Server Details
All RedHat production server details are preserved in:
- [`../production/redhat-deployment/prod/`](../production/redhat-deployment/prod/)
- Configuration files with server specifications
- Deployment guides with server details
- Environment templates

### Security
- **Never commit** `.env` or `.env.production` files
- Follow [Production Credentials Verification](./production/PRODUCTION_CREDENTIALS_VERIFICATION.md)
- Keep sensitive information in secure vaults

### Current System Status
- **Version**: 2.0.0
- **Production Readiness**: 95%
- **Recent Audit**: Timesheet System (Oct 2025)
- **Outstanding Issues**: 13 non-critical items (tracked in audit tracker)

---

## 📞 Support & Resources

### Need Help?
1. **Documentation Issue**: Check if document exists in [`archive/old-docs/`](../archive/old-docs/)
2. **Technical Issue**: See troubleshooting guides
3. **Deployment Issue**: Check platform-specific docs in [`../production/`](../production/)

### External Resources
- **Swagger UI**: `http://localhost:5000/api-docs` (when running locally)
- **React Documentation**: https://react.dev/
- **Material-UI**: https://mui.com/
- **Express.js**: https://expressjs.com/
- **Sequelize**: https://sequelize.org/
- **PostgreSQL**: https://www.postgresql.org/docs/

---

## 🔄 Keeping Documentation Updated

When making changes:
1. Update relevant documentation
2. Update [MASTER_FIXES_LOG.md](./MASTER_FIXES_LOG.md)
3. Update this README if structure changes
4. Update [`../CHANGELOG.md`](../CHANGELOG.md)
5. Update audit tracker if fixing audited issues

---

## 📊 Documentation Statistics

- **Total Documentation Files**: 20+ core docs
- **Audit Reports**: 4 comprehensive audits
- **Production Guides**: 6 deployment documents
- **User Guides**: 4 reference guides
- **Archive**: 200+ historical documents

---

**Last Review**: October 26, 2025  
**Next Review**: Before next major release

---

*For complete codebase cleanup details, see [CODEBASE_CLEANUP_COMPLETE.md](../CODEBASE_CLEANUP_COMPLETE.md)*
