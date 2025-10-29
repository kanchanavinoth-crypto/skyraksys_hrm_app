#!/bin/bash

# ================================================================
# SkyRakSys HRM Production Password Management Script
# ================================================================
# 
# This script helps manage and change default passwords in the
# production environment. It provides secure password generation
# and updates configuration files safely.
# 
# Usage: ./manage-passwords.sh [command] [options]
# 
# ================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env"
ENV_TEMPLATE="$PROJECT_DIR/.env.production.template"
BACKUP_DIR="$PROJECT_DIR/config/backups"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# ================================================================
# Utility Functions
# ================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Generate secure password
generate_password() {
    local length=${1:-32}
    local complexity=${2:-"high"}
    
    case $complexity in
        "simple")
            openssl rand -base64 $((length * 3/4)) | tr -d "=+/" | cut -c1-${length}
            ;;
        "medium")
            openssl rand -base64 $((length * 3/4)) | tr -d "=+/"
            ;;
        "high")
            openssl rand -base64 48 | tr -d "=+/" | head -c${length}
            ;;
        *)
            openssl rand -base64 32 | tr -d "=+/" | head -c${length}
            ;;
    esac
}

# Generate bcrypt hash
generate_bcrypt_hash() {
    local password="$1"
    local rounds="${2:-12}"
    
    if command -v node >/dev/null 2>&1; then
        node -e "console.log(require('bcrypt').hashSync('$password', $rounds))"
    elif command -v python3 >/dev/null 2>&1; then
        python3 -c "import bcrypt; print(bcrypt.hashpw(b'$password', bcrypt.gensalt(rounds=$rounds)).decode())"
    else
        log_error "Neither Node.js nor Python3 available for bcrypt hashing"
        return 1
    fi
}

# Backup configuration file
backup_config() {
    local file="$1"
    local backup_file="$BACKUP_DIR/$(basename "$file").$(date +%Y%m%d_%H%M%S).bak"
    
    if [[ -f "$file" ]]; then
        cp "$file" "$backup_file"
        log_info "Backed up $file to $backup_file"
    fi
}

# Update environment variable in file
update_env_var() {
    local file="$1"
    local var_name="$2"
    local var_value="$3"
    local create_if_missing="${4:-true}"
    
    if [[ ! -f "$file" ]]; then
        log_error "Environment file $file not found"
        return 1
    fi
    
    # Escape special characters in value
    local escaped_value=$(printf '%s\n' "$var_value" | sed 's/[[\.*^$()+?{|]/\\&/g')
    
    if grep -q "^${var_name}=" "$file"; then
        # Update existing variable
        sed -i.tmp "s/^${var_name}=.*/${var_name}=${escaped_value}/" "$file"
        rm -f "${file}.tmp"
        log_success "Updated $var_name in $file"
    elif [[ "$create_if_missing" == "true" ]]; then
        # Add new variable
        echo "${var_name}=${var_value}" >> "$file"
        log_success "Added $var_name to $file"
    else
        log_warning "Variable $var_name not found in $file"
        return 1
    fi
}

# ================================================================
# Password Management Functions
# ================================================================

# Change database passwords
change_database_passwords() {
    log_info "Changing database passwords..."
    
    # Generate new passwords
    local postgres_admin_password=$(generate_password 32)
    local app_db_password=$(generate_password 32)
    
    log_info "Generated new database passwords"
    
    # Backup environment file
    backup_config "$ENV_FILE"
    
    # Update PostgreSQL admin password
    if command -v sudo >/dev/null 2>&1 && sudo -u postgres psql -c "SELECT 1;" >/dev/null 2>&1; then
        sudo -u postgres psql -c "ALTER USER postgres PASSWORD '$postgres_admin_password';"
        log_success "Updated PostgreSQL admin password"
    else
        log_warning "Could not connect to PostgreSQL. Update manually:"
        log_warning "  sudo -u postgres psql"
        log_warning "  ALTER USER postgres PASSWORD '$postgres_admin_password';"
    fi
    
    # Update application database user password
    if command -v sudo >/dev/null 2>&1 && sudo -u postgres psql -c "SELECT 1;" >/dev/null 2>&1; then
        sudo -u postgres psql -c "ALTER USER hrm_prod_user PASSWORD '$app_db_password';" 2>/dev/null || {
            log_warning "Application database user not found. Will be created during setup."
        }
    fi
    
    # Update environment file
    update_env_var "$ENV_FILE" "POSTGRES_ADMIN_PASSWORD" "$postgres_admin_password"
    update_env_var "$ENV_FILE" "DB_PASSWORD" "$app_db_password"
    
    log_success "Database passwords updated successfully"
}

