#!/bin/bash

# Final Deployment Script - Execute with Enhanced Configuration Protection
# This script will run the ultimate-deploy.sh with all safety measures

echo "🚀 SkyrakSys HRM Production Deployment"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_header() {
    echo -e "${CYAN}🎯 $1${NC}"
    echo "$(printf '=%.0s' {1..50})"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Pre-deployment checks
print_header "Pre-Deployment Safety Checks"

# Check if we're in the right directory
if [ ! -f "ultimate-deploy.sh" ]; then
    print_error "ultimate-deploy.sh not found in current directory"
    print_info "Please run this script from the HRM application root directory"
    exit 1
fi

print_success "Found ultimate-deploy.sh"

# Check if we have the audit script
if [ ! -f "audit-production-configs.sh" ]; then
    print_warning "audit-production-configs.sh not found"
    print_info "Skipping configuration audit"
else
    print_info "Running production configuration audit first..."
    echo ""
    chmod +x audit-production-configs.sh
    ./audit-production-configs.sh
    echo ""
    
    print_info "Press ENTER to continue with deployment, or Ctrl+C to abort"
    read -r
fi

# Check if we have the validation script
if [ -f "validate-production-configs.sh" ]; then
    print_info "Running configuration validation against RedHat PROD templates..."
    echo ""
    chmod +x validate-production-configs.sh
    
    if ./validate-production-configs.sh --quiet; then
        print_success "✅ Configuration validation passed - all configs are consistent"
    else
        print_warning "⚠️ Configuration discrepancies detected with RedHat PROD templates"
        print_info "This may indicate configuration drift or missing updates"
        echo ""
        print_info "Options:"
        print_info "1. Continue deployment (existing configs will be preserved)"
        print_info "2. Run full validation: ./validate-production-configs.sh"
        print_info "3. Generate new configs: ./generate-production-configs.sh"
        print_info "4. Abort deployment"
        echo ""
        print_info "Continue deployment? (y/N): "
        read -r validation_choice
        if [[ ! "$validation_choice" =~ ^[Yy]$ ]]; then
            print_error "Deployment aborted for configuration review"
            print_info "Run './validate-production-configs.sh' for detailed analysis"
            exit 1
        fi
        print_info "Proceeding with existing configurations preserved..."
    fi
    echo ""
fi

print_header "Deployment Execution Plan"

echo -e "${BLUE}📋 What will happen during deployment:${NC}"
echo ""
echo "1. 🔐 CONFIGURATION PRESERVATION:"
echo "   • All existing .env files will be backed up"
echo "   • Database configurations will be preserved"
echo "   • Web server configs (nginx/apache) will be kept"
echo "   • SSL certificates will be protected"
echo "   • PM2 ecosystem settings will be maintained"
echo ""
echo "2. 🔄 CODE DEPLOYMENT:"
echo "   • Latest code will be pulled from Git repository"
echo "   • Dependencies will be updated (backend & frontend)"
echo "   • Database migrations will be applied safely"
echo "   • Frontend will be built with multiple fallback strategies"
echo ""
echo "3. 🚀 SERVICE MANAGEMENT:"
echo "   • PostgreSQL service will be detected and started"
echo "   • PM2 processes will be restarted with preserved configs"
echo "   • Web server will be reloaded with existing configurations"
echo "   • Health checks will verify all services are running"
echo ""

print_warning "IMPORTANT SAFETY MEASURES:"
echo "• No existing configuration files will be overwritten"
echo "• All configs are backed up with timestamps before any changes"
echo "• Database schema changes are applied incrementally"
echo "• Rollback capabilities are maintained throughout"

echo ""
print_info "Press ENTER to start the deployment, or Ctrl+C to abort"
read -r

print_header "Starting Enhanced Deployment"

# Make sure the script is executable
chmod +x ultimate-deploy.sh

# Execute the deployment with proper logging
echo -e "${CYAN}🎬 Executing ultimate-deploy.sh...${NC}"
echo ""

# Create logs directory if it doesn't exist
mkdir -p logs

# Run the deployment script with logging
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="logs/deployment_${TIMESTAMP}.log"

# Execute with both console output and logging
if ./ultimate-deploy.sh 2>&1 | tee "$LOG_FILE"; then
    echo ""
    print_success "Deployment completed successfully!"
    print_info "Full deployment log saved to: $LOG_FILE"
    
    echo ""
    print_header "Post-Deployment Summary"
    
    # Show final status
    echo -e "${BLUE}📊 Final System Status:${NC}"
    
    # Check PM2 status
    if command -v pm2 > /dev/null 2>&1; then
        echo ""
        echo -e "${CYAN}📱 PM2 Processes:${NC}"
        pm2 list
    fi
    
    # Check web server status
    echo ""
    echo -e "${CYAN}🌐 Web Server Status:${NC}"
    if systemctl is-active nginx >/dev/null 2>&1; then
        print_success "Nginx is running"
    elif systemctl is-active httpd >/dev/null 2>&1; then
        print_success "Apache is running"
    elif systemctl is-active apache2 >/dev/null 2>&1; then
        print_success "Apache2 is running"
    else
        print_warning "No web server detected as running"
    fi
    
    # Check PostgreSQL status
    echo ""
    echo -e "${CYAN}🗄️ Database Status:${NC}"
    for pg_service in postgresql-17 postgresql-16 postgresql-15 postgresql; do
        if systemctl is-active "$pg_service" >/dev/null 2>&1; then
            print_success "PostgreSQL ($pg_service) is running"
            break
        fi
    done
    
    echo ""
    print_header "Next Steps"
    print_info "1. Test the application in your browser"
    print_info "2. Verify all features are working correctly"
    print_info "3. Monitor system performance"
    print_info "4. Check application logs for any issues"
    
    echo ""
    print_success "🎉 Deployment completed successfully with all configurations preserved!"
    
else
    echo ""
    print_error "Deployment failed!"
    print_info "Check the deployment log for details: $LOG_FILE"
    print_info "Your existing configurations remain untouched and safe"
    
    echo ""
    print_info "Common troubleshooting steps:"
    print_info "1. Check service status: systemctl status postgresql nginx"
    print_info "2. Verify permissions: ls -la backend/ frontend/"
    print_info "3. Check logs: tail -f logs/deployment_${TIMESTAMP}.log"
    
    exit 1
fi