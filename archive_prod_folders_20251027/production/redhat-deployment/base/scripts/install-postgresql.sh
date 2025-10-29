#!/bin/bash

# SkyrakSys HRM - PostgreSQL Installation Script for Red Hat Linux
# Version: 2.0.0

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    print_error "This script must be run as root (use sudo)"
    exit 1
fi

print_status "Installing PostgreSQL 15 on Red Hat Linux..."

# Install PostgreSQL repository
print_status "Adding PostgreSQL repository..."
dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-8-x86_64/pgdg-redhat-repo-latest.noarch.rpm

# Install PostgreSQL packages
print_status "Installing PostgreSQL packages..."
dnf install -y postgresql15-server postgresql15 postgresql15-contrib

# Initialize database
print_status "Initializing PostgreSQL database..."
/usr/pgsql-15/bin/postgresql-15-setup initdb

# Start and enable PostgreSQL service
print_status "Starting PostgreSQL service..."
systemctl start postgresql-15
systemctl enable postgresql-15

# Configure PostgreSQL for local connections
print_status "Configuring PostgreSQL..."

# Backup original configuration files
cp /var/lib/pgsql/15/data/postgresql.conf /var/lib/pgsql/15/data/postgresql.conf.backup
cp /var/lib/pgsql/15/data/pg_hba.conf /var/lib/pgsql/15/data/pg_hba.conf.backup

# Update postgresql.conf
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" /var/lib/pgsql/15/data/postgresql.conf
sed -i "s/#port = 5432/port = 5432/" /var/lib/pgsql/15/data/postgresql.conf
sed -i "s/#max_connections = 100/max_connections = 200/" /var/lib/pgsql/15/data/postgresql.conf
sed -i "s/#shared_buffers = 128MB/shared_buffers = 256MB/" /var/lib/pgsql/15/data/postgresql.conf
sed -i "s/#effective_cache_size = 4GB/effective_cache_size = 1GB/" /var/lib/pgsql/15/data/postgresql.conf

# Update pg_hba.conf for MD5 authentication
sed -i "s/local   all             all                                     peer/local   all             all                                     md5/" /var/lib/pgsql/15/data/pg_hba.conf
sed -i "s/host    all             all             127.0.0.1\/32            ident/host    all             all             127.0.0.1\/32            md5/" /var/lib/pgsql/15/data/pg_hba.conf
sed -i "s/host    all             all             ::1\/128                 ident/host    all             all             ::1\/128                 md5/" /var/lib/pgsql/15/data/pg_hba.conf

# Restart PostgreSQL to apply configuration changes
print_status "Restarting PostgreSQL with new configuration..."
systemctl restart postgresql-15

# Set password for postgres user
print_status "Setting up database security..."
echo "Please set a password for the PostgreSQL 'postgres' user:"
sudo -u postgres psql -c "\password postgres"

# Create application database and user
print_status "Creating application database and user..."
echo "Creating database 'skyraksys_hrm' and user 'hrm_admin'..."
echo "Please enter a password for the 'hrm_admin' database user:"
read -s DB_PASSWORD

sudo -u postgres psql << EOF
CREATE DATABASE skyraksys_hrm;
CREATE USER hrm_admin WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE skyraksys_hrm TO hrm_admin;
ALTER USER hrm_admin CREATEDB;
\q
EOF

# Test connection
print_status "Testing database connection..."
sudo -u postgres psql -d skyraksys_hrm -c "SELECT version();"

# Display installation summary
print_status "PostgreSQL installation completed successfully!"
echo -e "\n${GREEN}Installation Summary:${NC}"
echo "• PostgreSQL Version: 15"
echo "• Service: postgresql-15"
echo "• Database: skyraksys_hrm"
echo "• Database User: hrm_admin"
echo "• Port: 5432"
echo "• Configuration: /var/lib/pgsql/15/data/"
echo "• Logs: /var/lib/pgsql/15/data/log/"

echo -e "\n${YELLOW}Management Commands:${NC}"
echo "• Status: sudo systemctl status postgresql-15"
echo "• Start: sudo systemctl start postgresql-15"
echo "• Stop: sudo systemctl stop postgresql-15"
echo "• Restart: sudo systemctl restart postgresql-15"
echo "• Connect: sudo -u postgres psql"
echo "• App DB: psql -h localhost -U hrm_admin -d skyraksys_hrm"

echo -e "\n${YELLOW}Important Files:${NC}"
echo "• Main config: /var/lib/pgsql/15/data/postgresql.conf"
echo "• Auth config: /var/lib/pgsql/15/data/pg_hba.conf"
echo "• Service file: /usr/lib/systemd/system/postgresql-15.service"

print_status "PostgreSQL is ready for SkyrakSys HRM!"
