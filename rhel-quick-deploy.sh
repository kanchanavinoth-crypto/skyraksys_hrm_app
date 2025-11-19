#!/bin/bash

# =============================================================================
# SkyrakSys HRM - RHEL Quick Git Deployment v3.0
# =============================================================================
# Ultra-fast deployment directly from Git repository
# 
# Usage: 
#   curl -sSL https://raw.githubusercontent.com/YOUR_USERNAME/skyraksys_hrm_app/master/rhel-quick-deploy.sh | bash
# 
# Or on server:
#   wget -O - https://raw.githubusercontent.com/YOUR_USERNAME/skyraksys_hrm_app/master/rhel-quick-deploy.sh | bash
# =============================================================================

set -e

# Configuration
GITHUB_REPO="https://github.com/kanchanavinoth-crypto/skyraksys_hrm_app.git"
GITHUB_BRANCH="master"
APP_DIR="/opt/skyraksys-hrm"
APP_NAME="skyraksys_hrm_app"
SERVICE_NAME="skyraksys-hrm"

# Database Configuration - Default Production Values
DB_NAME="skyraksys_hrm_prod"
DB_USER="skyraksys_admin"
DB_PASSWORD="SkyRakDB#2025!Prod@HRM\$Secure"
DB_HOST="localhost"

# Server Configuration
DOMAIN="95.216.14.232"
SERVER_PORT="5000"
CLIENT_PORT="80"
SSL_PORT="443"

# SSL Configuration
ENABLE_SSL=true
SSL_EMAIL="admin@skyraksys.com"  # Change this to your email for Let's Encrypt
USE_SELF_SIGNED=true  # Set to false if you have a real domain for Let's Encrypt

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Logging
LOGFILE="/var/log/skyraksys-deployment.log"
exec > >(tee -a $LOGFILE)
exec 2>&1

# Utility functions
print_header() {
    echo -e "${CYAN}"
    echo "=============================================================================="
    echo "  >>> $1"
    echo "=============================================================================="
    echo -e "${NC}"
}

print_step() { echo -e "${BLUE}[$(date '+%H:%M:%S')] [STEP] $1${NC}"; }
print_success() { echo -e "${GREEN}[$(date '+%H:%M:%S')] [OK] $1${NC}"; }
print_error() { echo -e "${RED}[$(date '+%H:%M:%S')] [ERROR] $1${NC}"; }
print_warning() { echo -e "${YELLOW}[$(date '+%H:%M:%S')] [WARNING] $1${NC}"; }
print_info() { echo -e "${PURPLE}[$(date '+%H:%M:%S')] [INFO] $1${NC}"; }

# Error handling
error_exit() {
    print_error "$1"
    print_error "Deployment failed. Check logs: $LOGFILE"
    exit 1
}

# Progress tracking
TOTAL_STEPS=12
CURRENT_STEP=0

step() {
    CURRENT_STEP=$((CURRENT_STEP + 1))
    print_step "Step $CURRENT_STEP/$TOTAL_STEPS: $1"
}

