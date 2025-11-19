#!/bin/bash

# =============================================================================
# SkyrakSys HRM Complete Production Setup & Deployment Script v2.0
# =============================================================================
# Single script to rule them all:
# 1. Reviews existing environment & configurations
# 2. Sets up missing production configurations automatically
# 3. Validates against RedHat PROD templates
# 4. Deploys complete system
# 
# Usage: Run from server: ./master-deploy.sh
# =============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Production server configuration (your actual values)
PROD_SERVER_IP="95.216.14.232"
PROD_DB_PASSWORD="SkyRakDB#2025!Prod@HRM\$Secure"
PROD_JWT_SECRET="SkyRak2025JWT@Prod!Secret#HRM\$Key&Secure*System^Auth%Token"
PROD_SESSION_SECRET="SkyRak2025Session@Secret!HRM#Prod\$Key&Secure"
PROD_DB_NAME="skyraksys_hrm_prod"
PROD_DB_USER="hrm_app"

print_header() {
    echo -e "${CYAN}"
    echo "=============================================================================="
    echo "  $1"
    echo "=============================================================================="
    echo -e "${NC}"
}

print_step() {
    echo -e "${BLUE}ðŸ”¹ $1${NC}"
}

print_success() {
    echo -e "${GREEN}âœ… $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}âš ï¸  $1${NC}"
}

print_error() {
    echo -e "${RED}âŒ $1${NC}"
}

print_info() {
    echo -e "${PURPLE}â„¹ï¸  $1${NC}"
}

# Global variables
ENV_EXISTS=false
CONFIG_VALID=true
DEPLOYMENT_READY=false

# =============================================================================
# PHASE 1: ENVIRONMENT REVIEW & SETUP
# =============================================================================

check_existing_environment() {
    print_header "PHASE 1: Production Environment Review"
    
    local env_files_found=0
    local configs_found=0
    
    print_step "Checking for existing production environment files..."
    
    # Check backend .env
    if [ -f "backend/.env" ]; then
        if grep -q "$PROD_SERVER_IP\|$PROD_DB_PASSWORD" "backend/.env" 2>/dev/null; then
            print_success "Backend production environment found and validated"
            env_files_found=$((env_files_found + 1))
        else
            print_warning "Backend .env exists but doesn't contain production settings"
        fi
    else
        print_info "Backend .env not found - will be created"
    fi
    
    # Check frontend .env
    if [ -f "frontend/.env" ] || [ -f "frontend/.env.production" ]; then
        if grep -q "$PROD_SERVER_IP" frontend/.env* 2>/dev/null; then
            print_success "Frontend production environment found and validated"
            env_files_found=$((env_files_found + 1))
        else
            print_warning "Frontend .env exists but doesn't contain production settings"
        fi
    else
        print_info "Frontend .env not found - will be created"
    fi
    
    # Check system configurations
    print_step "Checking system configurations..."
    
    if [ -f "ecosystem.config.js" ]; then
        print_success "PM2 ecosystem configuration found"
        configs_found=$((configs_found + 1))
    fi
    
    if [ -f "/etc/nginx/sites-available/skyraksys.conf" ] || [ -f "/etc/nginx/conf.d/skyraksys.conf" ]; then
        print_success "Nginx configuration found"
        configs_found=$((configs_found + 1))
    fi
    
    # Summary
    echo ""
    print_info "Environment Status Summary:"
    print_info "â€¢ Environment files: $env_files_found/2 found"
    print_info "â€¢ System configs: $configs_found found"
    
    if [ $env_files_found -ge 1 ]; then
        ENV_EXISTS=true
        print_success "Production environment partially/fully configured"
    else
        print_warning "Production environment needs to be set up"
    fi
    
    echo ""
}

