#!/bin/bash

# RHEL 9.6 Production Database Setup Script
# Skyraksys HRM System - Database Configuration
# Run as root user after prerequisites installation

set -e

echo "=========================================="
echo "RHEL 9.6 Database Setup"
echo "Skyraksys HRM System"
echo "=========================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=========================================="
    echo -e "$1"
    echo -e "==========================================${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script as root (sudo ./02_setup_database.sh)"
    exit 1
fi

# Check if PostgreSQL is running
if ! systemctl is-active --quiet postgresql-15; then
    print_error "PostgreSQL is not running. Please run ./01_install_prerequisites.sh first"
    exit 1
fi

# Database configuration
DB_NAME="skyraksys_hrm_prod"
DB_USER="hrm_app"
# Determine database password precedence:
# 1. DB_PASSWORD_OVERRIDE env var (explicit override)
# 2. Existing DB_PASSWORD env var (legacy support)
# 3. Previously generated persisted file (.db_password) for idempotent reruns
# 4. Fresh secure generation using openssl (fallback)
if [ -n "${DB_PASSWORD_OVERRIDE}" ]; then
    print_status "Using DB password from DB_PASSWORD_OVERRIDE environment variable"
    DB_PASSWORD="${DB_PASSWORD_OVERRIDE}"
elif [ -n "${DB_PASSWORD}" ]; then
    print_status "Using DB password from existing DB_PASSWORD environment variable"
    DB_PASSWORD="${DB_PASSWORD}"
else
    GEN_PW_FILE="/opt/skyraksys-hrm/.db_password"
    if [ -f "$GEN_PW_FILE" ]; then
        DB_PASSWORD="$(cat "$GEN_PW_FILE")"
        print_status "Reusing previously generated database password file (.db_password)"
    else
        if command -v openssl >/dev/null 2>&1; then
            DB_PASSWORD="$(openssl rand -base64 24 | tr -d '\n' | sed 's/[^A-Za-z0-9@#%&_+=-]//g')"
        else
            print_warning "openssl not found; using /dev/urandom fallback for password generation"
            DB_PASSWORD="$(tr -dc 'A-Za-z0-9@#%&_+=-' < /dev/urandom | head -c 24)"
        fi
        echo "$DB_PASSWORD" > "$GEN_PW_FILE"
        chmod 600 "$GEN_PW_FILE"
        print_status "Generated new secure database password and persisted to .db_password"
    fi
fi

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATABASE_SCRIPTS_DIR="$(dirname "$SCRIPT_DIR")/database"

print_header "DATABASE SETUP"
print_status "Database Name: $DB_NAME"
print_status "Database User: $DB_USER"
print_status "Script Directory: $DATABASE_SCRIPTS_DIR"

# Check if database scripts exist
if [ ! -d "$DATABASE_SCRIPTS_DIR" ]; then
    print_error "Database scripts directory not found: $DATABASE_SCRIPTS_DIR"
    exit 1
fi

# Check for required SQL files
required_files=("01_create_schema.sql" "02_create_indexes.sql" "03_create_triggers.sql" "04_insert_sample_data.sql")
for file in "${required_files[@]}"; do
    if [ ! -f "$DATABASE_SCRIPTS_DIR/$file" ]; then
        print_error "Required SQL file not found: $DATABASE_SCRIPTS_DIR/$file"
        exit 1
    fi
done

print_status "All required SQL files found"

# Optional integrity check (if checksum manifest exists)
CHECKSUM_FILE="$DATABASE_SCRIPTS_DIR/sql_checksums.sha256"
if [ -f "$CHECKSUM_FILE" ]; then
    print_status "Verifying SQL script integrity via sha256 sums..."
    (cd "$DATABASE_SCRIPTS_DIR" && sha256sum -c "$CHECKSUM_FILE") || print_warning "Checksum verification failed (proceeding anyway)."
else
    print_warning "No checksum file (sql_checksums.sha256) found - skipping integrity verification."
fi

# Create temporary SQL file with password
TEMP_SQL_FILE="/tmp/db_setup_temp.sql"
cat > "$TEMP_SQL_FILE" << EOF
-- Create database and user with secure password
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

-- Connect to the new database
\c $DB_NAME;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;
EOF

# Execute database creation
print_status "Checking for existing database..."
DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME';")
if [ "$DB_EXISTS" = "1" ]; then
    print_warning "Database $DB_NAME already exists - skipping creation (idempotent run)."
else
    print_status "Creating database and user..."
    sudo -u postgres psql -f "$TEMP_SQL_FILE"
fi

# Remove temporary file
rm "$TEMP_SQL_FILE"

# Update the SQL scripts with the correct password
print_status "Updating SQL scripts with secure password..."
sed -i "s/your_secure_password_here/$DB_PASSWORD/g" "$DATABASE_SCRIPTS_DIR/01_create_schema.sql"

