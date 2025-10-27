# 📚 SkyrakSys HRM - Developer Documentation

## 🎯 **Project Overview**

SkyrakSys HRM is a comprehensive Human Resource Management System built with modern web technologies. This documentation provides everything a developer needs to understand, maintain, and extend the system without any knowledge transfer.

---

## 🏗️ **Architecture Overview**

### **Technology Stack**
- **Frontend**: React.js 18+ with modern hooks and context API
- **Backend**: Node.js with Express.js framework
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Process Management**: PM2 for production
- **Web Server**: Nginx (reverse proxy)
- **Deployment**: Docker, SystemD services

### **System Architecture**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (PostgreSQL)  │
│   Port: 3000    │    │   Port: 8080    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        ▲                        ▲
        │                        │
┌─────────────────┐    ┌─────────────────┐
│   Nginx         │    │   File Storage  │
│   Port: 80/443  │    │   (uploads/)    │
└─────────────────┘    └─────────────────┘
```

---

## 📁 **Project Structure**

```
skyt_hrm/
├── 📂 backend/                 # Node.js API server
│   ├── 📂 config/             # Database and app configuration
│   ├── 📂 controllers/        # Route handlers and business logic
│   ├── 📂 middleware/         # Authentication, validation, logging
│   ├── 📂 models/             # Sequelize database models
│   ├── 📂 routes/             # API route definitions
│   ├── 📂 services/           # Business logic services
│   ├── 📂 utils/              # Helper functions and utilities
│   ├── 📄 server.js           # Main application entry point
│   └── 📄 package.json        # Dependencies and scripts
├── 📂 frontend/               # React.js web application
│   ├── 📂 public/             # Static assets
│   ├── 📂 src/               
│   │   ├── 📂 components/     # React components (organized by feature)
│   │   ├── 📂 contexts/       # React context providers
│   │   ├── 📂 services/       # API communication services
│   │   ├── 📂 utils/          # Helper functions
│   │   ├── 📄 App.js          # Main React component
│   │   └── 📄 index.js        # React application entry point
│   └── 📄 package.json        # Dependencies and build scripts
├── 📂 database/               # Database scripts and migrations
├── 📂 uploads/                # File upload storage
├── 📂 docs/                   # Documentation (this folder)
├── 📂 redhat/                 # Production deployment package
├── 📂 obsolete/               # Archived development files
└── 📄 ecosystem.config.js     # PM2 process management configuration
```

---

## 📖 **Documentation Index**

### **📘 Core Development Guides**
- **[API Documentation](./api/API_DOCUMENTATION.md)** - Complete API reference with examples
- **[Database Guide](./development/DATABASE.md)** - Schema, models, and queries
- **[Authentication Guide](./development/AUTHENTICATION.md)** - JWT, roles, and security
- **[Security Guide](./development/SECURITY.md)** - Security best practices
- **[Error Handling Guide](./development/ERROR_HANDLING.md)** - Error patterns and responses
- **[Testing Guide](./development/TESTING.md)** - Testing strategies and tools

### **🚀 Deployment Guides**
- **[Red Hat Production Setup](../redhat/README.md)** - Complete Linux deployment
- **[CI/CD Guide](./deployment/CICD_GUIDE.md)** - Automated deployment pipelines
- **[AWS Setup Guide](./deployment/AWS_SETUP.md)** - Cloud deployment
- **[Monitoring Guide](./deployment/MONITORING.md)** - System monitoring and alerts

### **🔧 Setup & Development**
- **[Development Setup](../DEVELOPMENT_SETUP.md)** - Local development environment
- **[Production Readiness](../PRODUCTION_READINESS_REPORT.md)** - Production checklist
2. Install dependencies
3. Configure environment variables
4. Start development servers

### 2. Development Process
1. Create feature branch
2. Implement changes
3. Write/update tests
4. Submit pull request
5. Code review
6. Merge to main

### 3. Deployment Process
1. Automated tests
2. Build artifacts
3. Deploy to staging
4. Run smoke tests
5. Deploy to production

## Security Requirements

### 1. Authentication
- JWT-based authentication
- Role-based access control
- Secure password policies
- Multi-factor authentication (optional)

### 2. Data Protection
- Data encryption at rest
- Secure communication (HTTPS)
- Input validation
- Output sanitization

### 3. Compliance
- GDPR compliance
- Data privacy
- Regular audits
- Security monitoring

## Maintenance

### 1. Regular Tasks
- Database backups
- Log rotation
- Security updates
- Performance monitoring

### 2. Monitoring
- Application metrics
- Server metrics
- Business metrics
- Error tracking

## Support

### 1. Development Support
- Issue tracking
- Code repository
- Development guidelines
- API documentation

### 2. Production Support
- Monitoring dashboards
- Alert management
- Incident response
- Backup/restore procedures

## Best Practices

### 1. Code Quality
- Code style guide
- Test coverage
- Code reviews
- Documentation

### 2. Security
- Security best practices
- Regular audits
- Vulnerability scanning
- Access control

### 3. Performance
- Performance monitoring
- Optimization guidelines
- Caching strategy
- Database indexing

## Additional Resources

### 1. External Documentation
- [Node.js Documentation](https://nodejs.org/docs)
- [React Documentation](https://react.dev)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [AWS Documentation](https://docs.aws.amazon.com/)

### 2. Tools
- [VS Code Setup](../DEVELOPMENT_SETUP.md#vs-code-configuration)
- [Development Scripts](../scripts/development/)
- [Testing Tools](../tests/README.md)
- [Deployment Tools](../scripts/deployment/)

## Version History

### Current Version
- Version: 1.0.0
- Release Date: September 11, 2025
- Status: Production Ready

### Change Log
- 1.0.0 - Initial production release
  - Complete HRM system implementation
  - Full documentation set
  - Production deployment ready
  - Security hardening complete

## Next Steps

### 1. Getting Started
1. Review [Development Setup](../DEVELOPMENT_SETUP.md)
2. Setup local environment
3. Run test suite
4. Explore documentation

### 2. Development
1. Follow coding standards
2. Write comprehensive tests
3. Document changes
4. Submit pull requests

### 3. Deployment
1. Review deployment guides
2. Setup CI/CD pipeline
3. Configure monitoring
4. Plan maintenance