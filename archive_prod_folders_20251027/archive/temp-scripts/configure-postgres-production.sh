#!/bin/bash

# PostgreSQL Database Configuration Script for Production
# This script configures PostgreSQL for the Skyraksys HRM application

echo "Configuring PostgreSQL for Skyraksys HRM..."

# Variables
DB_NAME="skyraksys_hrm"
DB_USER="hrm_admin"
DB_PASSWORD="hrm_secure_2024"
POSTGRES_USER="postgres"

# Create database and user
echo "Creating database and user..."
sudo -u postgres psql <<EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER USER $DB_USER CREATEDB;
\q
EOF

# Configure PostgreSQL
echo "Configuring PostgreSQL settings..."
POSTGRES_VERSION=$(sudo -u postgres psql -t -c "SELECT version();" | grep -oP '\d+\.\d+')
CONFIG_DIR="/etc/postgresql/$POSTGRES_VERSION/main"

# Backup original configuration
sudo cp $CONFIG_DIR/postgresql.conf $CONFIG_DIR/postgresql.conf.backup
sudo cp $CONFIG_DIR/pg_hba.conf $CONFIG_DIR/pg_hba.conf.backup

# Update postgresql.conf for production
sudo tee -a $CONFIG_DIR/postgresql.conf > /dev/null <<EOF

# Skyraksys HRM Configuration
listen_addresses = 'localhost'
port = 5432
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
min_wal_size = 1GB
max_wal_size = 4GB
max_worker_processes = 8
max_parallel_workers_per_gather = 2
max_parallel_workers = 8

# Logging
log_destination = 'stderr'
logging_collector = on
log_directory = 'pg_log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_size = 10MB
log_min_duration_statement = 1000
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
log_temp_files = 0

# SSL
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'
EOF

# Update pg_hba.conf for application access
sudo sed -i "s/#local   replication     postgres                                peer/local   replication     postgres                                peer/" $CONFIG_DIR/pg_hba.conf
echo "local   $DB_NAME        $DB_USER                                md5" | sudo tee -a $CONFIG_DIR/pg_hba.conf
echo "host    $DB_NAME        $DB_USER        127.0.0.1/32            md5" | sudo tee -a $CONFIG_DIR/pg_hba.conf
echo "host    $DB_NAME        $DB_USER        ::1/128                 md5" | sudo tee -a $CONFIG_DIR/pg_hba.conf

# Restart PostgreSQL
echo "Restarting PostgreSQL..."
sudo systemctl restart postgresql

# Verify installation
echo "Verifying PostgreSQL configuration..."
sudo -u postgres psql -c "\l" | grep $DB_NAME
sudo -u postgres psql -c "\du" | grep $DB_USER

echo "PostgreSQL configuration completed successfully!"
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo "Connection: postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"

# Test connection
echo "Testing database connection..."
PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME -c "SELECT version();"

if [ $? -eq 0 ]; then
    echo "✅ Database connection successful!"
else
    echo "❌ Database connection failed!"
    exit 1
fi

echo "PostgreSQL is ready for Skyraksys HRM!"
