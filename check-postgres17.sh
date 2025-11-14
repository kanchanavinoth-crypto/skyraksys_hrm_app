#!/bin/bash

# PostgreSQL 17 Detection and Setup Script for RHEL
# This script specifically handles PostgreSQL 17 installation

echo "🔍 PostgreSQL 17 Detection & Setup"
echo "=================================="

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

echo ""
print_info "Checking PostgreSQL 17 installation on RHEL..."

# Check if PostgreSQL 17 is installed
if rpm -qa | grep -q postgresql17; then
    print_status 0 "PostgreSQL 17 packages found"
    echo "Installed packages:"
    rpm -qa | grep postgresql17
else
    print_status 1 "PostgreSQL 17 packages not found"
fi

echo ""
print_info "Checking PostgreSQL service names..."

# Check various PostgreSQL service names
POSTGRES_SERVICES=("postgresql-17" "postgresql17" "postgresql@17-main" "postgresql")
FOUND_SERVICE=""

for service in "${POSTGRES_SERVICES[@]}"; do
    if systemctl list-unit-files | grep -q "$service"; then
        print_status 0 "Found service: $service"
        FOUND_SERVICE="$service"
        
        # Check if it's active
        if systemctl is-active --quiet "$service"; then
            echo "  Status: ACTIVE"
        else
            echo "  Status: INACTIVE"
        fi
        
        # Check if it's enabled
        if systemctl is-enabled --quiet "$service"; then
            echo "  Enabled: YES"
        else
            echo "  Enabled: NO"
        fi
    fi
done

if [ -z "$FOUND_SERVICE" ]; then
    print_warning "No PostgreSQL systemd service found"
fi

echo ""
print_info "Checking PostgreSQL processes..."
if pgrep -f "postgres" > /dev/null; then
    print_status 0 "PostgreSQL processes running"
    echo "Running processes:"
    pgrep -fa "postgres"
else
    print_status 1 "No PostgreSQL processes found"
fi

echo ""
print_info "Checking PostgreSQL installation paths..."

# Common PostgreSQL 17 paths
POSTGRES_PATHS=(
    "/usr/pgsql-17/bin/postgres"
    "/usr/bin/postgres"
    "/opt/postgresql/17/bin/postgres"
    "/usr/local/pgsql/bin/postgres"
)

for path in "${POSTGRES_PATHS[@]}"; do
    if [ -f "$path" ]; then
        print_status 0 "Found PostgreSQL binary: $path"
        VERSION=$($path --version 2>/dev/null || echo "unknown")
        echo "  Version: $VERSION"
    fi
done

echo ""
print_info "Checking data directory..."
DATA_DIRS=(
    "/var/lib/pgsql/17/data"
    "/var/lib/postgresql/17/main"
    "/var/lib/pgsql/data"
    "/opt/postgresql/17/data"
)

for datadir in "${DATA_DIRS[@]}"; do
    if [ -d "$datadir" ]; then
        print_status 0 "Found data directory: $datadir"
        if [ -f "$datadir/postgresql.conf" ]; then
            echo "  Configuration: EXISTS"
        else
            echo "  Configuration: MISSING"
        fi
    fi
done

echo ""
print_info "Testing database connectivity..."
# Try different connection methods
CONNECTION_METHODS=(
    "sudo -u postgres psql -c 'SELECT version();'"
    "psql -U postgres -c 'SELECT version();'"
    "/usr/pgsql-17/bin/psql -U postgres -c 'SELECT version();'"
)

for method in "${CONNECTION_METHODS[@]}"; do
    echo "Trying: $method"
    if eval "$method" > /dev/null 2>&1; then
        print_status 0 "Database connection successful"
        VERSION=$(eval "$method" 2>/dev/null | grep PostgreSQL || echo "Version unknown")
        echo "  $VERSION"
        break
    else
        print_status 1 "Connection method failed"
    fi
done

echo ""
print_info "PostgreSQL 17 Setup Recommendations:"
echo "===================================="

if [ -n "$FOUND_SERVICE" ]; then
    echo "1. Start PostgreSQL service:"
    echo "   systemctl start $FOUND_SERVICE"
    echo "   systemctl enable $FOUND_SERVICE"
else
    print_warning "Service not found. You may need to:"
    echo "1. Check PostgreSQL 17 installation:"
    echo "   dnf list installed | grep postgresql"
    echo "2. Install PostgreSQL 17 service files if missing"
fi

echo ""
echo "2. Create HRM database and user:"
echo "   sudo -u postgres createdb skyraksys_hrm"
echo "   sudo -u postgres createuser skyraksys"

echo ""
echo "3. Test connection:"
echo "   sudo -u postgres psql -d skyraksys_hrm"

echo ""
echo -e "${GREEN}✨ PostgreSQL 17 analysis completed!${NC}"