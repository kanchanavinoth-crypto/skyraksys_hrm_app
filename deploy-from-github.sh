#!/bin/bash

# =============================================================================
# 🚀 GitHub Direct Deployment Script v2.0
# =============================================================================
# Run directly from GitHub without local files
# Downloads and executes the complete production deployment system
# 
# Usage on your RHEL server:
# curl -sSL https://raw.githubusercontent.com/kanchanavinoth-crypto/skyraksys_hrm_app/master/deploy-from-github.sh | bash
# =============================================================================

# Production server configuration
PROD_SERVER_IP="95.216.14.232"
GITHUB_REPO="https://github.com/kanchanavinoth-crypto/skyraksys_hrm_app.git"
GITHUB_RAW="https://raw.githubusercontent.com/kanchanavinoth-crypto/skyraksys_hrm_app/master"
APP_DIR="/opt/skyraksys-hrm"

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

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "This script must be run as root"
        print_info "Please run: sudo $0"
        exit 1
    fi
}

# Install required tools
install_prerequisites() {
    print_header "Installing Prerequisites"
    
    # Update system
    print_info "Updating system packages..."
    yum update -y >/dev/null 2>&1 || dnf update -y >/dev/null 2>&1
    
    # Install git if not present
    if ! command -v git >/dev/null 2>&1; then
        print_info "Installing Git..."
        yum install -y git >/dev/null 2>&1 || dnf install -y git >/dev/null 2>&1
        if command -v git >/dev/null 2>&1; then
            print_success "Git installed successfully"
        else
            print_error "Failed to install Git"
            exit 1
        fi
    else
        print_success "Git is already installed"
    fi
    
    # Install curl if not present
    if ! command -v curl >/dev/null 2>&1; then
        print_info "Installing curl..."
        yum install -y curl >/dev/null 2>&1 || dnf install -y curl >/dev/null 2>&1
    fi
    
    print_success "Prerequisites ready"
}

# Setup application directory and clone repository
setup_repository() {
    print_header "Setting Up Repository"
    
    # Create application directory
    mkdir -p "$APP_DIR"
    cd "$APP_DIR"
    
    # Check if repository already exists
    if [ -d "skyraksys_hrm_app/.git" ]; then
        print_info "Repository exists - updating..."
        cd skyraksys_hrm_app
        
        # Backup any local changes
        if ! git diff-index --quiet HEAD --; then
            print_warning "Local changes detected - creating backup"
            git stash push -m "Backup before GitHub deployment $(date)"
        fi
        
        # Pull latest changes
        git fetch origin
        git reset --hard origin/master
        git pull origin master
        print_success "Repository updated to latest version"
        
    else
        print_info "Cloning repository from GitHub..."
        
        # Remove any existing directory
        rm -rf skyraksys_hrm_app
        
        # Clone repository
        if git clone "$GITHUB_REPO"; then
            print_success "Repository cloned successfully"
            cd skyraksys_hrm_app
        else
            print_error "Failed to clone repository"
            print_info "Falling back to direct download method..."
            
            # Fallback: Download essential files directly
            mkdir -p skyraksys_hrm_app
            cd skyraksys_hrm_app
            
            essential_files=(
                "FINAL-PRODUCTION-DEPLOY.sh"
                "master-deploy.sh"
                "ultimate-deploy.sh"
                "validate-production-configs.sh"
                "audit-production-configs.sh"
            )
            
            for file in "${essential_files[@]}"; do
                if curl -sSL "$GITHUB_RAW/$file" -o "$file"; then
                    print_success "Downloaded $file"
                else
                    print_warning "Failed to download $file"
                fi
            done
        fi
    fi
    
    # Make scripts executable
    print_info "Setting script permissions..."
    chmod +x *.sh 2>/dev/null
    chmod +x redhatprod/scripts/*.sh 2>/dev/null
    
    print_success "Repository setup completed"
    print_info "Current directory: $(pwd)"
}

# Verify deployment files
verify_deployment_files() {
    print_header "Verifying Deployment Files"
    
    local required_files=(
        "FINAL-PRODUCTION-DEPLOY.sh"
        "master-deploy.sh"
        "ultimate-deploy.sh"
    )
    
    local files_found=0
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            print_success "$file found"
            files_found=$((files_found + 1))
        else
            print_warning "$file not found"
        fi
    done
    
    if [ $files_found -eq 0 ]; then
        print_error "No deployment files found!"
        print_info "Attempting to download directly from GitHub..."
        
        # Download the main deployment script
        if curl -sSL "$GITHUB_RAW/master-deploy.sh" -o "master-deploy.sh"; then
            chmod +x master-deploy.sh
            print_success "Downloaded master-deploy.sh"
            files_found=1
        else
            print_error "Failed to download deployment scripts"
            exit 1
        fi
    fi
    
    print_success "$files_found deployment file(s) ready"
}

# Execute deployment
execute_deployment() {
    print_header "Executing Production Deployment"
    
    # Check available deployment options
    if [ -f "FINAL-PRODUCTION-DEPLOY.sh" ]; then
        print_info "🎯 Running FINAL-PRODUCTION-DEPLOY.sh (Complete system)"
        chmod +x FINAL-PRODUCTION-DEPLOY.sh
        ./FINAL-PRODUCTION-DEPLOY.sh
        
    elif [ -f "master-deploy.sh" ]; then
        print_info "🎯 Running master-deploy.sh (Auto deployment)"
        chmod +x master-deploy.sh
        ./master-deploy.sh
        
    elif [ -f "ultimate-deploy.sh" ]; then
        print_info "🎯 Running ultimate-deploy.sh (Advanced deployment)"
        chmod +x ultimate-deploy.sh
        ./ultimate-deploy.sh
        
    else
        print_error "No deployment scripts available"
        print_info "Manual deployment required"
        exit 1
    fi
}

# Main execution
main() {
    print_header "SkyrakSys HRM GitHub Direct Deployment"
    
    echo -e "${CYAN}🎯 This script will:${NC}"
    echo "• Clone/update your repository from GitHub"
    echo "• Set up the complete deployment system"
    echo "• Execute production deployment automatically"
    echo "• Deploy to server: $PROD_SERVER_IP"
    echo ""
    echo -e "${YELLOW}⚠️  This will deploy directly from GitHub master branch${NC}"
    echo ""
    
    read -p "Continue with GitHub deployment? (y/N): " -r
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Deployment cancelled"
        exit 0
    fi
    
    # Execute deployment steps
    check_root
    install_prerequisites
    setup_repository
    verify_deployment_files
    execute_deployment
    
    # Final status
    print_header "🎯 GitHub Deployment Complete"
    
    echo -e "${GREEN}✨ Your SkyrakSys HRM system has been deployed from GitHub!${NC}"
    echo ""
    echo "Access your application:"
    echo "• Frontend: http://$PROD_SERVER_IP"
    echo "• Backend API: http://$PROD_SERVER_IP/api"
    echo "• Health Check: http://$PROD_SERVER_IP/api/health"
    echo ""
    echo "Management commands:"
    echo "• pm2 status - Check application status"
    echo "• pm2 logs - View logs"
    echo "• cd $APP_DIR/skyraksys_hrm_app - Access deployment scripts"
}

# Execute main function
main "$@"