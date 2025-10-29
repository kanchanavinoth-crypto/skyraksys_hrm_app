#!/bin/bash

################################################################################
# Skyraksys HRM - PostgreSQL Database Setup Script (Sequelize Version)
# RHEL 9.6 Production Environment
################################################################################
# 
# This script automates PostgreSQL database setup for production deployment.
# 
# WHAT THIS SCRIPT DOES:
# 1. Installs PostgreSQL 17.x from official repository
# 2. Initializes and configures PostgreSQL server
# 3. Creates production database and application user
# 4. Executes Sequelize migrations (schema creation)
# 5. Optionally seeds sample data using Sequelize seeders
# 6. Sets up automated daily backups with cron
# 7. Creates database maintenance scripts
# 8. Configures proper security settings
#
# UPDATED: January 2025
# - Replaced manual SQL files with Sequelize migration system
# - Added Sequelize seeder support
# - Improved error handling and idempotency
# - Enhanced security configurations
#
################################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/opt/skyraksys-hrm"
BACKEND_DIR="${APP_DIR}/backend"
BACKUP_DIR="${APP_DIR}/backups"
LOG_FILE="/var/log/skyraksys-hrm/database-setup.log"
DB_PASSWORD_FILE="${APP_DIR}/.db_password"

# Default database configuration (can be overridden by .env file)
DB_NAME="skyraksys_hrm_prod"
DB_USER="hrm_app"
DB_HOST="localhost"
DB_PORT="5432"

################################################################################
# Utility Functions
################################################################################

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root (use sudo)"
    fi
}

# Check if PostgreSQL is already installed
check_postgres_installed() {
    if command -v psql &> /dev/null; then
        info "PostgreSQL is already installed"
        psql --version | tee -a "$LOG_FILE"
        return 0
    else
        return 1
    fi
}

################################################################################
# Database Password Management
################################################################################

generate_db_password() {
    log "Generating secure database password..."
    
    if [[ -f "$DB_PASSWORD_FILE" ]]; then
        warn "Database password file already exists: $DB_PASSWORD_FILE"
        info "Using existing password. Delete this file to regenerate."
        DB_PASSWORD=$(cat "$DB_PASSWORD_FILE")
    else
        # Generate a secure random password (32 characters)
        if command -v openssl &> /dev/null; then
            DB_PASSWORD=$(openssl rand -base64 32 | tr -dc 'A-Za-z0-9!@#$%^&*' | head -c 32)
        else
            DB_PASSWORD=$(< /dev/urandom tr -dc 'A-Za-z0-9!@#$%^&*' | head -c 32)
        fi
        
        # Save password securely
        echo "$DB_PASSWORD" > "$DB_PASSWORD_FILE"
        chmod 600 "$DB_PASSWORD_FILE"
        chown hrmapp:hrmapp "$DB_PASSWORD_FILE" 2>/dev/null || true
        
        log "✓ Database password generated and saved to: $DB_PASSWORD_FILE"
        info "IMPORTANT: Save this password in a secure location!"
    fi
}

################################################################################
# PostgreSQL Installation
################################################################################

install_postgresql() {
    log "Installing PostgreSQL 17.x..."
    
    # Install PostgreSQL 17 repository
    info "Adding PostgreSQL official repository..."
    dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-9-x86_64/pgdg-redhat-repo-latest.noarch.rpm
    
    # Disable built-in PostgreSQL module to use official repo
    dnf -qy module disable postgresql
    
    # Install PostgreSQL 17
    info "Installing PostgreSQL 17 server and contrib packages..."
    dnf install -y postgresql17 postgresql17-server postgresql17-contrib
    
    log "✓ PostgreSQL 17 installed successfully"
}

################################################################################
# PostgreSQL Configuration
################################################################################

initialize_postgresql() {
    log "Initializing PostgreSQL database cluster..."
    
    # Check if already initialized
    if [[ -f "/var/lib/pgsql/17/data/PG_VERSION" ]]; then
        warn "PostgreSQL cluster already initialized"
        return 0
    fi
    
    # Initialize database cluster
    /usr/pgsql-17/bin/postgresql-17-setup initdb
    
    log "✓ PostgreSQL cluster initialized"
}

