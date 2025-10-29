# 📚 SkyrakSys HRM - Comprehensive Guides

**Generated**: October 27, 2025  
**Version**: 2.0.0  
**Status**: Production Ready

---

## 📖 Documentation Structure

This `guides/` directory contains comprehensive documentation covering all aspects of the SkyrakSys HRM system, from architecture to user workflows.

### 📁 Available Guides

| Guide | Description | Audience |
|-------|-------------|----------|
| [**1. Technical Architecture**](./01-TECHNICAL_ARCHITECTURE.md) | System design, components, data flow, technology stack | Developers, Architects |
| [**2. Database Design**](./02-DATABASE_DESIGN.md) | Schema, relationships, indexing, optimization | DBAs, Backend Developers |
| [**3. API Reference**](./03-API_REFERENCE.md) | Complete API endpoints, authentication, examples | Frontend/Backend Developers |
| [**4. Security Guide**](./04-SECURITY_GUIDE.md) | Authentication, authorization, best practices | Security Engineers, Developers |
| [**5. Developer Guide**](./05-DEVELOPER_GUIDE.md) | Setup, coding standards, contribution guidelines | Developers |
| [**6. User Guide**](./06-USER_GUIDE.md) | Feature documentation, workflows by role | End Users, Admins, HR |
| [**7. Functional Flows**](./07-FUNCTIONAL_FLOWS.md) | Business processes, user journeys, workflows | Business Analysts, PMs |
| [**8. Deployment Guide**](./08-DEPLOYMENT_GUIDE.md) | Production deployment, configuration, monitoring | DevOps, SysAdmins |
| [**9. Testing Guide**](./09-TESTING_GUIDE.md) | E2E tests, unit tests, testing strategies | QA Engineers, Developers |
| [**10. Recommendations**](./10-RECOMMENDATIONS.md) | Improvements, optimizations, best practices | All Stakeholders |

---

## 🎯 Quick Navigation by Role

### For Developers
1. Start with [Technical Architecture](./01-TECHNICAL_ARCHITECTURE.md)
2. Read [Developer Guide](./05-DEVELOPER_GUIDE.md)
3. Review [API Reference](./03-API_REFERENCE.md)
4. Check [Security Guide](./04-SECURITY_GUIDE.md)

### For System Administrators
1. Read [Deployment Guide](./08-DEPLOYMENT_GUIDE.md)
2. Review [Security Guide](./04-SECURITY_GUIDE.md)
3. Check [Database Design](./02-DATABASE_DESIGN.md)

### For End Users
1. Start with [User Guide](./06-USER_GUIDE.md)
2. Review [Functional Flows](./07-FUNCTIONAL_FLOWS.md) for your role

### For Project Managers / Business Analysts
1. Read [Functional Flows](./07-FUNCTIONAL_FLOWS.md)
2. Review [User Guide](./06-USER_GUIDE.md)
3. Check [Recommendations](./10-RECOMMENDATIONS.md)

### For QA Engineers
1. Read [Testing Guide](./09-TESTING_GUIDE.md)
2. Review [API Reference](./03-API_REFERENCE.md)
3. Check [Functional Flows](./07-FUNCTIONAL_FLOWS.md)

---

## 🔍 System Overview

### What is SkyrakSys HRM?

SkyrakSys HRM is a comprehensive **Human Resources Management System** designed for modern enterprises. It provides end-to-end HR functionalities including:

✅ **Employee Management** - Complete lifecycle from onboarding to exit  
✅ **Leave Management** - Request, approval, balance tracking with multiple leave types  
✅ **Timesheet Management** - Weekly time tracking with project/task allocation  
✅ **Payroll Processing** - Automated payroll with Indian statutory compliance  
✅ **Attendance Tracking** - Daily attendance and work hour monitoring  
✅ **Performance Management** - Goals, reviews, and performance tracking  
✅ **Project & Task Management** - Work allocation and progress tracking  
✅ **Reporting & Analytics** - Comprehensive dashboards and reports  

### Technology Stack

**Backend**:
- Node.js 18+ with Express.js
- PostgreSQL 15+ with Sequelize ORM
- JWT authentication
- Winston logging
- RESTful API architecture

