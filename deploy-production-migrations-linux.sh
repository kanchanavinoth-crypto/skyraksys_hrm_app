#!/bin/bash
# ==============================================
# Production Migration Deployment Script (Linux)
# ==============================================
# Purpose: Safely deploy migrations to production with field mapping verification
# Usage: ./deploy-production-migrations-linux.sh [options]
# Based on field mapping analysis performed
# ==============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./backups"
LOG_DIR="./logs"
MIGRATION_LOG="$LOG_DIR/migration-$(date +%Y%m%d-%H%M%S).log"

# Default options
DRY_RUN=false
FORCE=false
SKIP_BACKUP=false
SKIP_VERIFICATION=false

# Ensure directories exist
mkdir -p "$BACKUP_DIR" "$LOG_DIR"

# Helper functions
log() {
    echo -e "${CYAN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$MIGRATION_LOG"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$MIGRATION_LOG"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$MIGRATION_LOG"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$MIGRATION_LOG"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$MIGRATION_LOG"
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --force)
                FORCE=true
                shift
                ;;
            --skip-backup)
                SKIP_BACKUP=true
                shift
                ;;
            --skip-verification)
                SKIP_VERIFICATION=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

show_help() {
    cat << EOF
${BOLD}Production Migration Deployment Script (Linux)${NC}

${YELLOW}Usage:${NC} ./deploy-production-migrations-linux.sh [options]

${YELLOW}Options:${NC}
    --dry-run           Simulate migration without executing (recommended first)
    --force             Force migration even if warnings exist (USE WITH CAUTION)
    --skip-backup       Skip database backup (NOT RECOMMENDED)
    --skip-verification Skip field mapping verification after migration
    --help, -h          Show this help message

${YELLOW}Examples:${NC}
    # Safe production migration (recommended)
    ./deploy-production-migrations-linux.sh

    # Test run first (highly recommended)
    ./deploy-production-migrations-linux.sh --dry-run

    # Emergency deployment (use with extreme caution)
    ./deploy-production-migrations-linux.sh --force

${YELLOW}Environment Variables Required:${NC}
    NODE_ENV=production
    DB_HOST=<database_host>
    DB_NAME=<database_name>
    DB_USER=<database_user>
    DB_PASSWORD=<database_password>
    PGPASSWORD=<database_password>  # For PostgreSQL backup/restore

EOF
}

# Pre-flight checks
preflight_checks() {
    log "Running Pre-flight Checks..."

    # Check if we're in the right directory
    if [[ ! -f "package.json" ]] || [[ ! -d "backend" ]]; then
        error "Please run this script from the project root directory"
        exit 1
    fi
    success "Directory structure check passed"

    # Check Node.js version
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed or not in PATH"
        exit 1
    fi

    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ $NODE_VERSION -lt 16 ]]; then
        error "Node.js version 16 or higher is required. Current: $(node --version)"
        exit 1
    fi
    success "Node.js version check passed: $(node --version)"

    # Check environment
    if [[ "$NODE_ENV" != "production" ]] && [[ "$FORCE" != true ]]; then
        error "NODE_ENV must be set to 'production'. Current: ${NODE_ENV:-not set}"
        info "Use --force to override this check (not recommended)"
        exit 1
    fi
    success "Environment check passed: NODE_ENV=$NODE_ENV"

    # Check required environment variables
    local required_vars=("DB_HOST" "DB_NAME" "DB_USER" "DB_PASSWORD")
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            error "Required environment variable $var is not set"
            exit 1
        fi
    done
    success "All required environment variables are set"

    # Check PostgreSQL tools
    if ! command -v pg_dump &> /dev/null; then
        warning "pg_dump not found - backup functionality will be limited"
    fi

    if ! command -v psql &> /dev/null; then
        warning "psql not found - restore functionality will be limited"
    fi

    # Check backend dependencies
    if [[ ! -d "backend/node_modules" ]]; then
        error "Backend dependencies not installed. Run 'cd backend && npm install'"
        exit 1
    fi
    success "Backend dependencies check passed"

    # Test database connection
    info "Testing Database Connection..."
    cd backend
    if ! npm run db:test-connection >> "$MIGRATION_LOG" 2>&1; then
        error "Database connection failed"
        cd ..
        exit 1
    fi
    success "Database connection successful"
    cd ..
}

# Check migration status
check_migration_status() {
    log "Checking Migration Status..."
    cd backend
    
    # Get migration status
    local migration_status
    migration_status=$(npx sequelize-cli db:migrate:status 2>&1)
    if [[ $? -ne 0 ]]; then
        error "Failed to get migration status"
        cd ..
        exit 1
    fi

    # Check for pending migrations
    local pending_count
    pending_count=$(echo "$migration_status" | grep -c "down" || true)
    
    if [[ $pending_count -eq 0 ]]; then
        success "All migrations are up to date"
        if [[ "$FORCE" != true ]]; then
            info "No pending migrations found. Use --force to run anyway"
            cd ..
            exit 0
        fi
    else
        warning "Found $pending_count pending migration(s)"
        echo "$migration_status" >> "$MIGRATION_LOG"
    fi
    
    cd ..
}