configure_postgresql() {
    log "Configuring PostgreSQL..."
    
    local PG_HBA="/var/lib/pgsql/17/data/pg_hba.conf"
    local PG_CONF="/var/lib/pgsql/17/data/postgresql.conf"
    
    # Backup original configuration
    if [[ ! -f "${PG_HBA}.backup" ]]; then
        cp "$PG_HBA" "${PG_HBA}.backup"
        cp "$PG_CONF" "${PG_CONF}.backup"
    fi
    
    # Configure pg_hba.conf for local access
    info "Configuring client authentication..."
    cat > "$PG_HBA" <<EOF
# PostgreSQL Client Authentication Configuration
# Generated by Skyraksys HRM setup script
# TYPE  DATABASE        USER            ADDRESS                 METHOD

# "local" is for Unix domain socket connections only
local   all             all                                     peer
# IPv4 local connections:
host    all             all             127.0.0.1/32            scram-sha-256
# IPv6 local connections:
host    all             all             ::1/128                 scram-sha-256
# Allow replication connections from localhost
local   replication     all                                     peer
host    replication     all             127.0.0.1/32            scram-sha-256
host    replication     all             ::1/128                 scram-sha-256
EOF
    
    # Configure postgresql.conf for production
    info "Configuring PostgreSQL server parameters..."
    
    # Performance tuning (adjust based on server specs)
    cat >> "$PG_CONF" <<EOF

# Skyraksys HRM Production Configuration
# Added by setup script

# Connection Settings
listen_addresses = 'localhost'
max_connections = 100
port = 5432

# Memory Settings (adjust based on available RAM)
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
work_mem = 4MB

# Write Ahead Log
wal_level = replica
max_wal_size = 1GB
min_wal_size = 80MB

# Query Planner
random_page_cost = 1.1
effective_io_concurrency = 200

# Logging
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_timezone = 'UTC'

# Statistics
track_activities = on
track_counts = on
track_io_timing = on
track_functions = all

# Locale and Formatting
datestyle = 'iso, mdy'
timezone = 'UTC'
lc_messages = 'en_US.UTF-8'
lc_monetary = 'en_US.UTF-8'
lc_numeric = 'en_US.UTF-8'
lc_time = 'en_US.UTF-8'
default_text_search_config = 'pg_catalog.english'
EOF
    
    log "✓ PostgreSQL configured for production"
}

start_postgresql() {
    log "Starting PostgreSQL service..."
    
    systemctl enable postgresql-17
    systemctl start postgresql-17
    
    # Wait for PostgreSQL to be ready
    sleep 3
    
    if systemctl is-active --quiet postgresql-17; then
        log "✓ PostgreSQL service started successfully"
    else
        error "Failed to start PostgreSQL service"
    fi
}

################################################################################
# Database and User Creation
################################################################################

create_database_and_user() {
    log "Creating database and application user..."
    
    # Check if database already exists
    if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        warn "Database '$DB_NAME' already exists"
    else
        info "Creating database: $DB_NAME"
        sudo -u postgres psql -c "CREATE DATABASE $DB_NAME ENCODING 'UTF8' LC_COLLATE='en_US.UTF-8' LC_CTYPE='en_US.UTF-8' TEMPLATE template0;"
        log "✓ Database '$DB_NAME' created"
    fi
    
    # Check if user already exists
    if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1; then
        warn "User '$DB_USER' already exists"
        info "Updating user password..."
        sudo -u postgres psql -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
    else
        info "Creating user: $DB_USER"
        sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
        log "✓ User '$DB_USER' created"
    fi
    
    # Grant privileges
    info "Granting privileges..."
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    sudo -u postgres psql -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;"
    sudo -u postgres psql -d "$DB_NAME" -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;"
    sudo -u postgres psql -d "$DB_NAME" -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;"
    
    log "✓ Database and user configured successfully"
}

################################################################################
# Sequelize Migration Execution
################################################################################

