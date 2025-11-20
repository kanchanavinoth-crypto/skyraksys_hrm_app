#!/bin/bash

# =============================================================================
# Quick Fix for Current Deployment Issues
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() { echo -e "${BLUE}[$(date '+%H:%M:%S')] ℹ️  $1${NC}"; }
print_success() { echo -e "${GREEN}[$(date '+%H:%M:%S')] ✅ $1${NC}"; }
print_error() { echo -e "${RED}[$(date '+%H:%M:%S')] ❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠️  $1${NC}"; }

echo "=============================================================================="
echo "🔧 Quick Fix for Deployment Issues"
echo "=============================================================================="

# 1. Fix Git SSH authentication issue
print_info "Fixing Git SSH authentication issue..."
cd /opt/skyraksys-hrm

# Remove any existing repo and clone fresh with HTTPS
if [[ -d skyraksys_hrm_app ]]; then
    rm -rf skyraksys_hrm_app
fi

# Set git to avoid SSH prompts and use HTTPS
export GIT_TERMINAL_PROMPT=0
git config --global credential.helper store

print_info "Cloning repository with HTTPS..."
git clone https://github.com/kanchanavinoth-crypto/skyraksys_hrm_app.git temp_repo

# Move files to current directory
mv temp_repo/* .
rm -rf temp_repo

print_success "Repository cloned successfully with HTTPS"

# 2. Fix pg_dump version mismatch
print_info "Checking PostgreSQL tools version..."

if command -v /usr/pgsql-17/bin/pg_dump >/dev/null 2>&1; then
    print_success "PostgreSQL 17 tools found"
    PG_DUMP="/usr/pgsql-17/bin/pg_dump"
else
    print_warning "PostgreSQL 17 tools not found, using default"
    PG_DUMP="pg_dump"
fi

# Test database backup with correct version
print_info "Testing database backup with correct pg_dump version..."
mkdir -p /opt/skyraksys-hrm/backups
PGPASSWORD="SkyRakDB#2025!Prod@HRM\$Secure" "$PG_DUMP" -h localhost -U skyraksys_admin -d skyraksys_hrm_prod > /opt/skyraksys-hrm/backups/test_backup_$(date +%Y%m%d_%H%M%S).sql

if [[ $? -eq 0 ]]; then
    print_success "Database backup test successful with $PG_DUMP"
else
    print_warning "Database backup test failed - may be empty database"
fi

# 3. Set proper permissions
print_info "Setting proper file permissions..."
chown -R root:root /opt/skyraksys-hrm
chmod +x /opt/skyraksys-hrm/*.sh

print_success "Quick fix completed!"
echo ""
print_info "You can now run the deployment script again:"
print_info "  ./rhel-production-deploy-v3.sh"
echo ""
print_info "Or use the quick deploy method:"
print_info "  curl -sSL https://raw.githubusercontent.com/kanchanavinoth-crypto/skyraksys_hrm_app/master/rhel-quick-deploy.sh | bash"