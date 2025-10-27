#!/bin/bash

# ============================================
# SkyRakSys HRM - Unix/Linux Production Setup
# ============================================
# This script sets up a complete production
# environment for the HRM system on Unix/Linux
# with automatic password generation for novice users
# ============================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PASSWORDS_FILE="$PROJECT_DIR/config/generated-passwords.txt"
ENV_FILE="$PROJECT_DIR/.env"

# Logging function
log() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Generate secure password
generate_password() {
    local length=${1:-32}
    if command -v openssl >/dev/null 2>&1; then
        openssl rand -base64 48 | tr -d "=+/" | cut -c1-${length}
    elif command -v pwgen >/dev/null 2>&1; then
        pwgen -s ${length} 1
    else
        # Fallback method
        head /dev/urandom | tr -dc A-Za-z0-9 | head -c ${length}
    fi
}

# Store password securely
store_password() {
    local service="$1"
    local username="$2"
    local password="$3"
    
    echo "[$service]" >> "$PASSWORDS_FILE"
    echo "Username: $username" >> "$PASSWORDS_FILE"
    echo "Password: $password" >> "$PASSWORDS_FILE"
    echo "Generated: $(date)" >> "$PASSWORDS_FILE"
    echo "" >> "$PASSWORDS_FILE"
    
    # Set secure permissions
    chmod 600 "$PASSWORDS_FILE"
}

# Print header
echo ""
log $CYAN "========================================"
log $CYAN " SkyRakSys HRM Production Setup"
log $CYAN " Automatic Password Generation Enabled"
log $CYAN "========================================"
echo ""

# Initialize passwords file
mkdir -p "$PROJECT_DIR/config"
echo "# SkyRakSys HRM Production Passwords" > "$PASSWORDS_FILE"
echo "# Generated on: $(date)" >> "$PASSWORDS_FILE"
echo "# IMPORTANT: Keep this file secure and never commit to version control" >> "$PASSWORDS_FILE"
echo "" >> "$PASSWORDS_FILE"

log $GREEN "🔐 Password generation initialized"
log $YELLOW "📝 All generated passwords will be saved to: $PASSWORDS_FILE"
echo ""

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   log $YELLOW "⚠️  Warning: Running as root. Consider using a non-root user for security."
   read -p "Continue anyway? (y/N): " -n 1 -r
   echo
   if [[ ! $REPLY =~ ^[Yy]$ ]]; then
       exit 1
   fi
fi

# Detect OS
OS=""
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        DISTRO=$ID
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
    DISTRO="macos"
else
    log $RED "❌ Unsupported operating system: $OSTYPE"
    exit 1
fi

log $GREEN "✅ Detected OS: $OS ($DISTRO)"

# Check prerequisites
check_prerequisites() {
    log $CYAN "[STEP 1] Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log $RED "❌ Node.js is not installed."
        log $YELLOW "Install Node.js 16+ from: https://nodejs.org/"
        
        if [[ $OS == "linux" ]]; then
            log $YELLOW "Or install via package manager:"
            case $DISTRO in
                ubuntu|debian)
                    log $YELLOW "  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
                    log $YELLOW "  sudo apt-get install -y nodejs"
                    ;;
                centos|rhel|fedora)
                    log $YELLOW "  curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -"
                    log $YELLOW "  sudo yum install -y nodejs"
                    ;;
                arch)
                    log $YELLOW "  sudo pacman -S nodejs npm"
                    ;;
            esac
        elif [[ $OS == "macos" ]]; then
            log $YELLOW "Or install via Homebrew: brew install node"
        fi
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    log $GREEN "✅ Node.js detected: $NODE_VERSION"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log $RED "❌ npm is not installed."
        exit 1
    fi
    
    NPM_VERSION=$(npm --version)
    log $GREEN "✅ npm detected: $NPM_VERSION"
    
    # Check Git
    if ! command -v git &> /dev/null; then
        log $RED "❌ Git is not installed."
        log $YELLOW "Install Git:"
        if [[ $OS == "linux" ]]; then
            case $DISTRO in
                ubuntu|debian)
                    log $YELLOW "  sudo apt-get install git"
                    ;;
                centos|rhel|fedora)
                    log $YELLOW "  sudo yum install git"
                    ;;
                arch)
                    log $YELLOW "  sudo pacman -S git"
                    ;;
            esac
        elif [[ $OS == "macos" ]]; then
            log $YELLOW "  brew install git"
        fi
        exit 1
    fi
    
    log $GREEN "✅ Git detected"
    
    # Check curl
    if ! command -v curl &> /dev/null; then
        log $YELLOW "⚠️  curl not found. Installing..."
        if [[ $OS == "linux" ]]; then
            case $DISTRO in
                ubuntu|debian)
                    sudo apt-get update && sudo apt-get install -y curl
                    ;;
                centos|rhel|fedora)
                    sudo yum install -y curl
                    ;;
                arch)
                    sudo pacman -S curl
                    ;;
            esac
        elif [[ $OS == "macos" ]]; then
            brew install curl
        fi
    fi
    
    log $GREEN "✅ Prerequisites check completed"
}

