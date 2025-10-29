# Skyraksys HRM Production Environment - RHEL 9.6

This directory contains all the necessary components for deploying and maintaining the Skyraksys HRM system on Red Hat Enterprise Linux 9.6.

## Directory Structure

```
redhatprod/
├── database/               # Database setup and configuration files
│   ├── 01_create_schema.sql     # Complete database schema
│   ├── 02_create_indexes.sql    # Performance optimization indexes
│   ├── 03_create_triggers.sql   # Business logic triggers
│   └── 04_insert_sample_data.sql # Sample data for testing
├── scripts/                # Deployment and installation scripts
│   ├── 01_install_prerequisites.sh  # System prerequisites
│   ├── 02_setup_database.sh        # Database setup automation
│   └── 03_deploy_application.sh    # Application deployment
├── configs/                # Production configuration files
│   ├── nginx-hrm.conf              # Nginx reverse proxy config
│   ├── hrm-backend.service         # Backend systemd service
│   └── hrm-frontend.service        # Frontend systemd service
├── maintenance/            # Maintenance and monitoring scripts
│   ├── health_check.sh             # System health monitoring
│   ├── database_maintenance.sh     # Database optimization
│   ├── backup_verification.sh      # Backup integrity verification
│   ├── performance_monitor.sh      # Performance monitoring
│   └── setup_cron.sh              # Automated task setup
└── RHEL_PRODUCTION_DEPLOYMENT_GUIDE.md  # Complete deployment guide
```

## Quick Start

1. **Prerequisites Installation**
   ```bash
   sudo ./scripts/01_install_prerequisites.sh
   ```

2. **Database Setup**
   ```bash
   sudo ./scripts/02_setup_database.sh
   ```

3. **Application Deployment**
   ```bash
   sudo ./scripts/03_deploy_application.sh
   ```

4. **Setup Automated Maintenance**
   ```bash
   sudo ./maintenance/setup_cron.sh
   ```

## Key Features

### Database Management
- **Complete Schema**: 15+ tables with relationships, constraints, and indexes
- **Performance Optimization**: GIN indexes for JSON data, composite indexes for common queries
- **Business Logic**: Triggers for audit logging, validation, and data consistency
- **Sample Data**: Realistic test data including Indian payroll calculations

### Automated Deployment
- **Prerequisites**: Automated installation of Node.js 18.x, PostgreSQL 15, Nginx
- **Database Setup**: Automated database creation, user setup, schema deployment
- **Application Deployment**: Multiple deployment methods (Git, ZIP, local copy)
- **Service Configuration**: Systemd services with security hardening

### Production Configuration
- **Nginx Reverse Proxy**: Rate limiting, compression, security headers
- **SSL Ready**: Easy SSL certificate integration (currently disabled as requested)
- **Service Management**: Systemd units with automatic restart and logging
- **Security**: SELinux compatibility, firewall configuration, user isolation

### Monitoring & Maintenance
- **Health Monitoring**: System resources, service status, database performance
- **Performance Monitoring**: Response times, database connections, query analysis
- **Automated Backups**: Daily database backups with compression and retention
- **Backup Verification**: Automated restore testing and integrity checks
- **Database Maintenance**: VACUUM, ANALYZE, cleanup, optimization
- **Alert System**: Email notifications for critical issues

## Database Schema Overview

The system includes the following main entities:

### Core Tables
- **users**: System authentication and authorization
- **employees**: Employee master data with department relationships
- **departments**: Organizational structure
- **positions**: Job positions and salary structures

### Payroll System
- **payslip_templates**: Configurable payslip templates with Indian compliance
- **payslips**: Generated payslips with calculation results
- **payslip_items**: Individual salary components (earnings/deductions)

### Time & Attendance
- **attendance**: Daily attendance records
- **leaves**: Leave applications and approvals
- **timesheets**: Weekly timesheet submissions
- **timesheet_entries**: Daily time entries with project/task tracking

### Project Management
- **projects**: Project master data
- **tasks**: Task management with time tracking

### Audit & Compliance
- **audit_logs**: Complete audit trail for all data changes

## Security Features

### Application Security
- JWT-based authentication with secure token handling
- Role-based access control (Admin, HR, Manager, Employee)
- Password encryption with bcrypt
- Input validation and sanitization
- SQL injection prevention with Sequelize ORM