# Main deployment function
main() {
    print_header "SkyrakSys HRM Quick Deployment Started"
    print_info "Repository: $GITHUB_REPO"
    print_info "Branch: $GITHUB_BRANCH"
    print_info "Timestamp: $(date)"
    print_info "Log file: $LOGFILE"
    
    # Check root privileges
    step "Checking permissions"
    if [[ $EUID -ne 0 ]]; then
        error_exit "This script must be run as root. Use: sudo bash $0"
    fi
    print_success "Running as root"
    
    # Install dependencies
    step "Installing system dependencies"
    dnf update -y >/dev/null 2>&1 || yum update -y >/dev/null 2>&1
    dnf groupinstall -y "Development Tools" >/dev/null 2>&1 || yum groupinstall -y "Development Tools" >/dev/null 2>&1
    dnf install -y git curl wget nginx postgresql-server postgresql-contrib openssl >/dev/null 2>&1 || \
    yum install -y git curl wget nginx postgresql-server postgresql-contrib openssl >/dev/null 2>&1
    
    # Install Certbot for Let's Encrypt (if using real domain)
    if [ "$USE_SELF_SIGNED" = false ]; then
        dnf install -y certbot python3-certbot-nginx >/dev/null 2>&1 || \
        yum install -y certbot python3-certbot-nginx >/dev/null 2>&1
        print_success "Certbot installed for Let's Encrypt"
    fi
    print_success "System dependencies installed"
    
    # Install Node.js
    step "Installing Node.js 18.x"
    if ! command -v node &> /dev/null; then
        curl -fsSL https://rpm.nodesource.com/setup_18.x | bash - >/dev/null 2>&1
        dnf install -y nodejs >/dev/null 2>&1 || yum install -y nodejs >/dev/null 2>&1
    fi
    print_success "Node.js $(node --version) installed"
    
    # Install PM2
    step "Installing PM2 process manager"
    if ! command -v pm2 &> /dev/null; then
        npm install -g pm2 >/dev/null 2>&1
    fi
    print_success "PM2 installed"
    
    # Setup PostgreSQL
    step "Setting up PostgreSQL database"
    if ! systemctl is-active --quiet postgresql; then
        postgresql-setup initdb >/dev/null 2>&1 || true
        systemctl enable postgresql >/dev/null 2>&1
        systemctl start postgresql >/dev/null 2>&1
    fi
    
    # Create database and user
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || true
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || true
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || true
    print_success "PostgreSQL configured"
    
    # Clone repository
    step "Cloning application from Git"
    mkdir -p $APP_DIR
    cd $APP_DIR
    
    if [ -d "$APP_NAME" ]; then
        print_info "Updating existing repository"
        cd $APP_NAME
        git stash >/dev/null 2>&1 || true
        git pull origin $GITHUB_BRANCH >/dev/null 2>&1
    else
        print_info "Cloning fresh repository"
        git clone $GITHUB_REPO $APP_NAME >/dev/null 2>&1
        cd $APP_NAME
    fi
    print_success "Repository ready"
    
    # Configure backend
    step "Configuring backend environment"
    cd backend
    
    # Create .env file with SSL support
    if [ "$ENABLE_SSL" = true ]; then
        cat > .env << EOF
NODE_ENV=production
PORT=$SERVER_PORT
DB_HOST=$DB_HOST
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
JWT_SECRET=SkyRakHRM#2025!JWT@Prod\$SecureKey#Authentication
JWT_EXPIRES_IN=24h
CORS_ORIGIN=https://$DOMAIN
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
UPLOAD_PATH=./uploads
LOG_LEVEL=info
SSL_ENABLED=true
FORCE_HTTPS=true
EOF
    else
        cat > .env << EOF
NODE_ENV=production
PORT=$SERVER_PORT
DB_HOST=$DB_HOST
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
JWT_SECRET=SkyRakHRM#2025!JWT@Prod\$SecureKey#Authentication
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://$DOMAIN
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
UPLOAD_PATH=./uploads
LOG_LEVEL=info
EOF
    fi
    
    # Install backend dependencies
    npm install --production >/dev/null 2>&1
    print_success "Backend configured"
    
    # Configure frontend
    step "Building frontend application"
    cd ../frontend
    
    # Create frontend .env with SSL support
    if [ "$ENABLE_SSL" = true ]; then
        cat > .env << EOF
REACT_APP_API_URL=https://$DOMAIN/api
REACT_APP_BACKEND_URL=https://$DOMAIN
GENERATE_SOURCEMAP=false
HTTPS=true
NODE_ENV=production
EOF
    else
        cat > .env << EOF
REACT_APP_API_URL=http://$DOMAIN:$SERVER_PORT/api
REACT_APP_BACKEND_URL=http://$DOMAIN:$SERVER_PORT
GENERATE_SOURCEMAP=false
NODE_ENV=production
EOF
    fi
    
    npm install >/dev/null 2>&1
    npm run build >/dev/null 2>&1
    if [ -d "build" ] && [ -f "build/index.html" ]; then
        print_success "Frontend built successfully"
    else
        error_exit "Frontend build failed - no build directory or index.html found"
    fi
    
    # Database migrations
    step "Running database migrations"
    cd ../backend
    
    # Test database connectivity first
    if node -e "const {Pool} = require('pg'); const pool = new Pool({user:'$DB_USER', password:'$DB_PASSWORD', host:'$DB_HOST', database:'$DB_NAME', port:5432}); pool.query('SELECT 1').then(() => {console.log('DB OK'); pool.end()}).catch(e => {console.error('DB FAIL:', e.message); process.exit(1)})" 2>/dev/null; then
        print_success "Database connectivity verified"
    else
        error_exit "Database connection failed - check credentials and service"
    fi
    
    if npm run migrate >/dev/null 2>&1; then
        print_success "Database migrations completed successfully"
    else
        print_warning "Migration failed or no migrations found - continuing with deployment"
        # Try to create basic tables if migrations fail
        npm run db:setup >/dev/null 2>&1 || true
    fi
    
    # Configure SSL certificates
    step "Setting up SSL certificates"
    if [ "$ENABLE_SSL" = true ]; then
        if [ "$USE_SELF_SIGNED" = true ]; then
            # Generate self-signed certificate for IP address
            print_info "Generating self-signed SSL certificate..."
            mkdir -p /etc/ssl/certs /etc/ssl/private
            
            # Create certificate for IP address
            openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
                -keyout /etc/ssl/private/skyraksys-hrm.key \
                -out /etc/ssl/certs/skyraksys-hrm.crt \
                -subj "/C=IN/ST=State/L=City/O=SkyrakSys/CN=$DOMAIN" \
                -addext "subjectAltName=IP:$DOMAIN" >/dev/null 2>&1
                
            print_success "Self-signed SSL certificate generated"
        else
            # Use Let's Encrypt for real domain
            print_info "Obtaining Let's Encrypt SSL certificate..."
            certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $SSL_EMAIL >/dev/null 2>&1
            print_success "Let's Encrypt SSL certificate obtained"
        fi
    fi

    # Configure Nginx
    step "Configuring Nginx web server with SSL"
    if [ "$ENABLE_SSL" = true ] && [ "$USE_SELF_SIGNED" = true ]; then
        # SSL configuration with self-signed certificate
        cat > /etc/nginx/conf.d/skyraksys-hrm.conf << EOF
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name $DOMAIN;
    
    # SSL Configuration
    ssl_certificate /etc/ssl/certs/skyraksys-hrm.crt;
    ssl_certificate_key /etc/ssl/private/skyraksys-hrm.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_session_timeout 10m;
    ssl_session_cache shared:SSL:10m;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'";
    
    # Frontend
    location / {
        root $APP_DIR/$APP_NAME/frontend/build;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:$SERVER_PORT/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Port 443;
        proxy_cache_bypass \$http_upgrade;
        
        # Increase proxy timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # File uploads
    location /uploads/ {
        root $APP_DIR/$APP_NAME/backend;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:$SERVER_PORT/api/health;
        access_log off;
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript application/x-font-ttf font/opentype image/svg+xml image/x-icon;
}
EOF
    else
        # Standard HTTP configuration (fallback)
        cat > /etc/nginx/conf.d/skyraksys-hrm.conf << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    # Frontend
    location / {
        root $APP_DIR/$APP_NAME/frontend/build;
        try_files \$uri \$uri/ /index.html;
        
        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:$SERVER_PORT/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # File uploads
    location /uploads/ {
        root $APP_DIR/$APP_NAME/backend;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
EOF
    
    systemctl enable nginx >/dev/null 2>&1
    systemctl restart nginx >/dev/null 2>&1
    print_success "Nginx configured"
    
    # Setup PM2 service
    step "Setting up PM2 application service"
    cd $APP_DIR/$APP_NAME/backend
    
    # Create PM2 ecosystem file
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '$SERVICE_NAME',
    script: 'server.js',
    cwd: '$APP_DIR/$APP_NAME/backend',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    error_file: '$APP_DIR/$APP_NAME/logs/err.log',
    out_file: '$APP_DIR/$APP_NAME/logs/out.log',
    log_file: '$APP_DIR/$APP_NAME/logs/combined.log',
    time: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
EOF
    
    # Create logs directory
    mkdir -p $APP_DIR/$APP_NAME/logs
    
    # Start application with PM2
    pm2 delete $SERVICE_NAME >/dev/null 2>&1 || true
    pm2 start ecosystem.config.js >/dev/null 2>&1
    
    # Validate PM2 service started
    sleep 3
    if pm2 show $SERVICE_NAME >/dev/null 2>&1; then
        print_success "PM2 service started successfully"
        pm2 save >/dev/null 2>&1
    else
        error_exit "Failed to start PM2 service - check ecosystem.config.js"
    fi
    
    # Setup PM2 startup
    pm2 startup >/dev/null 2>&1 || true
    print_success "Application service configured"
    
    # Configure firewall
    step "Configuring firewall"
    systemctl enable firewalld >/dev/null 2>&1 || true
    systemctl start firewalld >/dev/null 2>&1 || true
    firewall-cmd --permanent --add-service=http >/dev/null 2>&1 || true
    firewall-cmd --permanent --add-service=https >/dev/null 2>&1 || true
    firewall-cmd --permanent --add-port=$SERVER_PORT/tcp >/dev/null 2>&1 || true
    firewall-cmd --reload >/dev/null 2>&1 || true
    print_success "Firewall configured"
    
    # Final system status
    step "Verifying deployment"
    sleep 5
    
    # Check services
    if systemctl is-active --quiet nginx && pm2 list | grep -q "$SERVICE_NAME.*online"; then
        print_success "All services are running"
    else
        print_warning "Some services may not be running properly"
    fi
    
    print_header "*** Secure Deployment Complete! ***"
    
    if [ "$ENABLE_SSL" = true ]; then
        print_info "[SSL] Secure Application URL: https://$DOMAIN"
        print_info "[SSL] Secure API Health Check: https://$DOMAIN/api/health"
        print_info "[REDIRECT] HTTP Redirect: http://$DOMAIN -> https://$DOMAIN"
        print_info ""
        if [ "$USE_SELF_SIGNED" = true ]; then
            print_warning "Using self-signed SSL certificate"
            print_warning "   Browser will show 'Not Secure' warning - click 'Advanced' -> 'Proceed'"
            print_warning "   For production with real domain, set USE_SELF_SIGNED=false"
        fi
    else
        print_info "Application URL: http://$DOMAIN"
        print_info "API Health Check: http://$DOMAIN/api/health"
    fi
    
    print_info ""
    print_info "[ADMIN] Login Credentials:"
    print_info "  Email: admin@example.com"
    print_info "  Password: admin123"
    print_info ""
    print_info "Management Commands:"
    print_info "  View Logs: pm2 logs $SERVICE_NAME"
    print_info "  Restart App: pm2 restart $SERVICE_NAME"
    print_info "  Stop App: pm2 stop $SERVICE_NAME"
    print_info "  Check Status: pm2 status"
    print_info "  SSL Certificate: openssl x509 -in /etc/ssl/certs/skyraksys-hrm.crt -text -noout"
    print_info ""
    print_info "Configuration Files:"
    print_info "  Backend: $APP_DIR/$APP_NAME/backend/.env"
    print_info "  Frontend: $APP_DIR/$APP_NAME/frontend/.env"
    print_info "  Nginx SSL: /etc/nginx/conf.d/skyraksys-hrm.conf"
    print_info "  SSL Certificate: /etc/ssl/certs/skyraksys-hrm.crt"
    print_info "  SSL Private Key: /etc/ssl/private/skyraksys-hrm.key"
    print_info "  PM2: $APP_DIR/$APP_NAME/backend/ecosystem.config.js"
    print_info ""
    print_info "Logs Location: $LOGFILE"
    
    if [ "$ENABLE_SSL" = true ]; then
        print_success "[SSL] SkyrakSys HRM is now running securely with HTTPS!"
    else
        print_success "SkyrakSys HRM is now running in production!"
    fi
}

# Run main deployment
main "$@"