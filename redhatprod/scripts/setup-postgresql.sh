#!/bin/bash

# PostgreSQL Setup Script for Skyraksys HRM on RHEL
# This script sets up PostgreSQL with proper configuration for production

echo "🗄️ PostgreSQL Setup for Skyraksys HRM"
echo "====================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Database configuration
DB_NAME="skyraksys_hrm"
DB_USER="skyraksys"
DB_PASSWORD="$(openssl rand -base64 32)"
POSTGRES_VERSION=""

echo ""
print_info "Starting PostgreSQL setup for RHEL production..."

# 1. Detect PostgreSQL version
print_info "Detecting PostgreSQL installation..."
if command -v psql > /dev/null 2>&1; then
    POSTGRES_VERSION=$(psql --version | grep -oP '\d+\.\d+' | head -1)
    print_status 0 "PostgreSQL $POSTGRES_VERSION detected"
else
    print_warning "PostgreSQL not found. Installing..."
    
    # Install PostgreSQL on RHEL
    if [ -f /etc/redhat-release ]; then
        dnf install -y postgresql postgresql-server postgresql-contrib
        if [ $? -eq 0 ]; then
            print_status 0 "PostgreSQL installed"
        else
            print_status 1 "Failed to install PostgreSQL"
            exit 1
        fi
    else
        print_status 1 "Not a RHEL system - manual PostgreSQL installation required"
        exit 1
    fi
fi

# 2. Initialize PostgreSQL database (if needed)
print_info "Checking PostgreSQL initialization..."
if [ ! -f /var/lib/pgsql/data/postgresql.conf ]; then
    print_info "Initializing PostgreSQL database..."
    sudo -u postgres /usr/bin/initdb -D /var/lib/pgsql/data
    print_status $? "PostgreSQL database initialized"
else
    print_status 0 "PostgreSQL already initialized"
fi

# 3. Configure PostgreSQL for production
print_info "Configuring PostgreSQL for production..."

# Backup original configuration
sudo cp /var/lib/pgsql/data/postgresql.conf /var/lib/pgsql/data/postgresql.conf.backup.$(date +%Y%m%d)

# Apply production configuration
sudo -u postgres tee -a /var/lib/pgsql/data/postgresql.conf.d/skyraksys_hrm.conf > /dev/null << EOF
# Skyraksys HRM Production Configuration
# Generated on $(date)

# Connection settings
listen_addresses = 'localhost'
port = 5432
max_connections = 100

# Memory settings (adjust based on server resources)
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB

# Write ahead log
wal_level = replica
max_wal_size = 1GB
min_wal_size = 80MB

# Query planner
random_page_cost = 1.1
effective_io_concurrency = 200

# Logging
log_destination = 'stderr'
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 10MB
log_min_duration_statement = 1000
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on

# Performance monitoring
track_activities = on
track_counts = on
track_functions = all
track_io_timing = on

# Autovacuum (important for production)
autovacuum = on
autovacuum_max_workers = 3
autovacuum_naptime = 1min
EOF

print_status $? "PostgreSQL configuration applied"

# 4. Configure pg_hba.conf for application access
print_info "Configuring PostgreSQL authentication..."
sudo -u postgres cp /var/lib/pgsql/data/pg_hba.conf /var/lib/pgsql/data/pg_hba.conf.backup.$(date +%Y%m%d)

# Add HRM application access
sudo -u postgres tee -a /var/lib/pgsql/data/pg_hba.conf > /dev/null << EOF

# Skyraksys HRM Application Access
# Generated on $(date)
local   $DB_NAME        $DB_USER                                md5
host    $DB_NAME        $DB_USER        127.0.0.1/32            md5
host    $DB_NAME        $DB_USER        ::1/128                 md5
EOF

print_status $? "PostgreSQL authentication configured"