print_header "CREATING DATABASE SCHEMA"
print_status "Executing 01_create_schema.sql (idempotent apply)..."
sudo -u postgres psql -d "$DB_NAME" -f "$DATABASE_SCRIPTS_DIR/01_create_schema.sql" || print_warning "Schema apply returned non-zero (possibly already applied)."

# Execute index creation
print_header "CREATING DATABASE INDEXES"
print_status "Executing 02_create_indexes.sql..."
sudo -u postgres psql -d "$DB_NAME" -f "$DATABASE_SCRIPTS_DIR/02_create_indexes.sql" || print_warning "Index creation script returned non-zero (possibly indexes exist)."

# Execute triggers creation
print_header "CREATING DATABASE TRIGGERS"
print_status "Executing 03_create_triggers.sql..."
sudo -u postgres psql -d "$DB_NAME" -f "$DATABASE_SCRIPTS_DIR/03_create_triggers.sql" || print_warning "Trigger creation script returned non-zero (possibly triggers exist)."

# Execute sample data insertion
print_header "INSERTING SAMPLE DATA"
print_status "Executing 04_insert_sample_data.sql (will skip duplicates if constraints exist)..."
sudo -u postgres psql -d "$DB_NAME" -f "$DATABASE_SCRIPTS_DIR/04_insert_sample_data.sql" || print_warning "Sample data script encountered errors (likely duplicate inserts)."

# Update environment file with database credentials
print_header "UPDATING ENVIRONMENT CONFIGURATION"
ENV_FILE="/opt/skyraksys-hrm/.env"
if [ -f "/opt/skyraksys-hrm/.env.template" ]; then
    print_status "Creating environment file from template..."
    cp /opt/skyraksys-hrm/.env.template "$ENV_FILE"
    
    # Update database configuration
    sed -i "s/DB_NAME=.*/DB_NAME=$DB_NAME/" "$ENV_FILE"
    sed -i "s/DB_USER=.*/DB_USER=$DB_USER/" "$ENV_FILE" || true
    # Backward compatibility: migrate any legacy DB_USERNAME= entries to DB_USER=
    if grep -q '^DB_USERNAME=' "$ENV_FILE"; then
        sed -i "s/^DB_USERNAME=.*/DB_USER=$DB_USER/" "$ENV_FILE"
    fi
    sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" "$ENV_FILE"
    
    # Generate JWT secret
    JWT_SECRET=$(openssl rand -base64 64 | tr -d "\\n")
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" "$ENV_FILE"
    
    # Generate session secret
    SESSION_SECRET=$(openssl rand -base64 32 | tr -d "\\n")
        sed -i "s/SESSION_SECRET=.*/SESSION_SECRET=$SESSION_SECRET/" "$ENV_FILE"
        # Persist generated DB password into env
        if grep -q '^DB_PASSWORD=' "$ENV_FILE"; then
            sed -i "s/^DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" "$ENV_FILE"
        else
            echo "DB_PASSWORD=$DB_PASSWORD" >> "$ENV_FILE"
        fi
    
    chown hrmapp:hrmapp "$ENV_FILE"
    chmod 600 "$ENV_FILE"
    
    print_status "Environment file created and configured"
else
    print_warning "Environment template not found. Please create .env manually"
fi

# Create database backup script
print_header "CREATING BACKUP SCRIPT"
BACKUP_SCRIPT="/opt/skyraksys-hrm/backup_database.sh"
cat > "$BACKUP_SCRIPT" << EOF
#!/bin/bash
# Database backup script for Skyraksys HRM
# Generated automatically by setup script

BACKUP_DIR="/opt/skyraksys-hrm/backups"
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="\$BACKUP_DIR/hrm_backup_\$DATE.sql"

# Create backup directory if it doesn't exist
mkdir -p "\$BACKUP_DIR"

# Create database backup
echo "Creating database backup..."
sudo -u postgres pg_dump -d $DB_NAME > "\$BACKUP_FILE"

# Compress backup
gzip "\$BACKUP_FILE"

echo "Backup created: \$BACKUP_FILE.gz"

# Remove backups older than 30 days
find "\$BACKUP_DIR" -name "hrm_backup_*.sql.gz" -mtime +30 -delete

echo "Database backup completed successfully"
EOF

chmod +x "$BACKUP_SCRIPT"
chown hrmapp:hrmapp "$BACKUP_SCRIPT"

# Create database restore script
RESTORE_SCRIPT="/opt/skyraksys-hrm/restore_database.sh"
cat > "$RESTORE_SCRIPT" << EOF
#!/bin/bash
# Database restore script for Skyraksys HRM
# Usage: ./restore_database.sh backup_file.sql.gz

