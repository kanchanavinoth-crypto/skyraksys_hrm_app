#!/bin/bash

# =============================================================================
# PostgreSQL Startup Fix for RHEL Production Deployment
# =============================================================================
# This script fixes common PostgreSQL startup issues on RHEL systems

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() { 
    echo -e "${BLUE}[$(date '+%H:%M:%S')] ℹ️  $1${NC}"
}

print_success() { 
    echo -e "${GREEN}[$(date '+%H:%M:%S')] ✅ $1${NC}"
}

print_error() { 
    echo -e "${RED}[$(date '+%H:%M:%S')] ❌ $1${NC}"
}

print_warning() { 
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠️  $1${NC}"
}

echo "==============================================================================" 
echo "🔧 PostgreSQL Startup Fix for RHEL"
echo "=============================================================================="

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    print_error "This script must be run as root"
    exit 1
fi

print_info "Diagnosing PostgreSQL startup issue..."

# Check PostgreSQL installation
if ! rpm -q postgresql-server >/dev/null 2>&1; then
    print_warning "PostgreSQL server package not found, installing..."
    dnf install -y postgresql postgresql-server postgresql-contrib
else
    print_success "PostgreSQL server package is installed"
fi

# Check if PostgreSQL is initialized
if [[ ! -f /var/lib/pgsql/data/postgresql.conf ]]; then
    print_info "PostgreSQL not initialized, initializing now..."
    postgresql-setup --initdb
    print_success "PostgreSQL initialized successfully"
else
    print_success "PostgreSQL already initialized"
fi

# Check PostgreSQL status
print_info "Checking current PostgreSQL status..."
if systemctl is-active --quiet postgresql; then
    print_success "PostgreSQL is already running"
else
    print_warning "PostgreSQL is not running, attempting to start..."
    
    # Check for common issues
    print_info "Checking for common PostgreSQL startup issues..."
    
    # Check disk space
    DISK_USAGE=$(df /var/lib/pgsql | awk 'NR==2 {print $5}' | sed 's/%//')
    if [[ $DISK_USAGE -gt 90 ]]; then
        print_error "Disk space is critically low (${DISK_USAGE}% used)"
        print_info "Available disk space:"
        df -h /var/lib/pgsql
    else
        print_success "Disk space is sufficient (${DISK_USAGE}% used)"
    fi
    
    # Check permissions
    print_info "Checking PostgreSQL data directory permissions..."
    chown -R postgres:postgres /var/lib/pgsql/
    chmod 700 /var/lib/pgsql/data
    print_success "Permissions fixed"
    
    # Check for port conflicts
    print_info "Checking for port 5432 conflicts..."
    if netstat -tlnp | grep :5432 >/dev/null 2>&1; then
        print_warning "Port 5432 is already in use:"
        netstat -tlnp | grep :5432
        print_info "Stopping conflicting processes..."
        pkill -f postgres || true
        sleep 3
    else
        print_success "Port 5432 is available"
    fi
    
    # Clear any lock files
    print_info "Clearing any stale lock files..."
    rm -f /var/lib/pgsql/data/postmaster.pid
    rm -f /tmp/.s.PGSQL.5432*
    
    # Check SELinux contexts
    if command -v getenforce >/dev/null 2>&1; then
        SELINUX_STATUS=$(getenforce)
        if [[ "$SELINUX_STATUS" == "Enforcing" ]]; then
            print_info "Fixing SELinux contexts for PostgreSQL..."
            restorecon -Rv /var/lib/pgsql/
            setsebool -P postgresql_can_rsync on
        fi
    fi
    
    # Try to start PostgreSQL
    print_info "Attempting to start PostgreSQL..."
    if systemctl start postgresql; then
        print_success "PostgreSQL started successfully"
    else
        print_error "PostgreSQL start failed, checking logs..."
        print_info "PostgreSQL logs:"
        journalctl -u postgresql --no-pager -n 20
        
        print_info "Attempting alternative startup method..."
        
        # Try starting as postgres user
        sudo -u postgres /usr/bin/pg_ctl -D /var/lib/pgsql/data -l /var/lib/pgsql/data/log/postgresql.log start
        
        if pgrep postgres >/dev/null; then
            print_success "PostgreSQL started using alternative method"
        else
            print_error "All PostgreSQL startup attempts failed"
            print_info "Manual troubleshooting required. Check:"
            print_info "  • journalctl -u postgresql"
            print_info "  • /var/lib/pgsql/data/log/postgresql*.log"
            print_info "  • df -h (disk space)"
            print_info "  • ps aux | grep postgres"
            exit 1
        fi
    fi
fi

# Enable PostgreSQL for auto-start
print_info "Enabling PostgreSQL for automatic startup..."
systemctl enable postgresql

# Test PostgreSQL connection
print_info "Testing PostgreSQL connection..."
if sudo -u postgres psql -c "SELECT version();" >/dev/null 2>&1; then
    print_success "PostgreSQL connection test successful"
else
    print_error "PostgreSQL connection test failed"
    exit 1
fi

print_success "PostgreSQL startup fix completed successfully!"
echo ""
print_info "You can now continue with the deployment by running:"
print_info "  ./rhel-production-deploy-v3.sh"
echo ""
print_info "Or if you want to resume from database setup step, check the deployment log for the exact point to resume."