# 5. Start and enable PostgreSQL service
print_info "Starting PostgreSQL service..."
systemctl enable postgresql
systemctl start postgresql
systemctl is-active --quiet postgresql
print_status $? "PostgreSQL service started"

# 6. Create database and user
print_info "Creating database and user..."
sudo -u postgres psql << EOF
-- Create user for Skyraksys HRM
CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';

-- Create database
CREATE DATABASE $DB_NAME OWNER $DB_USER;

-- Grant necessary privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

-- Connect to the database and set up schema permissions
\c $DB_NAME

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO $DB_USER;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO $DB_USER;

-- Display connection info
\l
\du
EOF

print_status $? "Database and user created"

# 7. Test database connection
print_info "Testing database connection..."
sudo -u postgres psql -d $DB_NAME -c "SELECT version();" > /dev/null 2>&1
print_status $? "Database connection test"

# 8. Create database configuration file for application
print_info "Creating database configuration..."
mkdir -p /opt/skyraksys-hrm/config

cat > /opt/skyraksys-hrm/config/database.env << EOF
# Skyraksys HRM Database Configuration
# Generated on $(date)

DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_SSL=false

# Connection pool settings
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_IDLE=10000
DB_POOL_ACQUIRE=60000

# Database URL for Sequelize
DATABASE_URL=postgres://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME
EOF

chmod 600 /opt/skyraksys-hrm/config/database.env
chown skyraksys:skyraksys /opt/skyraksys-hrm/config/database.env 2>/dev/null || chown root:root /opt/skyraksys-hrm/config/database.env

print_status $? "Database configuration created"

# 9. Set up backup script
print_info "Setting up database backup..."
cat > /opt/skyraksys-hrm/scripts/backup-database.sh << 'EOF'
#!/bin/bash

# PostgreSQL Backup Script for Skyraksys HRM
BACKUP_DIR="/opt/skyraksys-hrm/backups/database"
DB_NAME="skyraksys_hrm"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Create backup
sudo -u postgres pg_dump $DB_NAME | gzip > $BACKUP_DIR/skyraksys_hrm_$DATE.sql.gz

# Keep only last 7 days of backups
find $BACKUP_DIR -name "skyraksys_hrm_*.sql.gz" -mtime +7 -delete

echo "Database backup completed: skyraksys_hrm_$DATE.sql.gz"
EOF

chmod +x /opt/skyraksys-hrm/scripts/backup-database.sh
print_status $? "Database backup script created"

# 10. Set up daily backup cron job
print_info "Setting up daily backup cron job..."
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/skyraksys-hrm/scripts/backup-database.sh >> /var/log/skyraksys-hrm-backup.log 2>&1") | crontab -
print_status $? "Daily backup cron job configured"

# 11. Final status check
echo ""
echo -e "${BLUE}📊 PostgreSQL Setup Summary${NC}"
echo "=========================="
echo "✅ PostgreSQL version: $(sudo -u postgres psql -t -c 'SELECT version();' | head -1 | xargs)"
echo "✅ Database name: $DB_NAME"
echo "✅ Database user: $DB_USER"
echo "✅ Service status: $(systemctl is-active postgresql)"
echo "✅ Service enabled: $(systemctl is-enabled postgresql)"
echo ""
echo -e "${GREEN}🎉 PostgreSQL setup completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Update your application's database configuration:"
echo "   source /opt/skyraksys-hrm/config/database.env"
echo ""
echo "2. Run database migrations:"
echo "   cd /opt/skyraksys-hrm/skyraksys_hrm_app/backend"
echo "   npx sequelize-cli db:migrate --env production"
echo ""
echo "3. Test database connectivity:"
echo "   psql -h localhost -U $DB_USER -d $DB_NAME"
echo ""
echo -e "${YELLOW}⚠️  Important: Save the database password securely!${NC}"
echo "Database password: $DB_PASSWORD"
echo ""
echo -e "${GREEN}✨ PostgreSQL is now ready for Skyraksys HRM production!${NC}"