# Generate production passwords
generate_production_passwords() {
    log $CYAN "[STEP 2] Generating secure production passwords..."
    
    # Generate all required passwords
    POSTGRES_ADMIN_PASSWORD=$(generate_password 32)
    APP_DB_PASSWORD=$(generate_password 32)
    ADMIN_PASSWORD=$(generate_password 24)
    HR_PASSWORD=$(generate_password 24)
    MANAGER_PASSWORD=$(generate_password 24)
    JWT_SECRET=$(generate_password 64)
    JWT_REFRESH_SECRET=$(generate_password 64)
    SESSION_SECRET=$(generate_password 64)
    ENCRYPTION_KEY=$(generate_password 32)
    ENCRYPTION_IV=$(generate_password 16)
    REDIS_PASSWORD=$(generate_password 32)
    NGINX_PASSWORD=$(generate_password 24)
    SSL_PASSWORD=$(generate_password 32)
    BACKUP_PASSWORD=$(generate_password 32)
    WEBHOOK_SECRET=$(generate_password 48)
    EMAIL_PASSWORD=$(generate_password 24)
    
    # Store all passwords securely
    store_password "PostgreSQL Admin" "postgres" "$POSTGRES_ADMIN_PASSWORD"
    store_password "Application Database" "hrm_prod_user" "$APP_DB_PASSWORD"
    store_password "System Administrator" "admin@skyraksys.com" "$ADMIN_PASSWORD"
    store_password "HR Manager" "hr@skyraksys.com" "$HR_PASSWORD"
    store_password "Project Manager" "manager@skyraksys.com" "$MANAGER_PASSWORD"
    store_password "Redis Cache" "default" "$REDIS_PASSWORD"
    store_password "Nginx Admin" "sysadmin" "$NGINX_PASSWORD"
    store_password "SSL Certificate" "certificate" "$SSL_PASSWORD"
    store_password "Backup Encryption" "backup" "$BACKUP_PASSWORD"
    store_password "Email Service" "noreply@skyraksys.com" "$EMAIL_PASSWORD"
    
    # Store security tokens
    echo "[Security Tokens]" >> "$PASSWORDS_FILE"
    echo "JWT_SECRET: $JWT_SECRET" >> "$PASSWORDS_FILE"
    echo "JWT_REFRESH_SECRET: $JWT_REFRESH_SECRET" >> "$PASSWORDS_FILE"
    echo "SESSION_SECRET: $SESSION_SECRET" >> "$PASSWORDS_FILE"
    echo "ENCRYPTION_KEY: $ENCRYPTION_KEY" >> "$PASSWORDS_FILE"
    echo "ENCRYPTION_IV: $ENCRYPTION_IV" >> "$PASSWORDS_FILE"
    echo "WEBHOOK_SECRET: $WEBHOOK_SECRET" >> "$PASSWORDS_FILE"
    echo "" >> "$PASSWORDS_FILE"
    
    log $GREEN "✅ All production passwords generated and stored securely"
    log $YELLOW "📁 Password file location: $PASSWORDS_FILE"
    log $YELLOW "⚠️  IMPORTANT: Save this file securely and remove from server after copying!"
    echo ""
}

