#!/bin/bash

# SkyrakSys HRM - Complete Red Hat Linux Installation Script
# Author: Production Deployment Team
# Version: 2.0.0
# Compatible: RHEL 8/9, CentOS 8+

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="skyraksys_hrm"
APP_USER="hrm"
APP_DIR="/opt/${APP_NAME}"
LOG_DIR="/var/log/${APP_NAME}"
CONFIG_DIR="/etc/${APP_NAME}"
REPO_URL="https://github.com/Otyvino/skyrakskys_hrm.git"
DB_NAME="skyraksys_hrm"
DB_USER="hrm_admin"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}
╔══════════════════════════════════════════════════════════════╗
║                 SkyrakSys HRM Installation                   ║
║              Red Hat Enterprise Linux Deployment            ║
╚══════════════════════════════════════════════════════════════╝
${NC}"
}

# Function to check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Function to detect OS
detect_os() {
    if [[ -f /etc/redhat-release ]]; then
        OS_VERSION=$(cat /etc/redhat-release)
        print_status "Detected OS: $OS_VERSION"
    else
        print_error "This script is designed for Red Hat Enterprise Linux"
        exit 1
    fi
}

# Function to collect user input
collect_input() {
    print_status "Collecting deployment configuration..."
    
    echo -n "Enter domain name for SSL (e.g., hrm.yourcompany.com): "
    read DOMAIN_NAME
    
    echo -n "Enter database password for PostgreSQL: "
    read -s DB_PASSWORD
    echo
    
    echo -n "Enter JWT secret (leave empty for auto-generation): "
    read JWT_SECRET
    if [[ -z "$JWT_SECRET" ]]; then
        JWT_SECRET=$(openssl rand -base64 32)
        print_status "Generated JWT secret"
    fi
    
    echo -n "Enter admin email for SSL certificate: "
    read ADMIN_EMAIL
    
    print_status "Configuration collected successfully"
}

# Function to update system
update_system() {
    print_status "Updating system packages..."
    dnf update -y
    dnf install -y epel-release
    dnf groupinstall -y "Development Tools"
    dnf install -y wget curl git unzip nano vim htop
    print_status "System updated successfully"
}

# Function to configure firewall
configure_firewall() {
    print_status "Configuring firewall..."
    systemctl start firewalld
    systemctl enable firewalld
    
    firewall-cmd --permanent --add-port=80/tcp
    firewall-cmd --permanent --add-port=443/tcp
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
    
    print_status "Firewall configured successfully"
}

# Function to install Node.js
install_nodejs() {
    print_status "Installing Node.js 18.x LTS..."
    curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
    dnf install -y nodejs
    
    # Verify installation
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    print_status "Node.js $NODE_VERSION and npm $NPM_VERSION installed"
    
    # Install global packages
    npm install -g pm2 serve
    print_status "PM2 and serve installed globally"
}

# Function to install PostgreSQL
install_postgresql() {
    print_status "Installing PostgreSQL 15..."
    
    # Install PostgreSQL repository
    dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-8-x86_64/pgdg-redhat-repo-latest.noarch.rpm
    
    # Install PostgreSQL
    dnf install -y postgresql15-server postgresql15
    
    # Initialize database
    /usr/pgsql-15/bin/postgresql-15-setup initdb
    
    # Start and enable service
    systemctl start postgresql-15
    systemctl enable postgresql-15
    
    # Configure PostgreSQL
    sudo -u postgres psql -c "ALTER USER postgres PASSWORD '$DB_PASSWORD';"
    
    print_status "PostgreSQL 15 installed and configured"
}

# Function to configure PostgreSQL
configure_postgresql() {
    print_status "Configuring PostgreSQL..."
    
    # Backup original files
    cp /var/lib/pgsql/15/data/postgresql.conf /var/lib/pgsql/15/data/postgresql.conf.backup
    cp /var/lib/pgsql/15/data/pg_hba.conf /var/lib/pgsql/15/data/pg_hba.conf.backup
    
    # Configure postgresql.conf
    sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" /var/lib/pgsql/15/data/postgresql.conf
    sed -i "s/#port = 5432/port = 5432/" /var/lib/pgsql/15/data/postgresql.conf
    sed -i "s/#max_connections = 100/max_connections = 100/" /var/lib/pgsql/15/data/postgresql.conf
    
    # Configure authentication
    sed -i "s/local   all             all                                     peer/local   all             all                                     md5/" /var/lib/pgsql/15/data/pg_hba.conf
    sed -i "s/host    all             all             127.0.0.1\/32            ident/host    all             all             127.0.0.1\/32            md5/" /var/lib/pgsql/15/data/pg_hba.conf
    
    # Restart PostgreSQL
    systemctl restart postgresql-15
    
    print_status "PostgreSQL configured successfully"
}

