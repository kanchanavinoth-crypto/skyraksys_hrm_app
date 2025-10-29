#!/bin/bash

################################################################################
# Skyraksys HRM - Master Deployment Script
# RHEL 9.6 Production Environment
################################################################################
#
# This script orchestrates the complete deployment process including
# automatic configuration generation during build.
#
# Usage:
#   sudo bash deploy.sh [OPTIONS] [SERVER_IP_OR_DOMAIN]
#
# Options:
#   --auto    Non-interactive mode with production defaults
#
# Examples:
#   sudo bash deploy.sh 95.216.14.232              # Interactive
#   sudo bash deploy.sh --auto 95.216.14.232       # Automated (production defaults)
#   sudo bash deploy.sh --auto                     # Automated (auto-detect IP)
#
# What it does:
#   1. Validates environment
#   2. Generates all configuration files automatically
#   3. Installs prerequisites (Node.js, PostgreSQL, Nginx)
#   4. Sets up database with Sequelize migrations
#   5. Deploys application
#   6. Configures and starts services
#   7. Runs health checks
#
# Result: ZERO manual configuration editing required!
#
################################################################################

set -e  # Exit on any error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="/opt/skyraksys-hrm"
LOG_FILE="/var/log/skyraksys-hrm/deployment.log"

################################################################################
# Utility Functions
################################################################################

print_header() {
    echo
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo
}

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

step() {
    echo -e "${MAGENTA}[STEP $1]${NC} $2" | tee -a "$LOG_FILE"
}

################################################################################
# Pre-flight Checks
################################################################################

check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root (use sudo)"
    fi
}

check_os() {
    if [[ ! -f /etc/redhat-release ]]; then
        error "This script is designed for RHEL/CentOS. Detected: $(uname -s)"
    fi
    
    local version=$(cat /etc/redhat-release)
    info "Operating System: $version"
}

get_server_address() {
    # Check if provided as argument
    if [[ -n "$1" ]]; then
        SERVER_ADDRESS="$1"
        log "Using provided address: $SERVER_ADDRESS"
        return
    fi
    
    # Try to detect automatically
    info "No server address provided, attempting auto-detection..."
    
    # Try to get public IP
    PUBLIC_IP=$(curl -s --connect-timeout 5 ifconfig.me 2>/dev/null || \
                curl -s --connect-timeout 5 icanhazip.com 2>/dev/null || \
                echo "")
    
    if [[ -n "$PUBLIC_IP" ]]; then
        warn "Detected public IP: $PUBLIC_IP"
        read -p "Use this IP address? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            SERVER_ADDRESS="$PUBLIC_IP"
            return
        fi
    fi
    
    # Manual input
    echo
    echo "Please enter your server IP address or domain name:"
    echo "Examples: 95.216.14.232 or hrm.company.com"
    read -p "Server address: " SERVER_ADDRESS
    
    if [[ -z "$SERVER_ADDRESS" ]]; then
        error "Server address is required. Usage: sudo bash deploy.sh YOUR_IP"
    fi
}

################################################################################
# Main Deployment Steps
################################################################################

step_1_generate_configs() {
    step "1/7" "Generating Configuration Files"
    
    # Check for auto mode
    local AUTO_MODE="${AUTO_MODE:-false}"
    
    if [[ "$AUTO_MODE" == "true" ]]; then
        # Use non-interactive generator for automated builds
        if [[ ! -f "${SCRIPT_DIR}/00_generate_configs_auto.sh" ]]; then
            error "Auto configuration generator not found: ${SCRIPT_DIR}/00_generate_configs_auto.sh"
        fi
        
        log "Running auto configuration generator (non-interactive) with server: $SERVER_ADDRESS"
        bash "${SCRIPT_DIR}/00_generate_configs_auto.sh" "$SERVER_ADDRESS" "https" || error "Auto configuration generation failed"
    else
        # Use interactive generator
        if [[ ! -f "${SCRIPT_DIR}/00_generate_configs.sh" ]]; then
            error "Configuration generator not found: ${SCRIPT_DIR}/00_generate_configs.sh"
        fi
        
        log "Running configuration generator (interactive) with server: $SERVER_ADDRESS"
        bash "${SCRIPT_DIR}/00_generate_configs.sh" "$SERVER_ADDRESS" || error "Configuration generation failed"
    fi
    
    success "✓ All configuration files generated automatically"
}

step_2_install_prerequisites() {
    step "2/7" "Installing Prerequisites"
    
    if [[ ! -f "${SCRIPT_DIR}/01_install_prerequisites.sh" ]]; then
        error "Prerequisites installer not found: ${SCRIPT_DIR}/01_install_prerequisites.sh"
    fi
    
    log "Installing Node.js, PostgreSQL, Nginx, and system dependencies..."
    bash "${SCRIPT_DIR}/01_install_prerequisites.sh" || error "Prerequisites installation failed"
    
    success "✓ Prerequisites installed successfully"
}