# Create directory structure
create_directories() {
    log $CYAN "[STEP 3] Creating directory structure..."
create_directories() {
    log $CYAN "[STEP 2] Creating production directory structure..."
    
    mkdir -p hrm-production/{backend,frontend,database,logs,uploads,config,scripts,ssl}
    mkdir -p hrm-production/logs/{backend,frontend,nginx}
    mkdir -p hrm-production/database/{scripts,backups}
    
    cd hrm-production
    
    log $GREEN "✅ Directory structure created"
}

# Setup source code
setup_source_code() {
    log $CYAN "[STEP 3] Source code setup..."
    
    echo "Choose setup method:"
    echo "1. Clone from Git repository"
    echo "2. Copy from existing project"
    echo "3. Manual setup (I'll provide the files)"
    
    read -p "Enter your choice (1-3): " choice
    
    case $choice in
        1)
            read -p "Enter your Git repository URL: " repo_url
            
            log $YELLOW "Cloning repository..."
            if git clone "$repo_url" temp-clone; then
                # Copy files to proper structure
                if [[ -d temp-clone/backend ]]; then
                    cp -r temp-clone/backend/* backend/ 2>/dev/null || true
                fi
                if [[ -d temp-clone/frontend ]]; then
                    cp -r temp-clone/frontend/* frontend/ 2>/dev/null || true
                fi
                rm -rf temp-clone
                log $GREEN "✅ Repository cloned and organized"
            else
                log $RED "❌ Failed to clone repository"
                exit 1
            fi
            ;;
        2)
            read -p "Enter the path to your existing project: " source_path
            
            if [[ ! -d "$source_path" ]]; then
                log $RED "❌ Source path does not exist"
                exit 1
            fi
            
            log $YELLOW "Copying files..."
            if [[ -d "$source_path/backend" ]]; then
                cp -r "$source_path/backend"/* backend/ 2>/dev/null || true
            fi
            if [[ -d "$source_path/frontend" ]]; then
                cp -r "$source_path/frontend"/* frontend/ 2>/dev/null || true
            fi
            
            log $GREEN "✅ Files copied successfully"
            ;;
        3)
            log $YELLOW "⚠️  Manual setup selected. Please copy your backend and frontend files"
            log $YELLOW "   to the respective directories before continuing."
            echo ""
            log $YELLOW "Directory structure:"
            log $YELLOW "  hrm-production/"
            log $YELLOW "  ├── backend/     (Copy your backend files here)"
            log $YELLOW "  ├── frontend/    (Copy your frontend files here)"
            log $YELLOW "  └── ..."
            echo ""
            read -p "Press Enter when files are copied..."
            ;;
    esac
}

# Install dependencies
install_dependencies() {
    log $CYAN "[STEP 4] Installing dependencies..."
    
    # Backend dependencies
    log $YELLOW "Installing backend dependencies..."
    if [[ -f backend/package.json ]]; then
        cd backend
        npm install --production
        if [[ $? -ne 0 ]]; then
            log $RED "❌ Failed to install backend dependencies"
            exit 1
        fi
        cd ..
        log $GREEN "✅ Backend dependencies installed"
    else
        log $RED "❌ Backend package.json not found"
        exit 1
    fi
    
    # Frontend dependencies and build
    log $YELLOW "Installing frontend dependencies..."
    if [[ -f frontend/package.json ]]; then
        cd frontend
        npm install
        if [[ $? -ne 0 ]]; then
            log $RED "❌ Failed to install frontend dependencies"
            exit 1
        fi
        
        log $YELLOW "Building frontend for production..."
        npm run build
        if [[ $? -ne 0 ]]; then
            log $RED "❌ Failed to build frontend"
            exit 1
        fi
        cd ..
        log $GREEN "✅ Frontend built successfully"
    else
        log $RED "❌ Frontend package.json not found"
        exit 1
    fi
}

# Setup environment
setup_environment() {
    log $CYAN "[STEP 5] Setting up environment configuration with generated passwords..."
    
    # Copy template and replace with generated passwords
    if [[ -f "$PROJECT_DIR/.env.production.template" ]]; then
        cp "$PROJECT_DIR/.env.production.template" "$ENV_FILE"
        
        # Replace passwords in .env file
        sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$APP_DB_PASSWORD/" "$ENV_FILE"
        sed -i "s/POSTGRES_ADMIN_PASSWORD=.*/POSTGRES_ADMIN_PASSWORD=$POSTGRES_ADMIN_PASSWORD/" "$ENV_FILE"
        sed -i "s/ADMIN_PASSWORD=.*/ADMIN_PASSWORD=$ADMIN_PASSWORD/" "$ENV_FILE"
        sed -i "s/HR_PASSWORD=.*/HR_PASSWORD=$HR_PASSWORD/" "$ENV_FILE"
        sed -i "s/MANAGER_PASSWORD=.*/MANAGER_PASSWORD=$MANAGER_PASSWORD/" "$ENV_FILE"
        sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" "$ENV_FILE"
        sed -i "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET/" "$ENV_FILE"
        sed -i "s/SESSION_SECRET=.*/SESSION_SECRET=$SESSION_SECRET/" "$ENV_FILE"
        sed -i "s/ENCRYPTION_KEY=.*/ENCRYPTION_KEY=$ENCRYPTION_KEY/" "$ENV_FILE"
        sed -i "s/ENCRYPTION_IV=.*/ENCRYPTION_IV=$ENCRYPTION_IV/" "$ENV_FILE"
        sed -i "s/REDIS_PASSWORD=.*/REDIS_PASSWORD=$REDIS_PASSWORD/" "$ENV_FILE"
        sed -i "s/NGINX_ADMIN_PASSWORD=.*/NGINX_ADMIN_PASSWORD=$NGINX_PASSWORD/" "$ENV_FILE"
        sed -i "s/SSL_PRIVATE_KEY_PASSWORD=.*/SSL_PRIVATE_KEY_PASSWORD=$SSL_PASSWORD/" "$ENV_FILE"
        sed -i "s/BACKUP_ENCRYPTION_PASSWORD=.*/BACKUP_ENCRYPTION_PASSWORD=$BACKUP_PASSWORD/" "$ENV_FILE"
        sed -i "s/WEBHOOK_SECRET=.*/WEBHOOK_SECRET=$WEBHOOK_SECRET/" "$ENV_FILE"
        sed -i "s/SMTP_PASSWORD=.*/SMTP_PASSWORD=$EMAIL_PASSWORD/" "$ENV_FILE"
        
        # Set secure permissions
        chmod 600 "$ENV_FILE"
        
        log $GREEN "✅ Environment configuration created with secure passwords"
        log $YELLOW "📁 Configuration file: $ENV_FILE"
    else
        log $RED "❌ Environment template not found. Creating basic .env file..."
        # Create basic .env file
        cat > "$ENV_FILE" << EOF
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skyraksys_hrm_prod
DB_USER=hrm_prod_user
DB_PASSWORD=$APP_DB_PASSWORD
POSTGRES_ADMIN_PASSWORD=$POSTGRES_ADMIN_PASSWORD
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
SESSION_SECRET=$SESSION_SECRET
ENCRYPTION_KEY=$ENCRYPTION_KEY
ENCRYPTION_IV=$ENCRYPTION_IV
ADMIN_PASSWORD=$ADMIN_PASSWORD
HR_PASSWORD=$HR_PASSWORD
MANAGER_PASSWORD=$MANAGER_PASSWORD
REDIS_PASSWORD=$REDIS_PASSWORD
EOF
        chmod 600 "$ENV_FILE"
        log $GREEN "✅ Basic environment configuration created"
    fi
}

