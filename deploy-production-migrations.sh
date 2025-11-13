#!/bin/bash
# 🚀 Production Migration Deployment Script
# 
# This script safely deploys migrations to production with all safety checks
# based on the field mapping analysis we performed.
# 
# Usage: ./deploy-production-migrations.sh [options]

set -e  # Exit on any error

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

# Helper functions
log() {
    echo -e "${CYAN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$MIGRATION_LOG"
}

error() {
    echo -e "${RED}❌ ERROR:${NC} $1" | tee -a "$MIGRATION_LOG"
}

success() {
    echo -e "${GREEN}✅ SUCCESS:${NC} $1" | tee -a "$MIGRATION_LOG"
}

warning() {
    echo -e "${YELLOW}⚠️  WARNING:${NC} $1" | tee -a "$MIGRATION_LOG"
}

info() {
    echo -e "${BLUE}ℹ️  INFO:${NC} $1" | tee -a "$MIGRATION_LOG"
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
${BOLD}Production Migration Deployment Script${NC}

${YELLOW}Usage:${NC} ./deploy-production-migrations.sh [options]

${YELLOW}Options:${NC}
    --dry-run           Simulate migration without executing (recommended first)
    --force             Force migration even if warnings exist (USE WITH CAUTION)
    --skip-backup       Skip database backup (NOT RECOMMENDED)
    --skip-verification Skip field mapping verification after migration
    --help, -h          Show this help message

${YELLOW}Examples:${NC}
    # Safe production migration (recommended)
    ./deploy-production-migrations.sh

    # Test run first (highly recommended)
    ./deploy-production-migrations.sh --dry-run

    # Emergency deployment (use with extreme caution)
    ./deploy-production-migrations.sh --force

${YELLOW}Environment Variables Required:${NC}
    NODE_ENV=production
    DB_HOST=<database_host>
    DB_NAME=<database_name>
    DB_USER=<database_user>
    DB_PASSWORD=<database_password>

EOF
}

# Pre-flight checks
preflight_checks() {
    log "${BOLD}🔍 Running Pre-flight Checks...${NC}"

    # Check if we're in the right directory
    if [[ ! -f "package.json" ]] || [[ ! -d "backend" ]]; then
        error "Please run this script from the project root directory"
        exit 1
    fi

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

    # Check if backend dependencies are installed
    if [[ ! -d "backend/node_modules" ]]; then
        error "Backend dependencies not installed. Run 'cd backend && npm install'"
        exit 1
    fi
    success "Backend dependencies check passed"

    # Create necessary directories
    mkdir -p "$BACKUP_DIR" "$LOG_DIR"
    success "Backup and log directories created"
}

# Test database connection
test_database_connection() {
    log "${BOLD}🔌 Testing Database Connection...${NC}"
    
    cd backend
    if npm run db:test-connection >> "$MIGRATION_LOG" 2>&1; then
        success "Database connection successful"
        cd ..
        return 0
    else
        error "Database connection failed"
        cd ..
        return 1
    fi
}

# Check migration status
check_migration_status() {
    log "${BOLD}📊 Checking Migration Status...${NC}"
    
    cd backend
    
    # Get migration status
    if ! npx sequelize-cli db:migrate:status > /tmp/migration_status.txt 2>&1; then
        error "Failed to get migration status"
        cd ..
        return 1
    fi
    
    # Parse status
    local pending_count=$(grep -c "down" /tmp/migration_status.txt || true)
    local executed_count=$(grep -c "up" /tmp/migration_status.txt || true)
    
    info "Executed migrations: $executed_count"
    info "Pending migrations: $pending_count"
    
    if [[ $pending_count -gt 0 ]]; then
        warning "Found $pending_count pending migration(s):"
        grep "down" /tmp/migration_status.txt | head -10 | tee -a "$MIGRATION_LOG"
        cd ..
        return 2  # Pending migrations found
    else
        success "All migrations are up to date"
        cd ..
        return 0  # No pending migrations
    fi
}

# Create database backup
create_backup() {
    if [[ "$SKIP_BACKUP" == true ]]; then
        warning "Skipping database backup (--skip-backup flag used)"
        return 0
    fi
    
    log "${BOLD}💾 Creating Database Backup...${NC}"
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/production_backup_$timestamp.sql"
    
    if [[ "$DRY_RUN" == true ]]; then
        info "DRY RUN: Would create backup at $backup_file"
        return 0
    fi
    
    # Set PGPASSWORD for non-interactive backup
    export PGPASSWORD="$DB_PASSWORD"
    
    if pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" > "$backup_file" 2>> "$MIGRATION_LOG"; then
        success "Backup created successfully: $backup_file"
        info "Backup size: $(du -h "$backup_file" | cut -f1)"
        
        # Verify backup
        if [[ -s "$backup_file" ]]; then
            success "Backup verification passed"
            echo "$backup_file" > "$BACKUP_DIR/.latest_backup"
        else
            error "Backup file is empty or corrupted"
            return 1
        fi
    else
        error "Backup creation failed"
        return 1
    fi
    
    unset PGPASSWORD
}