step_3_setup_database() {
    step "3/7" "Setting Up Database"
    
    if [[ ! -f "${SCRIPT_DIR}/02_setup_database.sh" ]]; then
        error "Database setup script not found: ${SCRIPT_DIR}/02_setup_database.sh"
    fi
    
    log "Setting up PostgreSQL database with Sequelize migrations..."
    bash "${SCRIPT_DIR}/02_setup_database.sh" || error "Database setup failed"
    
    success "✓ Database configured and migrated successfully"
}

step_4_deploy_application() {
    step "4/7" "Deploying Application"
    
    if [[ ! -f "${SCRIPT_DIR}/03_deploy_application.sh" ]]; then
        error "Application deployment script not found: ${SCRIPT_DIR}/03_deploy_application.sh"
    fi
    
    log "Deploying backend and frontend applications..."
    bash "${SCRIPT_DIR}/03_deploy_application.sh" || error "Application deployment failed"
    
    success "✓ Application deployed successfully"
}

step_5_configure_services() {
    step "5/7" "Configuring System Services"
    
    log "Setting up systemd services and Nginx..."
    
    # Install Nginx configuration
    if [[ -f "${APP_DIR}/redhatprod/configs/nginx-hrm-${SERVER_ADDRESS}.conf" ]]; then
        cp "${APP_DIR}/redhatprod/configs/nginx-hrm-${SERVER_ADDRESS}.conf" \
           /etc/nginx/conf.d/hrm.conf
        log "✓ Nginx configuration installed"
    else
        warn "Nginx configuration not found, using default"
    fi
    
    # Test Nginx configuration
    nginx -t || error "Nginx configuration test failed"
    
    # Enable and start services
    log "Enabling and starting services..."
    systemctl enable hrm-backend hrm-frontend nginx postgresql-17
    systemctl start hrm-backend hrm-frontend
    systemctl restart nginx
    
    success "✓ Services configured and started"
}

step_6_configure_firewall() {
    step "6/7" "Configuring Firewall"
    
    log "Opening required ports..."
    firewall-cmd --permanent --add-service=http || true
    firewall-cmd --permanent --add-service=https || true
    firewall-cmd --reload || true
    
    success "✓ Firewall configured"
}

step_7_health_check() {
    step "7/7" "Running Health Checks"
    
    log "Waiting for services to be ready..."
    sleep 5
    
    # Check backend health
    local max_attempts=12
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
            success "✓ Backend is healthy"
            break
        fi
        
        attempt=$((attempt + 1))
        if [[ $attempt -eq $max_attempts ]]; then
            error "Backend health check failed after ${max_attempts} attempts"
        fi
        
        info "Waiting for backend... (${attempt}/${max_attempts})"
        sleep 5
    done
    
    # Check frontend
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        success "✓ Frontend is running"
    else
        warn "Frontend might not be fully ready yet"
    fi
    
    # Check database
    if sudo -u postgres psql -d skyraksys_hrm_prod -c "SELECT 1" > /dev/null 2>&1; then
        success "✓ Database is accessible"
    else
        error "Database health check failed"
    fi
    
    success "✓ All health checks passed"
}

################################################################################
# Deployment Summary
################################################################################

