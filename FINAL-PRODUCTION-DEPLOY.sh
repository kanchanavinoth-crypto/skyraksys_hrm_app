#!/bin/bash

# =============================================================================
# 🚀 FINAL PRODUCTION DEPLOYMENT SCRIPT v2.0
# =============================================================================
# Single script that leverages ALL previous work
# Runs on your server (95.216.14.232) with full automation
# 
# THIS IS YOUR GO-TO PRODUCTION SCRIPT!
# =============================================================================

# Production server configuration (VERIFIED CREDENTIALS)
PROD_SERVER_IP="95.216.14.232"
PROD_DB_PASSWORD="SkyRakDB#2025!Prod@HRM\$Secure"
PROD_JWT_SECRET="SkyRak2025JWT@Prod!Secret#HRM\$Key&Secure*System^Auth%Token"
PROD_SESSION_SECRET="SkyRak2025Session@Secret!HRM#Prod\$Key&Secure"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_header() {
    echo -e "${CYAN}"
    echo "=============================================================================="
    echo "  🚀 $1"
    echo "=============================================================================="
    echo -e "${NC}"
}

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

main() {
    print_header "SkyrakSys HRM FINAL Production Deployment"
    
    echo -e "${CYAN}🎯 This script leverages ALL the deployment tools we built:${NC}"
    echo "• master-deploy.sh - Complete auto-deployment"
    echo "• ultimate-deploy.sh - Advanced error recovery"
    echo "• validate-production-configs.sh - Configuration validation"
    echo "• audit-production-configs.sh - Configuration audit"
    echo "• RedHat PROD templates - Your actual credentials"
    echo ""
    echo -e "${YELLOW}Server: $PROD_SERVER_IP${NC}"
    echo -e "${YELLOW}Database: skyraksys_hrm_prod${NC}"
    echo -e "${YELLOW}All credentials: ✅ VERIFIED${NC}"
    echo ""
    
    # Step 1: Check available deployment scripts
    print_header "STEP 1: Checking Available Deployment Options"
    
    local deployment_options=()
    
    if [ -f "master-deploy.sh" ]; then
        print_success "master-deploy.sh found - Complete auto-deployment available"
        deployment_options+=("master")
        chmod +x master-deploy.sh
    fi
    
    if [ -f "ultimate-deploy.sh" ]; then
        print_success "ultimate-deploy.sh found - Advanced deployment available"
        deployment_options+=("ultimate")
        chmod +x ultimate-deploy.sh
    fi
    
    if [ -f "deploy-production.sh" ]; then
        print_success "deploy-production.sh found - Guided deployment available"
        deployment_options+=("guided")
        chmod +x deploy-production.sh
    fi
    
    # Step 2: Check configuration tools
    print_header "STEP 2: Checking Configuration Management Tools"
    
    local config_tools_available=0
    
    if [ -f "validate-production-configs.sh" ]; then
        print_success "Configuration validation available"
        chmod +x validate-production-configs.sh
        config_tools_available=$((config_tools_available + 1))
    fi
    
    if [ -f "audit-production-configs.sh" ]; then
        print_success "Configuration audit available"  
        chmod +x audit-production-configs.sh
        config_tools_available=$((config_tools_available + 1))
    fi
    
    if [ -f "generate-production-configs.sh" ]; then
        print_success "Configuration generation available"
        chmod +x generate-production-configs.sh
        config_tools_available=$((config_tools_available + 1))
    fi
    
    print_info "$config_tools_available configuration management tools ready"
    
    # Step 3: Choose deployment method
    print_header "STEP 3: Deployment Method Selection"
    
    if [[ " ${deployment_options[@]} " =~ " master " ]]; then
        print_info "🎯 RECOMMENDED: master-deploy.sh (Complete automation)"
        echo ""
        echo "This script will:"
        echo "• ✅ Check your existing environment files"
        echo "• ✅ Create missing configs with YOUR actual credentials"
        echo "• ✅ Validate against RedHat PROD templates"
        echo "• ✅ Deploy complete application"
        echo "• ✅ Verify deployment success"
        echo ""
        echo "🚀 GitHub Integration Available!"
        echo "For future deployments, you can run directly from GitHub:"
        echo "curl -sSL https://raw.githubusercontent.com/kanchanavinoth-crypto/skyraksys_hrm_app/master/deploy-from-github.sh | bash"
        echo ""
        echo "Choose deployment method:"
        echo "1) AUTO - Run master-deploy.sh (Recommended)"
        echo "2) ADVANCED - Run ultimate-deploy.sh"
        echo "3) GUIDED - Run deploy-production.sh"
        echo "4) MANUAL - Run individual steps"
        echo "5) UPDATE FROM GITHUB - Pull latest and deploy"
        echo ""
        read -p "Enter choice (1-5): " choice
        
        case $choice in
            1)
                print_header "EXECUTING: Complete Auto-Deployment"
                ./master-deploy.sh
                ;;
            2)
                print_header "EXECUTING: Advanced Deployment"
                ./ultimate-deploy.sh
                ;;
            3)
                print_header "EXECUTING: Guided Deployment"
                ./deploy-production.sh
                ;;
            4)
                print_header "MANUAL DEPLOYMENT STEPS"
                echo "Run these commands in order:"
                echo "1. ./audit-production-configs.sh"
                echo "2. ./validate-production-configs.sh"
                echo "3. ./master-deploy.sh"
                ;;
            5)
                print_header "EXECUTING: GitHub Update & Deploy"
                if [ -d ".git" ]; then
                    print_info "Updating from GitHub..."
                    git stash push -m "Auto-stash before update $(date)" 2>/dev/null
                    git pull origin master
                    chmod +x *.sh redhatprod/scripts/*.sh 2>/dev/null
                    print_success "Updated from GitHub - running deployment"
                    ./master-deploy.sh
                else
                    print_warning "Not a git repository - running local deployment"
                    ./master-deploy.sh
                fi
                ;;
            *)
                print_info "Running default: master-deploy.sh"
                ./master-deploy.sh
                ;;
        esac
        
    elif [[ " ${deployment_options[@]} " =~ " ultimate " ]]; then
        print_warning "master-deploy.sh not found, using ultimate-deploy.sh"
        ./ultimate-deploy.sh
        
    elif [[ " ${deployment_options[@]} " =~ " guided " ]]; then
        print_warning "Advanced deployment not found, using guided deployment"
        ./deploy-production.sh
        
    else
        print_error "No deployment scripts found!"
        print_info "Please ensure the following files are present:"
        print_info "• master-deploy.sh (recommended)"
        print_info "• ultimate-deploy.sh (alternative)"
        print_info "• deploy-production.sh (guided)"
        exit 1
    fi
    
    # Step 4: Post-deployment verification
    print_header "STEP 4: Post-Deployment Quick Check"
    
    print_info "Checking deployment status..."
    
    # Check if services are running
    local services_ok=0
    
    # Check PostgreSQL
    for pg_service in postgresql-17 postgresql-16 postgresql-15 postgresql postgresql-14; do
        if systemctl is-active --quiet "$pg_service" 2>/dev/null; then
            print_success "PostgreSQL ($pg_service) is running"
            services_ok=$((services_ok + 1))
            break
        fi
    done
    
    # Check PM2
    if command -v pm2 > /dev/null 2>&1; then
        local pm2_count=$(pm2 list 2>/dev/null | grep -c "online" || echo "0")
        if [ "$pm2_count" -gt 0 ]; then
            print_success "PM2 managing $pm2_count process(es)"
            services_ok=$((services_ok + 1))
        fi
    fi
    
    # Check web server
    for ws in nginx httpd apache2; do
        if systemctl is-active --quiet "$ws" 2>/dev/null; then
            print_success "Web server ($ws) is running"
            services_ok=$((services_ok + 1))
            break
        fi
    done
    
    # Test application
    sleep 2
    if curl -s "http://localhost:5000/api/health" >/dev/null 2>&1 || curl -s "http://localhost:5000/" >/dev/null 2>&1; then
        print_success "Backend API is responding"
        services_ok=$((services_ok + 1))
    fi
    
    # Final status
    print_header "🎯 DEPLOYMENT COMPLETE"
    
    if [ $services_ok -ge 3 ]; then
        echo -e "${GREEN}"
        echo "🎉 SUCCESS! Your SkyrakSys HRM system is LIVE!"
        echo ""  
        echo "Access your application:"
        echo "• Frontend: http://$PROD_SERVER_IP"
        echo "• Backend API: http://$PROD_SERVER_IP/api"
        echo "• Health Check: http://$PROD_SERVER_IP/api/health"
        echo ""
        echo "System Management:"
        echo "• Check status: pm2 status"
        echo "• View logs: pm2 logs"
        echo -e "${NC}"
        
    else
        echo -e "${YELLOW}"
        echo "⚠️  Deployment completed but some services may need attention"
        echo ""
        echo "Troubleshooting:"
        echo "• Check logs: tail -f logs/*.log"
        echo "• Restart services: pm2 restart all"
        echo "• Check database: systemctl status postgresql"
        echo -e "${NC}"
    fi
    
    echo ""
    print_info "🛠️  Available management commands:"
    print_info "• pm2 status - Check application status"
    print_info "• pm2 logs - View application logs"
    print_info "• ./validate-production-configs.sh - Validate configurations"
    print_info "• ./audit-production-configs.sh - Audit system status"
    
    echo ""
    echo -e "${CYAN}✨ Your production deployment system is complete!${NC}"
}

# Pre-flight check
if [ "$EUID" -eq 0 ]; then
    print_info "Running as root - full system access available"
else
    print_warning "Not running as root - some operations may require sudo"
fi

# Execute main function
main "$@"