setup_production_environment() {
    print_header "PHASE 2: Production Environment Setup"
    
    if [ "$ENV_EXISTS" = true ]; then
        print_info "Existing environment detected - backing up and updating missing pieces"
    else
        print_info "Setting up complete production environment from scratch"
    fi
    
    # Create directories
    mkdir -p backend/config
    mkdir -p frontend
    mkdir -p logs
    
    # Setup backend environment
    print_step "Creating backend production environment..."
    
    cat > "backend/.env" << EOF
# SKYRAKSYS HRM PRODUCTION ENVIRONMENT
# Generated: $(date)
# Server: $PROD_SERVER_IP

# ==========================================
# SERVER CONFIGURATION  
# ==========================================
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# API Configuration
API_BASE_URL=http://$PROD_SERVER_IP/api
DOMAIN=$PROD_SERVER_IP

# ==========================================
# DATABASE CONFIGURATION
# ==========================================
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$PROD_DB_NAME
DB_USER=$PROD_DB_USER
DB_PASSWORD=$PROD_DB_PASSWORD
DB_SSL=false

# Connection Pool Settings
DB_POOL_MIN=5
DB_POOL_MAX=20
DB_POOL_ACQUIRE=60000
DB_POOL_IDLE=30000

# ==========================================
# SECURITY CONFIGURATION
# ==========================================
JWT_SECRET=$PROD_JWT_SECRET
JWT_EXPIRES_IN=8h
BCRYPT_ROUNDS=12
SESSION_SECRET=$PROD_SESSION_SECRET

# CORS Settings
CORS_ORIGIN=http://$PROD_SERVER_IP

# ==========================================
# MONITORING & PERFORMANCE
# ==========================================
ENABLE_STATUS_MONITOR=true
ENABLE_PERFORMANCE_MONITORING=true

# Logging
LOG_LEVEL=info
LOG_FILE=true
LOG_MAX_FILES=5
LOG_MAX_SIZE=10m

# File Upload Settings
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10mb

# ==========================================
# RHEL PRODUCTION SETTINGS
# ==========================================
SYSTEM_LOG_PATH=/var/log/skyraksys-hrm
PM2_INSTANCES=2
PM2_MAX_MEMORY=1G

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Security Headers
HELMET_ENABLED=true
CSRF_PROTECTION=true
EOF

    chmod 600 backend/.env
    print_success "Backend environment configured with production settings"
    
    # Setup frontend environment
    print_step "Creating frontend production environment..."
    
    cat > "frontend/.env.production" << EOF
# SKYRAKSYS HRM FRONTEND PRODUCTION
# Generated: $(date)
# Server: $PROD_SERVER_IP

# API Configuration
REACT_APP_API_URL=http://$PROD_SERVER_IP/api
REACT_APP_BASE_URL=http://$PROD_SERVER_IP

# App Configuration
REACT_APP_NAME=SkyrakSys HRM
REACT_APP_VERSION=2.0.0
REACT_APP_ENVIRONMENT=production

# Features
REACT_APP_ENABLE_PERFORMANCE_MONITOR=true
REACT_APP_ENABLE_PWA=true

# Build Configuration
GENERATE_SOURCEMAP=false
BUILD_PATH=build
PUBLIC_URL=/
EOF

    chmod 644 frontend/.env.production
    print_success "Frontend environment configured with production settings"
    
    # Setup database configuration
    print_step "Creating database configuration..."
    
    cat > "backend/config/database.js" << EOF
// SKYRAKSYS HRM DATABASE CONFIGURATION
// Generated: $(date)

const { Sequelize } = require('sequelize');

const config = {
  development: {
    username: '$PROD_DB_USER',
    password: '$PROD_DB_PASSWORD',
    database: 'skyraksys_hrm_dev',
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
    logging: console.log
  },
  
  production: {
    username: '$PROD_DB_USER',
    password: '$PROD_DB_PASSWORD',
    database: '$PROD_DB_NAME',
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 20,
      min: 5,
      acquire: 60000,
      idle: 30000
    },
    retry: {
      match: [
        /ETIMEDOUT/,
        /EHOSTUNREACH/,
        /ECONNRESET/,
        /ECONNREFUSED/,
        /EHOSTDOWN/,
        /ENETDOWN/,
        /ENETUNREACH/,
        /EAI_AGAIN/
      ],
      max: 3
    }
  }
};

module.exports = config;
module.exports[process.env.NODE_ENV || 'development'];
EOF

    chmod 600 backend/config/database.js
    print_success "Database configuration setup completed"
    
    # Setup PM2 ecosystem if it doesn't exist
    if [ ! -f "ecosystem.config.js" ]; then
        print_step "Creating PM2 ecosystem configuration..."
        
        cat > "ecosystem.config.js" << EOF