# Change application admin passwords
change_admin_passwords() {
    log_info "Changing application admin passwords..."
    
    # Generate new passwords
    local admin_password=$(generate_password 24)
    local hr_password=$(generate_password 24)
    local manager_password=$(generate_password 24)
    
    # Generate bcrypt hashes
    local admin_hash=$(generate_bcrypt_hash "$admin_password")
    local hr_hash=$(generate_bcrypt_hash "$hr_password")
    local manager_hash=$(generate_bcrypt_hash "$manager_password")
    
    # Backup environment file
    backup_config "$ENV_FILE"
    
    # Update environment file
    update_env_var "$ENV_FILE" "ADMIN_PASSWORD" "$admin_password"
    update_env_var "$ENV_FILE" "HR_PASSWORD" "$hr_password"
    update_env_var "$ENV_FILE" "MANAGER_PASSWORD" "$manager_password"
    
    log_success "Application admin passwords updated"
    log_info "New passwords:"
    echo "  Admin: $admin_password"
    echo "  HR Manager: $hr_password"
    echo "  Project Manager: $manager_password"
    log_warning "Please save these passwords securely!"
}

# Change security tokens
change_security_tokens() {
    log_info "Changing security tokens and secrets..."
    
    # Generate new tokens
    local jwt_secret=$(generate_password 64)
    local jwt_refresh_secret=$(generate_password 64)
    local session_secret=$(generate_password 64)
    local encryption_key=$(generate_password 32)
    local encryption_iv=$(generate_password 16)
    local webhook_secret=$(generate_password 48)
    
    # Backup environment file
    backup_config "$ENV_FILE"
    
    # Update environment file
    update_env_var "$ENV_FILE" "JWT_SECRET" "$jwt_secret"
    update_env_var "$ENV_FILE" "JWT_REFRESH_SECRET" "$jwt_refresh_secret"
    update_env_var "$ENV_FILE" "SESSION_SECRET" "$session_secret"
    update_env_var "$ENV_FILE" "ENCRYPTION_KEY" "$encryption_key"
    update_env_var "$ENV_FILE" "ENCRYPTION_IV" "$encryption_iv"
    update_env_var "$ENV_FILE" "WEBHOOK_SECRET" "$webhook_secret"
    
    log_success "Security tokens updated successfully"
}

# Change infrastructure passwords
change_infrastructure_passwords() {
    log_info "Changing infrastructure service passwords..."
    
    # Generate new passwords
    local redis_password=$(generate_password 32)
    local nginx_password=$(generate_password 24)
    local ssl_password=$(generate_password 32)
    local backup_password=$(generate_password 32)
    
    # Backup environment file
    backup_config "$ENV_FILE"
    
    # Update environment file
    update_env_var "$ENV_FILE" "REDIS_PASSWORD" "$redis_password"
    update_env_var "$ENV_FILE" "NGINX_ADMIN_PASSWORD" "$nginx_password"
    update_env_var "$ENV_FILE" "SSL_PRIVATE_KEY_PASSWORD" "$ssl_password"
    update_env_var "$ENV_FILE" "BACKUP_ENCRYPTION_PASSWORD" "$backup_password"
    
    log_success "Infrastructure passwords updated successfully"
}

# Change all passwords
change_all_passwords() {
    log_info "Changing ALL default passwords..."
    
    change_database_passwords
    change_admin_passwords
    change_security_tokens
    change_infrastructure_passwords
    
    log_success "All passwords have been updated successfully!"
    log_warning "Please restart all services for changes to take effect:"
    log_warning "  sudo systemctl restart postgresql"
    log_warning "  sudo systemctl restart redis"
    log_warning "  sudo systemctl restart nginx"
    log_warning "  pm2 restart skyraksys-hrm"
}

# Generate password report
generate_password_report() {
    log_info "Generating password security report..."
    
    local report_file="$BACKUP_DIR/password_report_$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$report_file" << EOF
SkyRakSys HRM Password Security Report
Generated: $(date)

=== CRITICAL SECURITY WARNINGS ===

The following default passwords should be changed immediately:

1. Database Passwords:
   - PostgreSQL admin (postgres user)
   - Application database user (hrm_prod_user)

2. Application Admin Accounts:
   - System Administrator (admin@skyraksys.com)
   - HR Manager (hr@skyraksys.com)
   - Project Manager (manager@skyraksys.com)

3. Security Tokens:
   - JWT secrets
   - Session secrets
   - Encryption keys

4. Infrastructure Services:
   - Redis password
   - Nginx admin password
   - SSL certificate passwords

=== RECOMMENDED ACTIONS ===

1. Run: ./manage-passwords.sh change-all
2. Update any external configurations
3. Restart all services
4. Test login with new credentials
5. Store new passwords securely

=== PASSWORD POLICY RECOMMENDATIONS ===

- Minimum 12 characters
- Include uppercase, lowercase, numbers, symbols
- Unique passwords for each service
- Regular rotation (every 90 days)
- Use enterprise password manager
- Never store in plain text or version control

EOF

    log_success "Password report generated: $report_file"
}