run_sequelize_migrations() {
    log "Running Sequelize migrations..."
    
    # Check if backend directory exists
    if [[ ! -d "$BACKEND_DIR" ]]; then
        error "Backend directory not found: $BACKEND_DIR"
    fi
    
    # Check if .env file exists
    if [[ ! -f "${BACKEND_DIR}/.env" ]]; then
        warn ".env file not found in backend directory"
        info "Please ensure .env file is configured before running migrations"
        return 1
    fi
    
    # Navigate to backend directory
    cd "$BACKEND_DIR" || error "Failed to change to backend directory"
    
    # Check if node_modules exists
    if [[ ! -d "node_modules" ]]; then
        warn "node_modules not found. Running npm install..."
        sudo -u hrmapp npm install
    fi
    
    # Run migrations as hrmapp user
    info "Executing Sequelize migrations..."
    sudo -u hrmapp npx sequelize-cli db:migrate
    
    if [[ $? -eq 0 ]]; then
        log "✓ Database migrations completed successfully"
    else
        error "Database migration failed. Check logs for details."
    fi
    
    # Show applied migrations
    info "Applied migrations:"
    sudo -u postgres psql -d "$DB_NAME" -c "SELECT * FROM \"SequelizeMeta\" ORDER BY name;"
}

################################################################################
# Sequelize Seeder Execution (Optional)
################################################################################

run_sequelize_seeders() {
    log "Running Sequelize seeders (optional)..."
    
    # Ask if user wants to seed data
    read -p "Do you want to seed sample data? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd "$BACKEND_DIR" || error "Failed to change to backend directory"
        
        info "Executing Sequelize seeders..."
        sudo -u hrmapp npx sequelize-cli db:seed:all
        
        if [[ $? -eq 0 ]]; then
            log "✓ Database seeding completed successfully"
        else
            warn "Database seeding failed or partially completed"
        fi
    else
        info "Skipping database seeding"
    fi
}

################################################################################
# Backup Configuration
################################################################################

setup_backup_scripts() {
    log "Setting up database backup scripts..."
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    chown hrmapp:hrmapp "$BACKUP_DIR"
    chmod 750 "$BACKUP_DIR"
    
    # Create backup script
    local BACKUP_SCRIPT="${APP_DIR}/scripts/backup-database.sh"
    cat > "$BACKUP_SCRIPT" <<'EOF'
#!/bin/bash
# Database Backup Script
# Generated by Skyraksys HRM setup

BACKUP_DIR="/opt/skyraksys-hrm/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/hrm_backup_${DATE}.sql.gz"
DB_NAME="skyraksys_hrm_prod"
RETENTION_DAYS=30

# Create backup
echo "Starting database backup..."
sudo -u postgres pg_dump -Fc "$DB_NAME" | gzip > "$BACKUP_FILE"

if [[ $? -eq 0 ]]; then
    echo "✓ Backup created: $BACKUP_FILE"
    chmod 600 "$BACKUP_FILE"
    
    # Remove old backups
    find "$BACKUP_DIR" -name "hrm_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    echo "✓ Old backups cleaned (retention: ${RETENTION_DAYS} days)"
else
    echo "✗ Backup failed"
    exit 1
fi
EOF
    
    chmod +x "$BACKUP_SCRIPT"
    chown hrmapp:hrmapp "$BACKUP_SCRIPT"
    
    # Create restore script
    local RESTORE_SCRIPT="${APP_DIR}/scripts/restore-database.sh"
    cat > "$RESTORE_SCRIPT" <<'EOF'
#!/bin/bash
# Database Restore Script
# Generated by Skyraksys HRM setup

if [[ -z "$1" ]]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    echo "Available backups:"
    ls -lh /opt/skyraksys-hrm/backups/hrm_backup_*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"
DB_NAME="skyraksys_hrm_prod"

if [[ ! -f "$BACKUP_FILE" ]]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

read -p "This will OVERWRITE the current database. Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restore cancelled"
    exit 0
fi

echo "Restoring database from: $BACKUP_FILE"
gunzip -c "$BACKUP_FILE" | sudo -u postgres pg_restore -d "$DB_NAME" --clean --if-exists

if [[ $? -eq 0 ]]; then
    echo "✓ Database restored successfully"
else
    echo "✗ Restore failed"
    exit 1
fi
EOF
    
    chmod +x "$RESTORE_SCRIPT"
    chown hrmapp:hrmapp "$RESTORE_SCRIPT"
    
    log "✓ Backup scripts created"
}