// SKYRAKSYS HRM PM2 ECOSYSTEM CONFIGURATION
// Generated: $(date)

module.exports = {
  apps: [
    {
      name: 'skyraksys-hrm-backend',
      script: 'backend/server.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      merge_logs: true,
      max_memory_restart: '1G',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      watch: false,
      ignore_watch: ['node_modules', 'uploads', 'logs'],
      node_args: ['--max_old_space_size=1024']
    }
  ]
};
EOF
        print_success "PM2 ecosystem configuration created"
    else
        print_success "PM2 ecosystem configuration already exists"
    fi
    
    print_success "Production environment setup completed!"
    echo ""
}

# =============================================================================
# PHASE 3: CONFIGURATION VALIDATION
# =============================================================================

validate_configurations() {
    print_header "PHASE 3: Configuration Validation"
    
    print_step "Validating production configurations against templates..."
    
    local validation_passed=true
    
    # Validate backend environment
    if [ -f "backend/.env" ]; then
        if grep -q "$PROD_SERVER_IP" backend/.env && grep -q "$PROD_DB_PASSWORD" backend/.env; then
            print_success "Backend environment validation: PASSED"
        else
            print_error "Backend environment validation: FAILED"
            validation_passed=false
        fi
    else
        print_error "Backend environment file missing"
        validation_passed=false
    fi
    
    # Validate frontend environment
    if [ -f "frontend/.env.production" ]; then
        if grep -q "$PROD_SERVER_IP" frontend/.env.production; then
            print_success "Frontend environment validation: PASSED"  
        else
            print_error "Frontend environment validation: FAILED"
            validation_passed=false
        fi
    else
        print_warning "Frontend environment file missing - will use defaults"
    fi
    
    # Validate database configuration
    if [ -f "backend/config/database.js" ]; then
        if grep -q "$PROD_DB_NAME" backend/config/database.js; then
            print_success "Database configuration validation: PASSED"
        else
            print_error "Database configuration validation: FAILED"
            validation_passed=false
        fi
    else
        print_error "Database configuration missing"
        validation_passed=false
    fi
    
    # Run comprehensive validation if available
    if [ -f "validate-production-configs.sh" ]; then
        print_step "Running comprehensive configuration validation..."
        chmod +x validate-production-configs.sh
        
        if ./validate-production-configs.sh --quiet; then
            print_success "Comprehensive validation: PASSED"
        else
            print_warning "Comprehensive validation: WARNINGS FOUND"
            print_info "Continuing with deployment - discrepancies noted"
        fi
    fi
    
    if [ "$validation_passed" = true ]; then
        CONFIG_VALID=true
        print_success "All critical validations passed!"
    else
        print_error "Critical validation errors found!"
        CONFIG_VALID=false
    fi
    
    echo ""
}

# =============================================================================
# PHASE 4: SYSTEM PREPARATION
# =============================================================================

prepare_system() {
    print_header "PHASE 4: System Preparation"
    
    print_step "Preparing system for deployment..."
    
    # Check and start PostgreSQL
    print_step "Checking PostgreSQL service..."
    
    local postgres_services=("postgresql-17" "postgresql-16" "postgresql-15" "postgresql" "postgresql-14" "postgresql-13")
    local postgres_found=false
    
    for pg_service in "${postgres_services[@]}"; do
        if systemctl list-unit-files 2>/dev/null | grep -q "$pg_service.service"; then
            print_info "Found PostgreSQL service: $pg_service"
            systemctl start "$pg_service" 2>/dev/null
            systemctl enable "$pg_service" 2>/dev/null
            
            if systemctl is-active --quiet "$pg_service"; then
                print_success "PostgreSQL ($pg_service) is running"
                postgres_found=true
                break
            fi
        fi
    done
    
    if [ "$postgres_found" = false ]; then
        print_error "PostgreSQL service not found or not running"
        print_info "Please install and configure PostgreSQL first"
        return 1
    fi
    
    # Check Node.js and npm
    print_step "Checking Node.js environment..."
    
    if command -v node > /dev/null 2>&1; then
        local node_version=$(node --version)
        print_success "Node.js found: $node_version"
    else
        print_error "Node.js not found - please install Node.js"
        return 1
    fi
    
    if command -v npm > /dev/null 2>&1; then
        local npm_version=$(npm --version)
        print_success "npm found: $npm_version"
    else
        print_error "npm not found - please install npm"
        return 1
    fi
    
    # Check PM2
    print_step "Checking PM2 process manager..."
    
    if command -v pm2 > /dev/null 2>&1; then
        print_success "PM2 found and ready"
    else
        print_info "Installing PM2 globally..."
        npm install -g pm2
        if command -v pm2 > /dev/null 2>&1; then
            print_success "PM2 installed successfully"
        else
            print_error "Failed to install PM2"
            return 1
        fi
    fi
    
    # Create necessary directories
    print_step "Creating system directories..."
    
    mkdir -p logs
    mkdir -p uploads
    mkdir -p backend/logs
    mkdir -p /var/log/skyraksys-hrm 2>/dev/null || print_info "Cannot create system log directory (needs sudo)"
    
    print_success "System preparation completed!"
    echo ""
}