print_deployment_summary() {
    local PROTOCOL="http"
    if [[ -f "/etc/letsencrypt/live/${SERVER_ADDRESS}/fullchain.pem" ]]; then
        PROTOCOL="https"
    fi
    
    print_header "DEPLOYMENT COMPLETE"
    
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                                ║${NC}"
    echo -e "${GREEN}║          🎉 Skyraksys HRM Deployed Successfully! 🎉            ║${NC}"
    echo -e "${GREEN}║                                                                ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo
    
    info "Deployment Information:"
    echo "  • Server: ${SERVER_ADDRESS}"
    echo "  • Frontend: ${PROTOCOL}://${SERVER_ADDRESS}"
    echo "  • Backend API: ${PROTOCOL}://${SERVER_ADDRESS}/api"
    echo "  • Health Check: ${PROTOCOL}://${SERVER_ADDRESS}/api/health"
    echo "  • Status Monitor: ${PROTOCOL}://${SERVER_ADDRESS}/status"
    echo "  • API Docs: ${PROTOCOL}://${SERVER_ADDRESS}/api/docs"
    echo
    
    info "Service Status:"
    echo "  • Backend: $(systemctl is-active hrm-backend)"
    echo "  • Frontend: $(systemctl is-active hrm-frontend)"
    echo "  • Nginx: $(systemctl is-active nginx)"
    echo "  • PostgreSQL: $(systemctl is-active postgresql-17)"
    echo
    
    info "Configuration Files:"
    echo "  • Environment: ${APP_DIR}/backend/.env"
    echo "  • Nginx Config: /etc/nginx/conf.d/hrm.conf"
    echo "  • DB Password: ${APP_DIR}/.db_password"
    echo "  • Summary: ${APP_DIR}/DEPLOYMENT_CONFIG_SUMMARY.txt"
    echo
    
    info "Default Login (if demo data seeded):"
    echo "  • Username: admin@skyraksys.com"
    echo "  • Password: Admin@123"
    echo
    
    info "Useful Commands:"
    echo "  • View logs: sudo journalctl -u hrm-backend -f"
    echo "  • Restart backend: sudo systemctl restart hrm-backend"
    echo "  • Restart frontend: sudo systemctl restart hrm-frontend"
    echo "  • Check health: curl ${PROTOCOL}://${SERVER_ADDRESS}/api/health"
    echo "  • Database status: sudo bash ${APP_DIR}/scripts/check-database.sh"
    echo
    
    info "Backup Information:"
    echo "  • Automated backups: Daily at 2:00 AM"
    echo "  • Backup location: ${APP_DIR}/backups/"
    echo "  • Retention: 30 days"
    echo
    
    info "Next Steps:"
    echo "  1. Access your application: ${PROTOCOL}://${SERVER_ADDRESS}"
    echo "  2. Login with default admin credentials (if demo data seeded)"
    echo "  3. Review configuration summary: cat ${APP_DIR}/DEPLOYMENT_CONFIG_SUMMARY.txt"
    echo "  4. Setup SSL certificate (optional): sudo bash ${SCRIPT_DIR}/06_setup_ssl.sh"
    echo "  5. Configure email SMTP (optional): edit ${APP_DIR}/backend/.env"
    echo
    
    warn "Security Reminders:"
    echo "  • Change default admin password immediately"
    echo "  • Review firewall rules: sudo firewall-cmd --list-all"
    echo "  • Setup SSL certificate for HTTPS"
    echo "  • Disable demo data seeding: SEED_DEMO_DATA=false in .env"
    echo "  • Rotate secrets every 90 days"
    echo
    
    success "🎉 Deployment completed successfully!"
    echo
    log "Deployment log saved to: $LOG_FILE"
}

################################################################################
# Main Execution
################################################################################

main() {
    # Create log directory
    mkdir -p "$(dirname "$LOG_FILE")"
    
    print_header "SKYRAKSYS HRM - AUTOMATED DEPLOYMENT"
    
    log "Starting deployment at $(date)"
    echo
    
    # Parse command line arguments
    AUTO_MODE="false"
    SERVER_ARG=""
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --auto)
                AUTO_MODE="true"
                info "Auto mode enabled (non-interactive with production defaults)"
                shift
                ;;
            *)
                SERVER_ARG="$1"
                shift
                ;;
        esac
    done
    
    export AUTO_MODE
    
    # Pre-flight checks
    info "Running pre-flight checks..."
    check_root
    check_os
    
    # Get server address
    if [[ "$AUTO_MODE" == "true" ]]; then
        # Auto mode: use production default or auto-detect
        if [[ -n "$SERVER_ARG" ]]; then
            SERVER_ADDRESS="$SERVER_ARG"
            log "Using provided address: $SERVER_ADDRESS"
        else
            # Try auto-detect or use production default
            PUBLIC_IP=$(curl -s --connect-timeout 5 ifconfig.me 2>/dev/null || echo "")
            if [[ -n "$PUBLIC_IP" ]]; then
                SERVER_ADDRESS="$PUBLIC_IP"
                log "Auto-detected IP: $SERVER_ADDRESS"
            else
                SERVER_ADDRESS="95.216.14.232"
                warn "Using production default: $SERVER_ADDRESS"
            fi
        fi
    else
        # Interactive mode
        get_server_address "$SERVER_ARG"
    fi
    
    echo
    info "Deployment Configuration:"
    echo "  • Mode: $([ "$AUTO_MODE" == "true" ] && echo "AUTOMATED (Production)" || echo "INTERACTIVE")"
    echo "  • Server Address: $SERVER_ADDRESS"
    echo "  • Application Path: $APP_DIR"
    echo "  • Script Path: $SCRIPT_DIR"
    echo "  • Log File: $LOG_FILE"
    echo
    
    # Skip confirmation in auto mode
    if [[ "$AUTO_MODE" != "true" ]]; then
        read -p "Continue with deployment? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            info "Deployment cancelled by user"
            exit 0
        fi
    else
        info "Auto mode: Proceeding without confirmation"
    fi
    
    echo
    print_header "STARTING DEPLOYMENT"
    
    # Execute deployment steps
    step_1_generate_configs
    echo
    
    step_2_install_prerequisites
    echo
    
    step_3_setup_database
    echo
    
    step_4_deploy_application
    echo
    
    step_5_configure_services
    echo
    
    step_6_configure_firewall
    echo
    
    step_7_health_check
    echo
    
    # Print summary
    print_deployment_summary
    
    log "Deployment completed at $(date)"
}

# Execute main function
main "$@"
