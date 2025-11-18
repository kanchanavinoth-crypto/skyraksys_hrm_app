#!/bin/bash

# =============================================================================
# 🔄 SkyrakSys HRM - Quick Update Script for Production
# =============================================================================
# Use this script to quickly update your production deployment from Git
# Run this on your RHEL server after pushing changes to GitHub
# =============================================================================

set -e

# Configuration
APP_DIR="/opt/skyraksys_hrm_app"
SERVICE_NAME="skyraksys-hrm"
BACKUP_DIR="/opt/skyraksys-hrm-backups"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_step() { echo -e "${BLUE}[$(date '+%H:%M:%S')] 📋 $1${NC}"; }
print_success() { echo -e "${GREEN}[$(date '+%H:%M:%S')] ✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠️  $1${NC}"; }
print_error() { echo -e "${RED}[$(date '+%H:%M:%S')] ❌ $1${NC}"; }

# Check if app directory exists
if [ ! -d "$APP_DIR" ]; then
    print_error "Application directory not found: $APP_DIR"
    print_error "Run the full deployment script first: rhel-quick-deploy.sh"
    exit 1
fi

print_step "Starting quick update..."

# Create backup
BACKUP_NAME="backup-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
print_step "Creating backup: $BACKUP_NAME"
cp -r "$APP_DIR" "$BACKUP_DIR/$BACKUP_NAME"
print_success "Backup created"

# Navigate to app directory
cd "$APP_DIR"

# Stash any local changes
print_step "Stashing local changes..."
git stash push -m "Auto-stash before update $(date)" >/dev/null 2>&1 || true

# Pull latest changes
print_step "Pulling latest changes from Git..."
git pull origin master

# Update backend dependencies if package.json changed
if git diff HEAD~1 HEAD --name-only | grep -q "backend/package.json"; then
    print_step "Backend package.json changed - updating dependencies..."
    cd backend
    npm install --production >/dev/null 2>&1
    cd ..
    print_success "Backend dependencies updated"
fi

# Update and rebuild frontend if needed
if git diff HEAD~1 HEAD --name-only | grep -qE "(frontend/|package.json)"; then
    print_step "Frontend changes detected - rebuilding..."
    cd frontend
    
    # Update dependencies if package.json changed
    if git diff HEAD~1 HEAD --name-only | grep -q "frontend/package.json"; then
        npm install >/dev/null 2>&1
    fi
    
    # Rebuild frontend
    npm run build >/dev/null 2>&1
    cd ..
    print_success "Frontend rebuilt"
else
    print_step "No frontend changes detected - skipping rebuild"
fi

# Run database migrations if any migration files changed
if git diff HEAD~1 HEAD --name-only | grep -q "backend/migrations/"; then
    print_step "Migration files changed - running migrations..."
    cd backend
    npm run migrate >/dev/null 2>&1 || true
    cd ..
    print_success "Migrations completed"
fi

# Restart the application
print_step "Restarting application..."
pm2 restart $SERVICE_NAME >/dev/null 2>&1
sleep 3

# Check if application is running
if pm2 list | grep -q "$SERVICE_NAME.*online"; then
    print_success "Application restarted successfully"
else
    print_error "Application failed to restart"
    print_warning "Restoring from backup..."
    
    # Stop current app
    pm2 stop $SERVICE_NAME >/dev/null 2>&1 || true
    
    # Restore backup
    rm -rf "$APP_DIR"
    cp -r "$BACKUP_DIR/$BACKUP_NAME" "$APP_DIR"
    
    # Restart from backup
    cd "$APP_DIR/backend"
    pm2 start ecosystem.config.js >/dev/null 2>&1
    
    print_error "Update failed - restored from backup"
    exit 1
fi

# Reload Nginx if configuration changed
if git diff HEAD~1 HEAD --name-only | grep -qE "(nginx|\.conf)"; then
    print_step "Nginx configuration changed - reloading..."
    systemctl reload nginx
    print_success "Nginx reloaded"
fi

# Show final status
print_success "Update completed successfully!"
echo ""
echo "Application Status:"
pm2 status | grep $SERVICE_NAME
echo ""
echo "Recent Changes:"
git log --oneline -5
echo ""
echo "Access your application at: http://$(hostname -I | awk '{print $1}')"

# Clean old backups (keep only last 5)
print_step "Cleaning old backups..."
cd "$BACKUP_DIR"
ls -t | tail -n +6 | xargs rm -rf -- 2>/dev/null || true
print_success "Old backups cleaned"

print_success "✨ Quick update completed! Your application is running the latest version."