# Setup database
setup_database() {
    log $CYAN "[STEP 6] Database setup..."
    echo "Choose database setup method:"
    echo "1. PostgreSQL (Recommended for production)"
    echo "2. Use existing database"
    echo "3. Skip database setup (manual configuration)"
    
    read -p "Enter your choice (1-3): " db_choice
    
    case $db_choice in
        1)
            if ./scripts/setup-postgresql.sh; then
                log $GREEN "✅ PostgreSQL setup completed"
                
                # Create database schema
                log $YELLOW "Creating database schema and tables..."
                if ./scripts/create-database-schema.sh; then
                    log $GREEN "✅ Database schema created successfully"
                    
                    # Seed initial data
                    log $YELLOW "Seeding initial data..."
                    if ./scripts/seed-initial-data.sh; then
                        log $GREEN "✅ Initial data seeded successfully"
                        
                        # Ask if user wants test data
                        echo ""
                        read -p "Do you want to create comprehensive test data? (y/N): " create_test_data
                        if [[ "$create_test_data" =~ ^[Yy]$ ]]; then
                            log $YELLOW "Creating test data..."
                            if ./scripts/create-test-data.sh; then
                                log $GREEN "✅ Test data created successfully"
                            else
                                log $YELLOW "⚠️  Test data creation failed (optional)"
                            fi
                        fi
                    else
                        log $RED "❌ Initial data seeding failed"
                        exit 1
                    fi
                else
                    log $RED "❌ Database schema creation failed"
                    exit 1
                fi
            else
                log $RED "❌ PostgreSQL setup failed"
                exit 1
            fi
            ;;
        2)
            log $YELLOW "Please ensure your database is configured and accessible."
            log $YELLOW "Update the .env file with your database credentials."
            log $YELLOW "You may need to run schema and data scripts manually:"
            log $YELLOW "  ./scripts/create-database-schema.sh"
            log $YELLOW "  ./scripts/seed-initial-data.sh"
            log $YELLOW "  ./scripts/create-test-data.sh (optional)"
            ;;
        3)
            log $YELLOW "Database setup skipped. Please configure manually."
            log $YELLOW "Available database scripts:"
            log $YELLOW "  ./scripts/setup-postgresql.sh      - PostgreSQL installation and setup"
            log $YELLOW "  ./scripts/create-database-schema.sh - Create database schema and tables"
            log $YELLOW "  ./scripts/seed-initial-data.sh     - Seed initial system data"
            log $YELLOW "  ./scripts/create-test-data.sh      - Create comprehensive test data"
            ;;
    esac
}