if [ \$# -eq 0 ]; then
    echo "Usage: \$0 <backup_file.sql.gz>"
    echo "Available backups:"
    ls -la /opt/skyraksys-hrm/backups/hrm_backup_*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE="\$1"

if [ ! -f "\$BACKUP_FILE" ]; then
    echo "Backup file not found: \$BACKUP_FILE"
    exit 1
fi

echo "WARNING: This will restore the database from backup and overwrite current data!"
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "\$confirm" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

# Stop application services
echo "Stopping application services..."
systemctl stop hrm-backend 2>/dev/null || true
systemctl stop hrm-frontend 2>/dev/null || true

# Drop and recreate database
echo "Dropping existing database..."
sudo -u postgres dropdb $DB_NAME || true
sudo -u postgres createdb $DB_NAME
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

# Restore from backup
echo "Restoring database from backup..."
if [[ "\$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "\$BACKUP_FILE" | sudo -u postgres psql -d $DB_NAME
else
    sudo -u postgres psql -d $DB_NAME < "\$BACKUP_FILE"
fi

echo "Database restore completed successfully"
echo "Please restart application services manually"
EOF

chmod +x "$RESTORE_SCRIPT"
chown hrmapp:hrmapp "$RESTORE_SCRIPT"

# Set up daily backup cron job
print_status "Setting up daily backup cron job..."
(crontab -u hrmapp -l 2>/dev/null; echo "0 2 * * * /opt/skyraksys-hrm/backup_database.sh >> /var/log/skyraksys-hrm/backup.log 2>&1") | crontab -u hrmapp -

# Create database status check script
STATUS_SCRIPT="/opt/skyraksys-hrm/check_database.sh"
cat > "$STATUS_SCRIPT" << EOF
#!/bin/bash
# Database status check script for Skyraksys HRM

echo "=== Database Status Check ==="
echo "Date: \$(date)"
echo ""

# Check PostgreSQL service
echo "PostgreSQL Service Status:"
systemctl status postgresql-15 --no-pager -l

echo ""
echo "Database Connection Test:"
if sudo -u postgres psql -d $DB_NAME -c "SELECT 'Database connection successful' as status;" > /dev/null 2>&1; then
    echo "✅ Database connection: OK"
else
    echo "❌ Database connection: FAILED"
fi

echo ""
echo "Database Size:"
sudo -u postgres psql -d $DB_NAME -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME')) as database_size;"

echo ""
echo "Table Row Counts:"
sudo -u postgres psql -d $DB_NAME -c "
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows
FROM pg_stat_user_tables
ORDER BY schemaname, tablename;
"

echo ""
echo "Recent Database Activity:"
sudo -u postgres psql -d $DB_NAME -c "
SELECT 
    datname,
    numbackends as connections,
    xact_commit as commits,
    xact_rollback as rollbacks,
    blks_read as blocks_read,
    blks_hit as blocks_hit,
    stats_reset
FROM pg_stat_database 
WHERE datname = '$DB_NAME';
"
EOF

chmod +x "$STATUS_SCRIPT"
chown hrmapp:hrmapp "$STATUS_SCRIPT"

# Verify database setup
print_header "DATABASE VERIFICATION"
print_status "Testing database connection..."
if sudo -u postgres psql -d "$DB_NAME" -c "SELECT 'Database setup successful!' as status;" > /dev/null 2>&1; then
    print_status "✅ Database connection: OK"
else
    print_error "❌ Database connection: FAILED"
    exit 1
fi

# Check table creation
TABLE_COUNT=$(sudo -u postgres psql -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
print_status "Tables created: $TABLE_COUNT"

# Check sample data
USER_COUNT=$(sudo -u postgres psql -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")
print_status "Sample users created: $USER_COUNT"

EMPLOYEE_COUNT=$(sudo -u postgres psql -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM employees;" 2>/dev/null || echo "0")
print_status "Sample employees created: $EMPLOYEE_COUNT"

# Display final information
print_header "DATABASE SETUP COMPLETE"
print_status "Database Name: $DB_NAME"
print_status "Database User: $DB_USER"
print_status "Database Password: [HIDDEN - stored in /opt/skyraksys-hrm/.env and /opt/skyraksys-hrm/.db_password]"
print_status ""
print_status "Scripts created:"
print_status "- Backup script: $BACKUP_SCRIPT"
print_status "- Restore script: $RESTORE_SCRIPT"
print_status "- Status check: $STATUS_SCRIPT"
print_status ""
print_status "Daily backup scheduled at 02:00 AM"
print_status ""
print_status "Default admin credentials:"
print_status "Username: admin"
print_status "Password: password123"
print_status ""
print_status "HR Manager credentials:"
print_status "Username: hr_manager"
print_status "Password: password123"
print_status ""
print_warning "IMPORTANT: Please change default passwords after first login!"
print_status ""
print_status "Next step: Run ./03_deploy_application.sh to deploy the application"

echo "Database setup completed at: $(date)"