**Frontend**:
- React 18.3+ with Hooks
- Material-UI (MUI) components
- React Router v6 for navigation
- Axios for API communication
- Context API for state management

**Testing**:
- Playwright for E2E testing
- Jest for unit testing
- Page Object Model pattern

**Deployment**:
- PM2 for process management
- Nginx for reverse proxy
- Docker containerization support
- RHEL 9.6 production environment

---

## 📊 System Metrics

| Metric | Value |
|--------|-------|
| **Database Tables** | 15+ core tables |
| **API Endpoints** | 100+ RESTful endpoints |
| **User Roles** | 4 (Admin, HR, Manager, Employee) |
| **Leave Types** | 7 (Casual, Sick, Earned, etc.) |
| **Supported Browsers** | Chrome, Firefox, Safari, Edge |
| **E2E Test Coverage** | 80+ automated tests |
| **Code Quality** | Production-ready, peer-reviewed |

---

## 🚀 Key Features Highlights

### 1. Role-Based Access Control (RBAC)
- **Admin**: Full system access, user management
- **HR**: Employee management, payroll, leave approvals
- **Manager**: Team management, timesheet/leave approvals
- **Employee**: Self-service portal, leave/timesheet submission

### 2. Automated Workflows
- Leave request → Manager approval → HR approval
- Timesheet submission → Manager approval → Integration
- Payroll generation → Review → Approval → Payslip distribution

### 3. Indian Statutory Compliance
- PF (Provident Fund) calculation
- ESI (Employee State Insurance)
- Professional Tax
- TDS (Tax Deducted at Source)
- LWF (Labour Welfare Fund)

### 4. Comprehensive Reporting
- Employee demographics and analytics
- Leave utilization and trends
- Timesheet summaries and project allocation
- Payroll cost analysis
- Department-wise statistics

### 5. Security Features
- JWT token-based authentication
- Password encryption with bcrypt
- Role-based API authorization
- Input validation and sanitization
- SQL injection protection
- XSS protection
- CSRF protection
- Rate limiting
- Audit logging

---

## 📋 Documentation Conventions

### Notation Used

- ✅ **Working/Implemented**
- ❌ **Not Working/Missing**
- ⚠️ **Partial/Needs Attention**
- 🔄 **In Progress**
- 📝 **Documentation Only**
- 💡 **Recommendation**
- 🔒 **Security Related**
- ⚡ **Performance Related**

### Code Examples

All code examples in the guides use the following format:

```javascript
// Clear comments explaining the code
const exampleFunction = () => {
  // Implementation details
};
```

```bash
# Shell commands are prefixed with #
npm install
```

```sql
-- SQL queries are commented with --
SELECT * FROM employees WHERE status = 'Active';
```

---

## 🔗 Related Documentation

### External References
- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Playwright Documentation](https://playwright.dev/)
- [Material-UI Documentation](https://mui.com/)

### Internal Documentation
- Project root `README.md` for quick start
- Backend `README.md` for API details
- Frontend E2E `README.md` for testing
- Deployment guides in `redhatprod/`

---

## 🆘 Support & Contribution

### Getting Help
1. Check the relevant guide in this directory
2. Review the `docs/` folder for additional documentation
3. Check the troubleshooting sections in deployment guides
4. Review GitHub issues (if applicable)

### Contributing to Documentation
1. Follow the existing structure and formatting
2. Use clear, concise language
3. Include code examples where appropriate
4. Test all commands and code snippets
5. Update the table of contents when adding new sections

---

## 📅 Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | Oct 27, 2025 | Comprehensive guides created with technical review |
| 1.0.0 | Oct 2024 | Initial production release |

---

## 📞 Contact Information

For questions, suggestions, or issues:
- **Project Repository**: [GitHub URL]
- **Documentation Issues**: Create an issue with label `documentation`
- **Technical Support**: [Support Email/Channel]

---

**Note**: This documentation is continuously updated. Last comprehensive review: October 27, 2025.

---

## Next Steps

👉 **Start with**: [Technical Architecture Guide](./01-TECHNICAL_ARCHITECTURE.md) to understand the system design.