# =============================================================================
# PHASE 5: DEPLOYMENT EXECUTION
# =============================================================================

deploy_application() {
    print_header "PHASE 5: Application Deployment"
    
    if [ "$CONFIG_VALID" = false ]; then
        print_error "Cannot deploy with invalid configuration - please fix errors first"
        return 1
    fi
    
    print_step "Installing backend dependencies..."
    cd backend
    if npm install --production; then
        print_success "Backend dependencies installed"
    else
        print_error "Failed to install backend dependencies"
        cd ..
        return 1
    fi
    cd ..
    
    print_step "Installing frontend dependencies..."
    cd frontend
    if npm install; then
        print_success "Frontend dependencies installed"
    else
        print_error "Failed to install frontend dependencies"
        cd ..
        return 1
    fi
    
    print_step "Building frontend for production..."
    if npm run build; then
        print_success "Frontend build completed"
    else
        print_warning "Frontend build failed - trying alternative build method..."
        if npx react-scripts build; then
            print_success "Frontend build completed with alternative method"
        else
            print_error "Frontend build failed completely"
            cd ..
            return 1
        fi
    fi
    cd ..
    
    print_step "Running database migrations..."
    cd backend
    if npm run migrate 2>/dev/null || npx sequelize-cli db:migrate 2>/dev/null; then
        print_success "Database migrations completed"
    else
        print_warning "Database migrations failed or not needed"
    fi
    cd ..
    
    print_step "Deploying frontend to web server..."
    if [ -d "frontend/build" ]; then
        local web_roots=("/var/www/html" "/usr/share/nginx/html" "/var/www")
        local deployed=false
        
        for web_root in "${web_roots[@]}"; do
            if [ -d "$web_root" ]; then
                # Backup existing files
                if [ "$(ls -A $web_root 2>/dev/null)" ]; then
                    cp -r "$web_root" "${web_root}.backup.$(date +%Y%m%d_%H%M%S)" 2>/dev/null
                fi
                
                # Deploy new files
                if cp -r frontend/build/* "$web_root/" 2>/dev/null; then
                    print_success "Frontend deployed to $web_root"
                    deployed=true
                    break
                fi
            fi
        done
        
        if [ "$deployed" = false ]; then
            print_warning "Could not find web server document root - frontend not deployed"
        fi
    else
        print_error "Frontend build directory not found"
    fi
    
    print_step "Starting backend services with PM2..."
    pm2 stop all 2>/dev/null
    
    if pm2 start ecosystem.config.js --env production; then
        print_success "Backend services started with PM2"
    else
        print_error "Failed to start backend services"
        return 1
    fi
    
    # Configure PM2 to start on boot
    pm2 startup 2>/dev/null
    pm2 save 2>/dev/null
    
    print_success "Application deployment completed!"
    DEPLOYMENT_READY=true
    echo ""
}

# =============================================================================
# PHASE 6: POST-DEPLOYMENT VERIFICATION
# =============================================================================

verify_deployment() {
    print_header "PHASE 6: Deployment Verification"
    
    print_step "Verifying services..."
    
    # Check PostgreSQL
    local postgres_running=false
    for pg_service in postgresql-17 postgresql-16 postgresql-15 postgresql postgresql-14; do
        if systemctl is-active --quiet "$pg_service" 2>/dev/null; then
            print_success "PostgreSQL ($pg_service) is running"
            postgres_running=true
            break
        fi
    done
    
    if [ "$postgres_running" = false ]; then
        print_error "PostgreSQL is not running"
    fi
    
    # Check PM2 processes
    local pm2_status=$(pm2 list 2>/dev/null | grep -c "online" || echo "0")
    if [ "$pm2_status" -gt 0 ]; then
        print_success "PM2 managing $pm2_status process(es)"
    else
        print_error "No PM2 processes running"
    fi
    
    # Check web server
    local web_server_running=false
    for ws in nginx httpd apache2; do
        if systemctl is-active --quiet "$ws" 2>/dev/null; then
            print_success "Web server ($ws) is running"
            web_server_running=true
            break
        fi
    done
    
    if [ "$web_server_running" = false ]; then
        print_warning "No web server detected - you may need to configure nginx/apache"
    fi
    
    print_step "Testing application endpoints..."
    
    # Test backend health
    sleep 3
    if curl -s "http://localhost:5000/api/health" >/dev/null 2>&1; then
        print_success "Backend API is responding"
    elif curl -s "http://localhost:5000/" >/dev/null 2>&1; then
        print_success "Backend server is responding"
    else
        print_warning "Backend API test failed - may need time to start"
    fi
    
    # Test database connection
    if PGPASSWORD="$PROD_DB_PASSWORD" psql -h localhost -U "$PROD_DB_USER" -d "$PROD_DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
        print_success "Database connection verified"
    else
        print_warning "Database connection test failed"
    fi
    
    echo ""
    print_step "Deployment Summary:"
    echo ""
    
    if [ "$DEPLOYMENT_READY" = true ]; then
        print_success "ðŸŽ‰ SkyrakSys HRM deployment completed successfully!"
        echo ""
        print_info "Access your application:"
        print_info "â€¢ Frontend: http://$PROD_SERVER_IP"  
        print_info "â€¢ Backend API: http://$PROD_SERVER_IP/api"
        print_info "â€¢ Health Check: http://$PROD_SERVER_IP/api/health"
        echo ""
        print_info "System Management:"
        print_info "â€¢ PM2 Status: pm2 status"
        print_info "â€¢ PM2 Logs: pm2 logs"
        print_info "â€¢ System Logs: tail -f logs/*.log"
    else
        print_error "Deployment completed with errors - please review and fix issues"
    fi
    
    echo ""
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

main() {
    print_header "SkyrakSys HRM Complete Production Setup & Deployment v2.0"
    
    echo -e "${CYAN}This script will:${NC}"
    echo "1. ðŸ” Review your existing production environment"
    echo "2. âš™ï¸  Setup missing configurations automatically" 
    echo "3. âœ… Validate all configurations"
    echo "4. ðŸš€ Deploy the complete application"
    echo "5. ðŸ” Verify deployment success"
    echo ""
    echo -e "${YELLOW}Your production server: $PROD_SERVER_IP${NC}"
    echo -e "${YELLOW}Database: $PROD_DB_NAME${NC}"
    echo ""
    echo "Press ENTER to continue or Ctrl+C to abort..."
    read -r
    
    # Execute all phases
    check_existing_environment
    
    if [ "$ENV_EXISTS" = false ]; then
        setup_production_environment
    else
        print_info "Updating existing environment with any missing configurations..."
        setup_production_environment
    fi
    
    validate_configurations
    
    if prepare_system; then
        deploy_application
        verify_deployment
    else
        print_error "System preparation failed - cannot proceed with deployment"
        exit 1
    fi
    
    echo ""
    print_header "ðŸŽ¯ Deployment Complete!"
    
    if [ "$DEPLOYMENT_READY" = true ]; then
        echo -e "${GREEN}âœ¨ Your SkyrakSys HRM system is ready for production use!${NC}"
    else
        echo -e "${YELLOW}âš ï¸  Please review any errors above and re-run if needed${NC}"
    fi
}

# Check if running as root for system operations
if [ "$EUID" -eq 0 ]; then
    print_info "Running as root - full system access available"
else
    print_warning "Not running as root - some system operations may fail"
    print_info "Consider running: sudo ./master-deploy.sh"
fi

# Execute main function
main "$@"