# Setup SSL
setup_ssl() {
    log $CYAN "[STEP 7] SSL Setup..."
    echo "Do you want to set up SSL certificates?"
    echo "1. Generate self-signed certificates (for testing)"
    echo "2. Use existing certificates"
    echo "3. Skip SSL setup"
    
    read -p "Enter your choice (1-3): " ssl_choice
    
    case $ssl_choice in
        1)
            ./scripts/generate-ssl.sh
            ;;
        2)
            log $YELLOW "Please copy your SSL certificates to the ssl/ directory:"
            log $YELLOW "  ssl/cert.pem (Certificate file)"
            log $YELLOW "  ssl/key.pem  (Private key file)"
            ;;
        3)
            log $YELLOW "SSL setup skipped."
            ;;
    esac
}

# Setup process manager
setup_process_manager() {
    log $CYAN "[STEP 8] Setting up process manager..."
    
    if ! command -v pm2 &> /dev/null; then
        log $YELLOW "Installing PM2..."
        npm install -g pm2
        if [[ $? -ne 0 ]]; then
            log $YELLOW "⚠️  Failed to install PM2 globally. You may need sudo privileges."
            log $YELLOW "You can install it later with: sudo npm install -g pm2"
        else
            log $GREEN "✅ PM2 installed successfully"
        fi
    else
        log $GREEN "✅ PM2 already installed"
    fi
}

# Create startup scripts
create_startup_scripts() {
    log $CYAN "[STEP 9] Creating startup scripts..."
    ./scripts/create-startup-scripts.sh
}

# Final setup
final_setup() {
    log $CYAN "[STEP 10] Final configuration..."
    
    # Set proper permissions
    log $YELLOW "Setting file permissions..."
    chmod +x scripts/*.sh
    chmod +x *.sh
    
    # Create log directories
    mkdir -p logs/{backend,frontend,nginx}
    
    # Set ownership (if not root)
    if [[ $EUID -ne 0 ]]; then
        chown -R $USER:$USER .
    fi
    
    log $GREEN "✅ File permissions set"
}

# Main execution
main() {
    check_prerequisites
    generate_production_passwords
    create_directories
    setup_source_code
    install_dependencies
    setup_environment
    setup_database
    setup_ssl
    setup_process_manager
    create_startup_scripts
    final_setup
    
    echo ""
    log $CYAN "========================================"
    log $GREEN "✅ Production Setup Complete!"
    log $CYAN "========================================"
    echo ""
    
    log $GREEN "🔐 IMPORTANT: Production passwords have been generated!"
    log $YELLOW "📁 All passwords saved to: $PASSWORDS_FILE"
    log $RED "⚠️  CRITICAL SECURITY STEPS:"
    log $RED "   1. Copy the password file to a secure location"
    log $RED "   2. Remove the password file from this server: rm $PASSWORDS_FILE"
    log $RED "   3. Never commit passwords to version control"
    log $RED "   4. Use a password manager for production"
    echo ""
    
    log $YELLOW "Default Login Credentials (CHANGE IMMEDIATELY):"
    log $YELLOW "  System Admin: admin@skyraksys.com / (see password file)"
    log $YELLOW "  HR Manager: hr@skyraksys.com / (see password file)"
    log $YELLOW "  Project Manager: manager@skyraksys.com / (see password file)"
    echo ""
    
    log $YELLOW "Next steps:"
    log $YELLOW "1. Secure your password file: $PASSWORDS_FILE"
    log $YELLOW "2. Review configuration in .env"
    log $YELLOW "3. Start the application: ./start.sh"
    log $YELLOW "4. Test login with generated credentials"
    log $YELLOW "5. Change all passwords immediately after first login"
    echo ""
    
    log $YELLOW "Quick start commands:"
    log $YELLOW "  ./start.sh          - Start all services"
    log $YELLOW "  ./stop.sh           - Stop all services"
    log $YELLOW "  ./restart.sh        - Restart all services"
    log $YELLOW "  ./status.sh         - Check status"
    log $YELLOW "  ./logs.sh           - View application logs"
    echo ""
    
    log $YELLOW "Documentation available in docs/"
    echo ""
}

# Check if running the script directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
