# Database Setup Guide - SkyRakSys HRM

This guide covers database setup, schema creation, and data management for the SkyRakSys HRM system.

## 🗄️ Database Scripts Available

### 1. Core Database Scripts

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `setup-postgresql.sh` | Install and configure PostgreSQL | Initial setup or new PostgreSQL installation |
| `create-database-schema.sh` | Create all tables, indexes, and constraints | First-time setup or after database reset |
| `seed-initial-data.sh` | Insert essential system data | After schema creation |
| `create-test-data.sh` | Generate comprehensive test data | Development and testing |

### 2. Management Scripts

| Script | Purpose |
|--------|---------|
| `manage-database.sh` | Interactive database management menu |
| `../backup.sh` | Create database backups |
| `../health-check.sh` | Check database connectivity and health |

## 🚀 Quick Setup

### Option 1: Automated Setup (Recommended)
```bash
# Run the main setup script
sudo ./setup-production.sh

# Select option 1 for PostgreSQL when prompted
# Follow the interactive prompts for schema and data creation
```

### Option 2: Manual Step-by-Step
```bash
# 1. Install PostgreSQL
sudo ./scripts/setup-postgresql.sh

# 2. Create database schema
./scripts/create-database-schema.sh

# 3. Seed initial data
./scripts/seed-initial-data.sh

# 4. (Optional) Create test data
./scripts/create-test-data.sh
```

### Option 3: Interactive Management
```bash
# Use the database management menu
./manage-database.sh
```

## 📊 Database Schema Overview

### Core Tables

#### User Management
- **users** - User accounts and authentication
- **employees** - Employee profiles and information

#### Organizational Structure
- **departments** - Company departments
- **projects** - Project management
- **tasks** - Task tracking and assignment
- **employee_projects** - Many-to-many relationship

#### HR Operations
- **attendance** - Daily attendance tracking
- **leave_requests** - Leave/vacation requests
- **performance_reviews** - Employee performance evaluations

#### Payroll & Finance
- **payroll** - Payroll calculations and records
- **salary_structures** - Position-based salary ranges

#### System & Audit
- **system_settings** - Application configuration
- **audit_logs** - System activity tracking
- **file_uploads** - File management metadata

### Database Features

#### Enums (Predefined Values)
- User roles: `admin`, `hr`, `manager`, `employee`
- Employee status: `active`, `inactive`, `terminated`
- Leave types: `vacation`, `sick`, `personal`, `maternity`, `paternity`, `emergency`
- Project/Task status and priorities

#### Indexes
- Performance-optimized indexes on frequently queried columns
- Composite indexes for common query patterns

#### Triggers
- Automatic `updated_at` timestamp updates
- Data validation and consistency checks

#### Views
- `employee_details` - Complete employee information with user data
- `project_progress` - Project completion statistics
- `employee_attendance_summary` - Monthly attendance summaries

#### Functions
- `calculate_working_days()` - Business day calculations
- `get_employee_hierarchy()` - Organizational hierarchy queries

## 🔐 Default User Accounts

After running `seed-initial-data.sh`, these accounts are available:

| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| Admin | admin@skyraksys.com | admin123 | System administration |
| HR Manager | hr@skyraksys.com | admin123 | HR operations |
| Project Manager | manager@skyraksys.com | admin123 | Project management |

**⚠️ Important:** Change these default passwords immediately after first login!

## 📈 Test Data Overview

The `create-test-data.sh` script creates:

- **27 employees** across all departments with realistic profiles
- **8 projects** with multiple tasks and assignments
- **3 months** of attendance records with realistic patterns
- **Leave requests** in various states (pending, approved, rejected)
- **Payroll records** for the last 6 months
- **Performance reviews** for sample employees
- **Audit logs** for system activity tracking

### Test Employee Accounts

Sample employee accounts (password: admin123):
- john.doe@skyraksys.com (Senior Software Engineer)
- jane.smith@skyraksys.com (Software Engineer) 
- lisa.garcia@skyraksys.com (HR Specialist)
- amanda.white@skyraksys.com (Senior Sales Rep)
- And 20+ more across all departments

## 🛠️ Database Management

### Check Database Status
```bash
./manage-database.sh
# Select option 8 to check database status
```

### Create Backup
```bash
# Automated backup
../backup.sh

# Manual backup
pg_dump -h localhost -U hrm_user -d skyraksys_hrm > backup_$(date +%Y%m%d).sql
```

### Reset Database (CAUTION)
```bash
./manage-database.sh
# Select option 5 - WARNING: This deletes all data!
```

### Restore from Backup
```bash
./manage-database.sh
# Select option 7 and provide backup file path
```

## 🔧 Configuration

### Environment Variables

Key database-related environment variables in `.env`:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skyraksys_hrm
DB_USER=hrm_user
DB_PASSWORD=your_secure_password

# Database Connection Pool
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_TIMEOUT=30000

# SSL Settings (for cloud databases)
DB_SSL=false
DB_SSL_REJECT_UNAUTHORIZED=false
```

### PostgreSQL Configuration

For production optimization, consider these PostgreSQL settings:

```sql
-- In postgresql.conf or via ALTER SYSTEM
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET random_page_cost = 1.1;  -- For SSD storage
SELECT pg_reload_conf();
```

## 🚨 Troubleshooting

### Common Issues

#### Connection Failed
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check if PostgreSQL is listening
sudo ss -tulpn | grep :5432

# Check logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

#### Permission Denied
```bash
# Check database user permissions
sudo -u postgres psql -c "\du"

# Grant necessary permissions
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE skyraksys_hrm TO hrm_user;"
```

#### Schema Creation Failed
```bash
# Check for existing tables
psql -h localhost -U hrm_user -d skyraksys_hrm -c "\dt"

# View detailed error messages
./scripts/create-database-schema.sh
# Check /tmp/schema.sql for the generated SQL
```

#### Data Seeding Failed
```bash
# Check for missing dependencies
psql -h localhost -U hrm_user -d skyraksys_hrm -c "SELECT * FROM information_schema.tables WHERE table_schema = 'public';"

# Verify user permissions
psql -h localhost -U hrm_user -d skyraksys_hrm -c "SELECT current_user, session_user;"
```

### Log Files

Database-related logs are located in:
- PostgreSQL logs: `/var/log/postgresql/`
- Application logs: `./logs/backend/`
- Setup script logs: Check terminal output

### Getting Help

1. **Check database status**: `./manage-database.sh` → Option 8
2. **Run health check**: `../health-check.sh`
3. **Review logs**: `tail -f logs/backend/error.log`
4. **Test connection**: `psql -h localhost -U hrm_user -d skyraksys_hrm -c "SELECT NOW();"`

## 📚 Additional Resources

- [PostgreSQL Documentation](https://postgresql.org/docs/)
- [Node.js PostgreSQL Guide](https://node-postgres.com/)
- [Database Design Best Practices](https://wiki.postgresql.org/wiki/Don%27t_Do_This)

---

For more information, see the main [README.md](README.md) file.