### System Security
- SELinux compatibility mode
- Firewall configuration with minimal port exposure
- Service isolation with systemd security features
- File permission restrictions
- User privilege separation

### Data Security
- Database connection encryption
- Audit logging for all data modifications
- Backup encryption ready (implement as needed)
- Secure session management

## Performance Optimization

### Database Performance
- Optimized indexes for common query patterns
- JSON data indexing with GIN indexes
- Connection pooling configuration
- Query optimization for reporting

### Application Performance
- Node.js cluster mode for backend scaling
- React production build optimization
- Nginx compression and caching
- Static asset optimization

### System Performance
- Resource limits for services
- Memory and CPU monitoring
- Automated performance tuning recommendations
- Log rotation and cleanup

## Maintenance Schedule

### Automated Tasks
- **Every 5 minutes**: Health checks and service monitoring
- **Every 15 minutes**: Performance monitoring and alerting
- **Daily 2:00 AM**: Database backup creation
- **Daily 3:00 AM**: Backup verification and integrity testing
- **Weekly Sunday 1:00 AM**: Database maintenance (VACUUM, ANALYZE)
- **Monthly 1st midnight**: System optimization and cleanup

### Manual Tasks
- **Monthly**: Review performance reports and optimization recommendations
- **Quarterly**: Security updates and dependency upgrades
- **Annually**: Disaster recovery testing and documentation updates

## Troubleshooting

### Common Issues
1. **Service Not Starting**: Check systemd logs with `journalctl -u service-name`
2. **Database Connection Issues**: Verify PostgreSQL status and connection strings
3. **High Resource Usage**: Check performance monitoring logs
4. **Backup Failures**: Review backup verification reports
5. **Frontend ESM Error (ERR_REQUIRE_ESM)**: See the "Frontend ERR_REQUIRE_ESM" section in `RHEL_PRODUCTION_DEPLOYMENT_GUIDE.md`. Use Nginx to serve build or pin `serve@14` in systemd/PM2.

### Log Locations
- System logs: `/var/log/skyraksys-hrm/`
- Application logs: `/opt/skyraksys-hrm/logs/`
- Service logs: `journalctl -u hrm-backend` or `journalctl -u hrm-frontend`
- Database logs: PostgreSQL logs in `/var/lib/pgsql/15/data/log/`

### Monitoring Tools
- Health check: `sudo ./maintenance/health_check.sh`
- Performance check: `sudo ./maintenance/performance_monitor.sh`
- Database maintenance: `sudo ./maintenance/database_maintenance.sh`
- Backup verification: `sudo ./maintenance/backup_verification.sh`

## Support & Documentation

For detailed deployment instructions, see `RHEL_PRODUCTION_DEPLOYMENT_GUIDE.md`.

For application documentation, refer to the main project documentation in the parent directory.

## Environment Variables

Key environment variables for production:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skyraksys_hrm_prod
DB_USER=hrm_app
DB_PASS=secure_password_here

# Application
NODE_ENV=production
PORT=3001
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here

# Email (for notifications)
SMTP_HOST=your_smtp_server
SMTP_PORT=587
SMTP_USER=your_email@domain.com
SMTP_PASS=your_email_password
```

## Backup & Recovery

### Backup Strategy
- **Daily automated backups** with 30-day retention
- **Compressed storage** to minimize disk usage
- **Integrity verification** with automated restore testing
- **Multiple backup locations** (implement as needed)

### Recovery Procedures
1. **Database Recovery**: Use latest verified backup with `psql`
2. **Application Recovery**: Redeploy from Git repository or backup
3. **Configuration Recovery**: Restore from `/opt/skyraksys-hrm/configs/`
4. **Data Recovery**: Follow procedures in deployment guide

## Scalability Considerations

### Horizontal Scaling
- **Database**: PostgreSQL read replicas for reporting
- **Application**: Multiple backend instances behind load balancer
- **Static Assets**: CDN integration for frontend assets

### Vertical Scaling
- **Memory**: Increase PostgreSQL shared_buffers and work_mem
- **CPU**: Enable Node.js cluster mode
- **Storage**: SSD storage for database and application data

---

**Note**: This production environment is configured for RHEL 9.6 without SSL as requested. For SSL/TLS implementation, update the Nginx configuration and obtain appropriate certificates.