# Create database backup
create_backup() {
    if [[ "$SKIP_BACKUP" == true ]]; then
        warning "Skipping database backup (--skip-backup flag used)"
        return 0
    fi

    log "Creating Database Backup..."
    
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_file="$BACKUP_DIR/production_backup_${timestamp}.sql"
    
    if [[ "$DRY_RUN" == true ]]; then
        info "DRY RUN: Would create backup at $backup_file"
        return 0
    fi

    # Create PostgreSQL backup
    if command -v pg_dump &> /dev/null; then
        export PGPASSWORD="$DB_PASSWORD"
        if pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" > "$backup_file" 2>> "$MIGRATION_LOG"; then
            success "Backup created successfully: $backup_file"
            echo "$backup_file" > "$BACKUP_DIR/.latest_backup"
        else
            error "Backup creation failed"
            exit 1
        fi
        unset PGPASSWORD
    else
        error "pg_dump not available - cannot create backup"
        exit 1
    fi
}

# Run migrations
run_migrations() {
    log "Running Database Migrations..."

    if [[ "$DRY_RUN" == true ]]; then
        info "DRY RUN: Would execute migrations"
        return 0
    fi

    cd backend
    if ! npx sequelize-cli db:migrate 2>&1 | tee -a "$MIGRATION_LOG"; then
        error "Migration execution failed"
        cd ..
        rollback_database
        exit 1
    fi
    success "Migrations completed successfully"
    cd ..
}

# Verify field mappings
verify_field_mappings() {
    if [[ "$SKIP_VERIFICATION" == true ]]; then
        warning "Skipping field mapping verification (--skip-verification flag used)"
        return 0
    fi

    log "Verifying Field Mappings..."
    
    if [[ "$DRY_RUN" == true ]]; then
        info "DRY RUN: Would verify field mappings"
        return 0
    fi

    if [[ -f "scripts/verify-field-mappings.js" ]]; then
        if node scripts/verify-field-mappings.js >> "$MIGRATION_LOG" 2>&1; then
            success "Field mapping verification passed"
        else
            error "Field mapping verification failed"
            if [[ "$FORCE" != true ]]; then
                rollback_database
                exit 1
            fi
            warning "Continuing due to --force flag"
        fi
    else
        warning "Field mapping verification script not found at scripts/verify-field-mappings.js"
    fi
}

# Post-migration tasks
post_migration_tasks() {
    log "Running Post-Migration Tasks..."

    if [[ "$DRY_RUN" == true ]]; then
        info "DRY RUN: Would run post-migration tasks"
        return 0
    fi

    # Restart PM2 if available
    if command -v pm2 &> /dev/null; then
        info "Restarting application services..."
        if pm2 reload all >> "$MIGRATION_LOG" 2>&1; then
            success "PM2 services reloaded successfully"
        else
            warning "PM2 reload failed (non-critical)"
        fi
    else
        info "PM2 not available - manual service restart required"
    fi

    # Additional post-migration tasks can be added here
    success "Post-migration tasks completed"
}

# Rollback database
rollback_database() {
    error "Migration failed - initiating rollback..."

    if [[ -f "$BACKUP_DIR/.latest_backup" ]]; then
        local backup_file
        backup_file=$(cat "$BACKUP_DIR/.latest_backup")
        
        if [[ -f "$backup_file" ]]; then
            warning "Restoring from backup: $backup_file"
            export PGPASSWORD="$DB_PASSWORD"
            if psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" < "$backup_file" >> "$MIGRATION_LOG" 2>&1; then
                success "Database restored from backup"
            else
                error "Backup restoration failed - manual intervention required"
            fi
            unset PGPASSWORD
        else
            error "Backup file not found: $backup_file"
        fi
    else
        warning "No recent backup available - attempting Sequelize rollback"
        cd backend
        if npx sequelize-cli db:migrate:undo >> "$MIGRATION_LOG" 2>&1; then
            success "Sequelize rollback completed"
        else
            error "Sequelize rollback failed - manual intervention required"
        fi
        cd ..
    fi
}

# Main execution
main() {
    # Parse arguments
    parse_args "$@"

    # Start execution
    echo -e "${BOLD}Production Migration Deployment${NC}"
    echo "Started at: $(date)"
    echo "Log file: $MIGRATION_LOG"
    echo

    if [[ "$DRY_RUN" == true ]]; then
        warning "DRY RUN MODE - No actual changes will be made"
    fi

    # Execute deployment steps
    preflight_checks
    check_migration_status
    create_backup
    run_migrations
    verify_field_mappings
    post_migration_tasks

    # Success summary
    echo
    echo -e "${GREEN}MIGRATION DEPLOYMENT COMPLETED SUCCESSFULLY${NC}"
    echo "Log file: $MIGRATION_LOG"

    if [[ -f "$BACKUP_DIR/.latest_backup" ]]; then
        local latest_backup
        latest_backup=$(cat "$BACKUP_DIR/.latest_backup")
        echo "Backup: $latest_backup"
    fi

    log "Migration deployment completed at $(date)"
}

# Execute main function with all arguments
main "$@"