# Function to install Nginx
install_nginx() {
    print_status "Installing Nginx..."
    dnf install -y nginx
    
    # Start and enable Nginx
    systemctl start nginx
    systemctl enable nginx
    
    # Backup default config
    cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
    
    print_status "Nginx installed successfully"
}

# Function to create application user
create_app_user() {
    print_status "Creating application user '$APP_USER'..."
    
    # Create user if doesn't exist
    if ! id "$APP_USER" &>/dev/null; then
        useradd -m -s /bin/bash "$APP_USER"
        usermod -aG wheel "$APP_USER"
    fi
    
    # Create directories
    mkdir -p "$APP_DIR"
    mkdir -p "$LOG_DIR"
    mkdir -p "$CONFIG_DIR"
    
    # Set permissions
    chown -R "$APP_USER:$APP_USER" "$APP_DIR"
    chown -R "$APP_USER:$APP_USER" "$LOG_DIR"
    chown -R "$APP_USER:$APP_USER" "$CONFIG_DIR"
    
    print_status "Application user created successfully"
}

# Function to deploy application
deploy_application() {
    print_status "Deploying SkyrakSys HRM application..."
    
    # Clone repository
    sudo -u "$APP_USER" git clone "$REPO_URL" "$APP_DIR"
    
    # Install backend dependencies
    cd "$APP_DIR/backend"
    sudo -u "$APP_USER" npm ci --production
    
    # Install frontend dependencies and build
    cd "$APP_DIR/frontend"
    sudo -u "$APP_USER" npm ci
    sudo -u "$APP_USER" npm run build
    
    # Create additional directories
    sudo -u "$APP_USER" mkdir -p "$APP_DIR/logs"
    sudo -u "$APP_USER" mkdir -p "$APP_DIR/uploads"
    
    print_status "Application deployed successfully"
}

# Function to setup database
setup_database() {
    print_status "Setting up application database..."
    
    # Create database and user
    sudo -u postgres psql << EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER USER $DB_USER CREATEDB;
\q
EOF
    
    # Create environment file
    cat > "$CONFIG_DIR/.env.production" << EOF
NODE_ENV=production
PORT=8080

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_DIALECT=postgres
DB_SSL=false

# JWT Configuration
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Application URLs
FRONTEND_URL=https://$DOMAIN_NAME
CORS_ORIGIN=https://$DOMAIN_NAME

# Upload Configuration
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5000000

# Session Configuration
SESSION_SECRET=$(openssl rand -base64 32)

# API Configuration
API_VERSION=v1
API_BASE_URL=/api/v1
EOF
    
    chown "$APP_USER:$APP_USER" "$CONFIG_DIR/.env.production"
    chmod 600 "$CONFIG_DIR/.env.production"
    
    # Link environment file
    sudo -u "$APP_USER" ln -sf "$CONFIG_DIR/.env.production" "$APP_DIR/backend/.env"
    
    # Run migrations
    cd "$APP_DIR/backend"
    sudo -u "$APP_USER" npm run migrate
    sudo -u "$APP_USER" npm run seed
    
    print_status "Database setup completed"
}