# Run migrations
run_migrations() {
    log "${BOLD}🚀 Running Database Migrations...${NC}"
    
    if [[ "$DRY_RUN" == true ]]; then
        info "DRY RUN: Would execute migrations"
        return 0
    fi
    
    cd backend
    
    local start_time=$(date +%s)
    
    if npx sequelize-cli db:migrate 2>&1 | tee -a "$MIGRATION_LOG"; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        success "Migrations completed successfully in ${duration}s"
        cd ..
        return 0
    else
        error "Migration execution failed"
        cd ..
        return 1
    fi
}

# Verify field mappings
verify_field_mappings() {
    if [[ "$SKIP_VERIFICATION" == true ]]; then
        warning "Skipping field mapping verification (--skip-verification flag used)"
        return 0
    fi
    
    log "${BOLD}🔍 Verifying Field Mappings...${NC}"
    
    if [[ "$DRY_RUN" == true ]]; then
        info "DRY RUN: Would verify field mappings"
        return 0
    fi
    
    if [[ -f "scripts/verify-field-mappings.js" ]]; then
        if node scripts/verify-field-mappings.js 2>&1 | tee -a "$MIGRATION_LOG"; then
            success "Field mapping verification passed"
            return 0
        else
            error "Field mapping verification failed"
            if [[ "$FORCE" == true ]]; then
                warning "Continuing due to --force flag"
                return 0
            else
                return 1
            fi
        fi
    else
        warning "Field mapping verification script not found"
        return 0
    fi
}

# Post-migration tasks
post_migration_tasks() {
    log "${BOLD}🔧 Running Post-Migration Tasks...${NC}"
    
    if [[ "$DRY_RUN" == true ]]; then
        info "DRY RUN: Would run post-migration tasks"
        return 0
    fi
    
    cd backend
    
    # Update database indexes (optional)
    if command -v npm run db:optimize &> /dev/null; then
        info "Optimizing database indexes..."
        npm run db:optimize >> "$MIGRATION_LOG" 2>&1 || warning "Database optimization failed (non-critical)"
    fi
    
    # Validate data integrity (optional)
    if command -v npm run db:validate &> /dev/null; then
        info "Validating data integrity..."
        npm run db:validate >> "$MIGRATION_LOG" 2>&1 || warning "Data validation failed (non-critical)"
    fi
    
    cd ..
    
    # Restart application services if PM2 is available
    if command -v pm2 &> /dev/null; then
        info "Restarting application services..."
        pm2 reload all >> "$MIGRATION_LOG" 2>&1 || warning "PM2 reload failed (non-critical)"
    fi
    
    success "Post-migration tasks completed"
}

# Rollback function
rollback() {
    error "Migration failed - initiating rollback..."
    
    # Check if we have a recent backup
    if [[ -f "$BACKUP_DIR/.latest_backup" ]]; then
        local backup_file=$(cat "$BACKUP_DIR/.latest_backup")
        
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
        npx sequelize-cli db:migrate:undo >> "$MIGRATION_LOG" 2>&1 || error "Sequelize rollback failed"
        cd ..
    fi
}

# Main execution function
main() {
    local start_time=$(date +%s)
    
    echo -e "${BOLD}${CYAN}🚀 PRODUCTION MIGRATION DEPLOYMENT${NC}"
    echo -e "${CYAN}Started at: $(date)${NC}"
    echo -e "${CYAN}Log file: $MIGRATION_LOG${NC}\n"
    
    if [[ "$DRY_RUN" == true ]]; then
        warning "DRY RUN MODE - No actual changes will be made"
    fi
    
    # Execute deployment steps
    preflight_checks || exit 1
    test_database_connection || exit 1
    
    # Check if migrations are needed
    check_migration_status
    local migration_status=$?
    
    if [[ $migration_status -eq 0 ]] && [[ "$FORCE" != true ]]; then
        success "All migrations are already up to date"
        info "Use --force to run anyway"
        exit 0
    fi
    
    # Create backup before migrations
    create_backup || exit 1
    
    # Run migrations
    if ! run_migrations; then
        rollback
        exit 1
    fi
    
    # Verify field mappings
    if ! verify_field_mappings; then
        rollback
        exit 1
    fi
    
    # Post-migration tasks
    post_migration_tasks
    
    # Success summary
    local end_time=$(date +%s)
    local total_time=$((end_time - start_time))
    
    echo -e "\n${BOLD}${GREEN}✅ MIGRATION DEPLOYMENT COMPLETED SUCCESSFULLY${NC}"
    echo -e "${GREEN}Total time: ${total_time}s${NC}"
    echo -e "${GREEN}Log file: $MIGRATION_LOG${NC}"
    
    if [[ -f "$BACKUP_DIR/.latest_backup" ]]; then
        echo -e "${GREEN}Backup: $(cat "$BACKUP_DIR/.latest_backup")${NC}"
    fi
    
    info "Migration deployment completed at $(date)"
}

# Parse arguments and run
parse_args "$@"
main

exit 0