# Verify current passwords
verify_passwords() {
    log_info "Verifying current password configuration..."
    
    local issues=0
    
    # Check if environment file exists
    if [[ ! -f "$ENV_FILE" ]]; then
        log_error "Environment file not found: $ENV_FILE"
        ((issues++))
    fi
    
    # Check for default passwords
    if [[ -f "$ENV_FILE" ]]; then
        if grep -q "admin123\|password123\|change_this\|default" "$ENV_FILE"; then
            log_warning "Default or weak passwords detected in environment file"
            ((issues++))
        fi
        
        if grep -q "SkyRakSys.*2024" "$ENV_FILE"; then
            log_warning "Default SkyRakSys passwords detected - should be changed"
            ((issues++))
        fi
        
        # Check file permissions
        local perms=$(stat -c %a "$ENV_FILE" 2>/dev/null || stat -f %A "$ENV_FILE" 2>/dev/null || echo "unknown")
        if [[ "$perms" != "600" ]]; then
            log_warning "Environment file permissions should be 600, currently: $perms"
            ((issues++))
        fi
    fi
    
    # Check database connectivity
    if ! sudo -u postgres psql -c "SELECT 1;" >/dev/null 2>&1; then
        log_warning "Cannot connect to PostgreSQL database"
        ((issues++))
    fi
    
    if [[ $issues -eq 0 ]]; then
        log_success "Password configuration appears secure"
    else
        log_warning "Found $issues security issues that should be addressed"
    fi
    
    return $issues
}

# ================================================================
# Main Script Logic
# ================================================================

show_help() {
    cat << EOF
SkyRakSys HRM Password Management Script

Usage: $0 [command] [options]

Commands:
  change-all          Change all default passwords
  change-database     Change database passwords only
  change-admin        Change application admin passwords only
  change-security     Change security tokens only
  change-infra        Change infrastructure passwords only
  generate-report     Generate password security report
  verify              Verify current password configuration
  generate [length]   Generate a secure password
  help                Show this help message

Options:
  --env-file FILE     Specify environment file (default: .env)
  --backup           Create backup before changes (default: true)
  --force            Skip confirmation prompts

Examples:
  $0 change-all                    # Change all passwords
  $0 change-database --force       # Change database passwords without prompts
  $0 generate 32                   # Generate 32-character password
  $0 verify                        # Check current configuration

Security Notes:
  - Always backup configuration before changes
  - Test changes in staging environment first
  - Restart services after password changes
  - Store new passwords securely
  - Never commit passwords to version control

EOF
}

# Parse command line arguments
COMMAND=""
FORCE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        change-all|change-database|change-admin|change-security|change-infra|generate-report|verify|generate|help)
            COMMAND="$1"
            shift
            ;;
        --env-file)
            ENV_FILE="$2"
            shift 2
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --backup)
            # Already default behavior
            shift
            ;;
        *)
            if [[ "$COMMAND" == "generate" && "$1" =~ ^[0-9]+$ ]]; then
                PASSWORD_LENGTH="$1"
                shift
            else
                log_error "Unknown option: $1"
                show_help
                exit 1
            fi
            ;;
    esac
done

# Main execution
case "$COMMAND" in
    "change-all")
        if [[ "$FORCE" != "true" ]]; then
            log_warning "This will change ALL default passwords. Continue? (y/N)"
            read -r response
            if [[ "$response" != "y" && "$response" != "Y" ]]; then
                log_info "Operation cancelled"
                exit 0
            fi
        fi
        change_all_passwords
        ;;
    "change-database")
        if [[ "$FORCE" != "true" ]]; then
            log_warning "This will change database passwords. Continue? (y/N)"
            read -r response
            if [[ "$response" != "y" && "$response" != "Y" ]]; then
                log_info "Operation cancelled"
                exit 0
            fi
        fi
        change_database_passwords
        ;;
    "change-admin")
        change_admin_passwords
        ;;
    "change-security")
        change_security_tokens
        ;;
    "change-infra")
        change_infrastructure_passwords
        ;;
    "generate-report")
        generate_password_report
        ;;
    "verify")
        verify_passwords
        ;;
    "generate")
        LENGTH="${PASSWORD_LENGTH:-32}"
        echo "Generated password: $(generate_password "$LENGTH")"
        ;;
    "help"|"")
        show_help
        ;;
    *)
        log_error "Unknown command: $COMMAND"
        show_help
        exit 1
        ;;
esac