# Function to configure PM2
configure_pm2() {
    print_status "Configuring PM2 process manager..."
    
    # Start application with PM2
    cd "$APP_DIR"
    sudo -u "$APP_USER" pm2 start ecosystem.config.js --env production
    
    # Save PM2 configuration
    sudo -u "$APP_USER" pm2 save
    
    # Setup PM2 startup
    STARTUP_SCRIPT=$(sudo -u "$APP_USER" pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER" | tail -n 1)
    eval "$STARTUP_SCRIPT"
    
    print_status "PM2 configured successfully"
}

# Function to configure Nginx
configure_nginx() {
    print_status "Configuring Nginx reverse proxy..."
    
    # Copy nginx configuration
    cp "$APP_DIR/redhat/nginx/skyraksys_hrm.conf" "/etc/nginx/conf.d/"
    
    # Update domain name in config
    sed -i "s/yourdomain.com/$DOMAIN_NAME/g" "/etc/nginx/conf.d/skyraksys_hrm.conf"
    
    # Test configuration
    nginx -t
    
    # Restart nginx
    systemctl restart nginx
    
    print_status "Nginx configured successfully"
}

# Function to setup SSL
setup_ssl() {
    print_status "Setting up SSL certificate with Let's Encrypt..."
    
    # Install certbot
    dnf install -y certbot python3-certbot-nginx
    
    # Obtain certificate
    certbot --nginx -d "$DOMAIN_NAME" --email "$ADMIN_EMAIL" --agree-tos --non-interactive
    
    # Setup auto-renewal
    systemctl enable certbot-renew.timer
    systemctl start certbot-renew.timer
    
    print_status "SSL certificate configured successfully"
}

# Function to create systemd services
create_systemd_services() {
    print_status "Creating SystemD services..."
    
    # Copy service files
    cp "$APP_DIR/redhat/systemd/"*.service "/etc/systemd/system/"
    
    # Update service files with correct paths and user
    sed -i "s/USER_PLACEHOLDER/$APP_USER/g" "/etc/systemd/system/skyraksys-hrm.service"
    sed -i "s|APP_DIR_PLACEHOLDER|$APP_DIR|g" "/etc/systemd/system/skyraksys-hrm.service"
    
    # Reload systemd
    systemctl daemon-reload
    
    # Enable services
    systemctl enable skyraksys-hrm
    systemctl start skyraksys-hrm
    
    print_status "SystemD services created and started"
}

# Function to configure SELinux
configure_selinux() {
    if [[ $(getenforce) != "Disabled" ]]; then
        print_status "Configuring SELinux..."
        
        setsebool -P httpd_can_network_connect 1
        setsebool -P httpd_can_network_relay 1
        
        # Set SELinux contexts
        semanage fcontext -a -t httpd_exec_t "$APP_DIR/backend/server.js" || true
        restorecon -R "$APP_DIR" || true
        
        print_status "SELinux configured successfully"
    fi
}

# Function to verify installation
verify_installation() {
    print_status "Verifying installation..."
    
    # Check services
    echo "Service Status:"
    systemctl status postgresql-15 --no-pager -l
    systemctl status nginx --no-pager -l
    systemctl status skyraksys-hrm --no-pager -l
    
    # Check PM2 processes
    echo -e "\nPM2 Status:"
    sudo -u "$APP_USER" pm2 status
    
    # Test application
    echo -e "\nTesting application..."
    sleep 5
    curl -k -s https://localhost/api/health | head -20 || echo "Application not yet responding"
    
    print_status "Installation verification completed"
}

# Function to display completion message
display_completion() {
    print_header
    echo -e "${GREEN}
╔══════════════════════════════════════════════════════════════╗
║                 INSTALLATION COMPLETED!                     ║
╚══════════════════════════════════════════════════════════════╝
${NC}"
    
    echo -e "${BLUE}📋 Installation Summary:${NC}"
    echo "• Application URL: https://$DOMAIN_NAME"
    echo "• Admin Panel: https://$DOMAIN_NAME/admin"
    echo "• API Endpoint: https://$DOMAIN_NAME/api"
    echo "• Application Directory: $APP_DIR"
    echo "• Logs Directory: $LOG_DIR"
    echo "• Configuration: $CONFIG_DIR"
    
    echo -e "\n${BLUE}👥 Default Login Credentials:${NC}"
    echo "• Admin: admin@company.com"
    echo "• HR: hr@company.com"
    echo "• Employee: employee@company.com"
    echo "• (Passwords will be displayed after first backend start)"
    
    echo -e "\n${BLUE}🔧 Management Commands:${NC}"
    echo "• Check status: sudo systemctl status skyraksys-hrm"
    echo "• View logs: sudo journalctl -u skyraksys-hrm -f"
    echo "• PM2 status: sudo -u $APP_USER pm2 status"
    echo "• Restart app: sudo systemctl restart skyraksys-hrm"
    
    echo -e "\n${YELLOW}⚠️  Next Steps:${NC}"
    echo "1. Update DNS to point $DOMAIN_NAME to this server"
    echo "2. Test the application in a browser"
    echo "3. Configure backup procedures"
    echo "4. Set up monitoring"
    echo "5. Review security settings"
    
    echo -e "\n${GREEN}Installation completed successfully!${NC}"
}

# Main installation function
main() {
    print_header
    
    # Pre-installation checks
    check_root
    detect_os
    
    # Collect user input
    collect_input
    
    # Installation steps
    print_status "Starting installation process..."
    
    update_system
    configure_firewall
    install_nodejs
    install_postgresql
    configure_postgresql
    install_nginx
    create_app_user
    deploy_application
    setup_database
    configure_pm2
    configure_nginx
    configure_selinux
    create_systemd_services
    
    # SSL setup (optional)
    if [[ "$DOMAIN_NAME" != "localhost" && "$DOMAIN_NAME" != "127.0.0.1" ]]; then
        setup_ssl
    else
        print_warning "Skipping SSL setup for localhost/IP address"
    fi
    
    # Verification
    verify_installation
    
    # Display completion message
    display_completion
}

# Error handling
trap 'print_error "Installation failed! Check the logs above for details."; exit 1' ERR

# Run main installation
main "$@"