setup_cron_backup() {
    log "Setting up automated daily backups..."
    
    # Add cron job for daily backup at 2 AM
    local CRON_JOB="0 2 * * * /opt/skyraksys-hrm/scripts/backup-database.sh >> /var/log/skyraksys-hrm/backup.log 2>&1"
    
    # Check if cron job already exists
    if crontab -u hrmapp -l 2>/dev/null | grep -q "backup-database.sh"; then
        warn "Backup cron job already exists"
    else
        (crontab -u hrmapp -l 2>/dev/null; echo "$CRON_JOB") | crontab -u hrmapp -
        log "✓ Daily backup scheduled (2:00 AM)"
    fi
}

################################################################################
# Database Verification
################################################################################

create_db_check_script() {
    log "Creating database status check script..."
    
    local CHECK_SCRIPT="${APP_DIR}/scripts/check-database.sh"
    cat > "$CHECK_SCRIPT" <<'EOF'
#!/bin/bash
# Database Status Check Script

DB_NAME="skyraksys_hrm_prod"
DB_USER="hrm_app"

echo "=== PostgreSQL Database Status ==="
echo

# Check PostgreSQL service
echo "1. PostgreSQL Service Status:"
systemctl status postgresql-17 --no-pager | grep "Active:"
echo

# Check database existence
echo "2. Database: $DB_NAME"
sudo -u postgres psql -lqt | grep -w "$DB_NAME" || echo "Database not found"
echo

# Check user existence
echo "3. Database User: $DB_USER"
sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 && echo "User exists" || echo "User not found"
echo

# Check database size
echo "4. Database Size:"
sudo -u postgres psql -d "$DB_NAME" -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME')) as size;"
echo

# Check tables (Sequelize)
echo "5. Database Tables:"
sudo -u postgres psql -d "$DB_NAME" -c "\dt"
echo

# Check migrations
echo "6. Applied Migrations:"
sudo -u postgres psql -d "$DB_NAME" -c "SELECT name FROM \"SequelizeMeta\" ORDER BY name;" 2>/dev/null || echo "Migration table not found"
echo

# Check connections
echo "7. Active Connections:"
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity WHERE datname = '$DB_NAME';"
echo

echo "=== Check Complete ==="
EOF
    
    chmod +x "$CHECK_SCRIPT"
    chown hrmapp:hrmapp "$CHECK_SCRIPT"
    
    log "✓ Database check script created: $CHECK_SCRIPT"
}

################################################################################
# Main Installation Flow
################################################################################

main() {
    log "=== Skyraksys HRM - Database Setup (Sequelize Version) ==="
    echo
    
    # Pre-flight checks
    check_root
    
    # Create log directory if it doesn't exist
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Step 1: Generate database password
    generate_db_password
    echo
    
    # Step 2: Install PostgreSQL (if needed)
    if ! check_postgres_installed; then
        install_postgresql
    fi
    echo
    
    # Step 3: Initialize PostgreSQL
    initialize_postgresql
    echo
    
    # Step 4: Configure PostgreSQL
    configure_postgresql
    echo
    
    # Step 5: Start PostgreSQL
    start_postgresql
    echo
    
    # Step 6: Create database and user
    create_database_and_user
    echo
    
    # Step 7: Run Sequelize migrations
    run_sequelize_migrations
    echo
    
    # Step 8: Optionally run seeders
    run_sequelize_seeders
    echo
    
    # Step 9: Setup backups
    setup_backup_scripts
    setup_cron_backup
    echo
    
    # Step 10: Create verification script
    create_db_check_script
    echo
    
    # Final summary
    log "=== Database Setup Complete ==="
    echo
    info "Database Name: $DB_NAME"
    info "Database User: $DB_USER"
    info "Password File: $DB_PASSWORD_FILE"
    info "Backup Location: $BACKUP_DIR"
    info "Check Script: ${APP_DIR}/scripts/check-database.sh"
    echo
    warn "IMPORTANT: Update your .env file with the database credentials:"
    echo "  DB_NAME=$DB_NAME"
    echo "  DB_USER=$DB_USER"
    echo "  DB_PASSWORD=<from $DB_PASSWORD_FILE>"
    echo
    log "✓ All done! Your database is ready for use."
}

# Execute main function
main "$@"
