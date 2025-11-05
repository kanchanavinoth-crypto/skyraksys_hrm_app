#!/bin/bash

# RHEL 9.6 Production Application Deployment Script
# Skyraksys HRM System - Application Deployment
# Run as root user after database setup

set -e

echo "=========================================="
echo "RHEL 9.6 Application Deployment"
echo "Skyraksys HRM System"
echo "=========================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
    echo -e "${BLUE}=========================================="
    echo -e "$1"
    echo -e "==========================================${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script as root (sudo ./03_deploy_application.sh)"
    exit 1
fi

# Configuration
APP_USER="hrmapp"
APP_DIR="/opt/skyraksys-hrm"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
LOG_DIR="/var/log/skyraksys-hrm"

# Repo root and configs path (relative to this script)
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CONFIG_DIR="$ROOT_DIR/configs"

# Domain Configuration
print_header "DOMAIN CONFIGURATION"
echo "Configure your production domain settings:"
echo ""
echo "Options:"
echo "1. Use domain name (e.g., hr.company.com)"
echo "2. Use server IP address (e.g., 192.168.1.100)"
echo "3. Use localhost (development/testing only)"
echo ""
read -p "Enter your choice [1-3]: " domain_choice

case $domain_choice in
    1)
        read -p "Enter your domain name (e.g., hr.company.com): " SERVER_NAME
        if [[ -z "$SERVER_NAME" ]]; then
            print_warning "Empty domain provided; defaulting to 95.216.14.232"
            SERVER_NAME="95.216.14.232"
        fi
        API_BASE_URL="http://$SERVER_NAME/api"
        ;;
    2)
        SERVER_IP=$(hostname -I | awk '{print $1}')
        read -p "Enter your server IP address [$SERVER_IP]: " input_ip
        SERVER_NAME=${input_ip:-${SERVER_IP:-95.216.14.232}}
        API_BASE_URL="http://$SERVER_NAME/api"
        ;;
    3)
        SERVER_NAME="localhost"
        API_BASE_URL="http://localhost/api"
        print_warning "Using localhost - this is only suitable for development/testing!"
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

print_status "Domain configured: $SERVER_NAME"
print_status "API Base URL: $API_BASE_URL"

# Auto-provision environment file if missing
if [ ! -f "$APP_DIR/.env" ]; then
    print_warning "Environment file not found at $APP_DIR/.env — provisioning default for PROD IP 95.216.14.232"
    if [ -f "$ROOT_DIR/templates/.env.95.216.14.232.example" ]; then
        cp "$ROOT_DIR/templates/.env.95.216.14.232.example" "$APP_DIR/.env"
        chown "$APP_USER:$APP_USER" "$APP_DIR/.env"
        chmod 600 "$APP_DIR/.env"
        print_status "Provisioned /opt/skyraksys-hrm/.env from prefilled example"
    else
        print_warning "Prefilled env example missing; proceeding without auto-provision"
    fi
fi

# Check if application user exists
if ! id "$APP_USER" &>/dev/null; then
    print_error "Application user $APP_USER does not exist. Please run ./01_install_prerequisites.sh first"
    exit 1
fi

# Check if environment file exists
if [ ! -f "$APP_DIR/.env" ]; then
    print_error "Environment file not found. Please run ./02_setup_database.sh first"
    exit 1
fi

print_header "PREPARING APPLICATION DIRECTORIES"
print_status "Cleaning existing application files..."

# Stop existing services if running
systemctl stop hrm-backend 2>/dev/null || true
systemctl stop hrm-frontend 2>/dev/null || true
pm2 stop all 2>/dev/null || true

# Safety checks before removing files
if [ -z "$BACKEND_DIR" ] || [ "$BACKEND_DIR" = "/" ] || [ "$BACKEND_DIR" = "/opt" ]; then
    print_error "BACKEND_DIR is not properly set or is a protected directory. Aborting for safety."
    print_error "BACKEND_DIR value: '${BACKEND_DIR}'"
    exit 1
fi

if [ -z "$FRONTEND_DIR" ] || [ "$FRONTEND_DIR" = "/" ] || [ "$FRONTEND_DIR" = "/opt" ]; then
    print_error "FRONTEND_DIR is not properly set or is a protected directory. Aborting for safety."
    print_error "FRONTEND_DIR value: '${FRONTEND_DIR}'"
    exit 1
fi

# Remove existing application files (safe with validation above)
if [ -d "$BACKEND_DIR" ] && [ "$(ls -A "$BACKEND_DIR" 2>/dev/null)" ]; then
    print_status "Cleaning backend directory..."
    rm -rf "${BACKEND_DIR:?}"/*
fi

if [ -d "$FRONTEND_DIR" ] && [ "$(ls -A "$FRONTEND_DIR" 2>/dev/null)" ]; then
    print_status "Cleaning frontend directory..."
    rm -rf "${FRONTEND_DIR:?}"/*
fi

# Create necessary directories
mkdir -p "$BACKEND_DIR"
mkdir -p "$FRONTEND_DIR"
mkdir -p "$APP_DIR/uploads"
mkdir -p "$APP_DIR/temp"
mkdir -p "$APP_DIR/configs"

print_header "SOURCE CODE DEPLOYMENT"
print_status "This script expects your source code to be available."
print_status "Please choose deployment method:"
echo "1) Deploy from local source code directory"
echo "2) Deploy from Git repository"
echo "3) Skip code deployment (manual deployment)"
read -p "Enter your choice (1-3): " deploy_choice

case $deploy_choice in
    1)
        read -p "Enter the full path to your source code directory: " source_dir
        if [ ! -d "$source_dir" ]; then
            print_error "Source directory not found: $source_dir"
            exit 1
        fi
        
        print_status "Copying source code from: $source_dir"
        
        # Copy backend
        if [ -d "$source_dir/backend" ]; then
            cp -r "$source_dir/backend"/* "$BACKEND_DIR/"
            print_status "Backend code copied"
        else
            print_error "Backend directory not found in source"
            exit 1
        fi
        
        # Copy frontend
        if [ -d "$source_dir/frontend" ]; then
            cp -r "$source_dir/frontend"/* "$FRONTEND_DIR/"
            print_status "Frontend code copied"
        else
            print_error "Frontend directory not found in source"
            exit 1
        fi
        ;;
        
    2)
        read -p "Enter the Git repository URL: " git_url
        if [ -z "$git_url" ]; then
            print_error "Git URL cannot be empty"
            exit 1
        fi
        
        print_status "Cloning from Git repository: $git_url"
        
        # Clone to temporary directory
        TEMP_DIR="/tmp/hrm-deployment-$(date +%s)"
        git clone "$git_url" "$TEMP_DIR"
        
        # Copy backend
        if [ -d "$TEMP_DIR/backend" ]; then
            cp -r "$TEMP_DIR/backend"/* "$BACKEND_DIR/"
            print_status "Backend code deployed from Git"
        else
            print_error "Backend directory not found in repository"
            exit 1
        fi
        
        # Copy frontend
        if [ -d "$TEMP_DIR/frontend" ]; then
            cp -r "$TEMP_DIR/frontend"/* "$FRONTEND_DIR/"
            print_status "Frontend code deployed from Git"
        else
            print_error "Frontend directory not found in repository"
            exit 1
        fi
        
        # Cleanup
        rm -rf "$TEMP_DIR"
        ;;
        
    3)
        print_warning "Skipping code deployment. Please manually copy your code to:"
        print_warning "Backend: $BACKEND_DIR"
        print_warning "Frontend: $FRONTEND_DIR"
        read -p "Press Enter when you have manually copied the code..."
        ;;
        
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

# Set ownership
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

print_header "BACKEND DEPLOYMENT"
if [ ! -f "$BACKEND_DIR/package.json" ]; then
    print_error "Backend package.json not found. Please ensure backend code is properly deployed."
    exit 1
fi

print_status "Installing backend dependencies..."
cd "$BACKEND_DIR"
sudo -u "$APP_USER" npm install --production

# Copy and update environment file for backend
cp "$APP_DIR/.env" "$BACKEND_DIR/.env"

# Add domain configuration to backend .env
echo "" >> "$BACKEND_DIR/.env"
echo "# Production Domain Configuration" >> "$BACKEND_DIR/.env"
echo "API_BASE_URL=$API_BASE_URL" >> "$BACKEND_DIR/.env"
echo "DOMAIN=$SERVER_NAME" >> "$BACKEND_DIR/.env"

chown "$APP_USER:$APP_USER" "$BACKEND_DIR/.env"

print_header "FRONTEND DEPLOYMENT"
if [ ! -f "$FRONTEND_DIR/package.json" ]; then
    print_error "Frontend package.json not found. Please ensure frontend code is properly deployed."
    exit 1
fi

print_status "Installing frontend dependencies..."
cd "$FRONTEND_DIR"
sudo -u "$APP_USER" npm install

# Build frontend for production
print_status "Building frontend for production (embedding API URL)..."
sudo -u "$APP_USER" REACT_APP_API_URL="$API_BASE_URL" npm run build

# Optionally verify that API base URL is embedded
if grep -R "${API_BASE_URL}" "$FRONTEND_DIR/build" >/dev/null 2>&1; then
    print_status "Confirmed API URL embedded in build."
else
    print_warning "API URL not found in built files. Ensure http-common.js reads REACT_APP_API_URL or use /api via nginx."
fi

print_header "CREATING SYSTEMD SERVICES"

# Create backend service
cat > /etc/systemd/system/hrm-backend.service << EOF
[Unit]
Description=Skyraksys HRM Backend API
After=network.target postgresql-17.service redis.service
Wants=postgresql-17.service redis.service

[Service]
Type=simple
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$BACKEND_DIR
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=append:$LOG_DIR/backend.log
StandardError=append:$LOG_DIR/backend-error.log

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$APP_DIR $LOG_DIR

[Install]
WantedBy=multi-user.target
EOF

# Create frontend service (ESM-safe serve)
cat > /etc/systemd/system/hrm-frontend.service << EOF
[Unit]
Description=Skyraksys HRM Frontend
After=network.target hrm-backend.service
Wants=hrm-backend.service

[Service]
Type=simple
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$FRONTEND_DIR
Environment=NODE_ENV=production
Environment=PORT=3000
# Note: CRA embeds REACT_APP_* at build time; runtime env won't affect built assets
# Use serve@14 (CommonJS) to avoid ERR_REQUIRE_ESM in some Node/systemd contexts
ExecStart=/usr/bin/npx --yes serve@14 -s build -l 3000
Restart=always
RestartSec=10
StandardOutput=append:$LOG_DIR/frontend.log
StandardError=append:$LOG_DIR/frontend-error.log

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$APP_DIR $LOG_DIR

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
systemctl daemon-reload

print_header "NGINX CONFIGURATION"
print_status "Configuring Nginx (static frontend + API proxy) ..."

# Prefer static serving for novices to avoid ESM/CORS issues
if [ -f "$CONFIG_DIR/nginx-hrm-static.$SERVER_NAME.conf" ]; then
    print_status "Using prefilled static config for $SERVER_NAME"
    cp "$CONFIG_DIR/nginx-hrm-static.$SERVER_NAME.conf" /etc/nginx/conf.d/hrm.conf
elif [ -f "$CONFIG_DIR/nginx-hrm-static.conf" ]; then
    print_status "Using generic static config and setting server_name to $SERVER_NAME"
    cp "$CONFIG_DIR/nginx-hrm-static.conf" /etc/nginx/conf.d/hrm.conf
    sed -i "s/server_name YOUR_DOMAIN_HERE;/server_name $SERVER_NAME;/" /etc/nginx/conf.d/hrm.conf
else
    print_warning "Static Nginx config not found; falling back to proxy-to-frontend config"
    # Fallback: write a minimal proxy config
    cat > /etc/nginx/conf.d/hrm.conf << EOF
upstream backend { server 127.0.0.1:5000; }
upstream frontend { server 127.0.0.1:3000; }
server {
  listen 80;
  server_name $SERVER_NAME;
  location /api/ { proxy_pass http://backend; }
  location / { proxy_pass http://frontend; }
}
EOF
fi

# Test Nginx configuration
if nginx -t; then
    print_status "Nginx configuration is valid"
    systemctl restart nginx
else
    print_error "Nginx configuration is invalid"
    exit 1
fi

print_header "CREATING MANAGEMENT SCRIPTS"

# Create application start script
cat > "$APP_DIR/start_application.sh" << EOF
#!/bin/bash
# Start Skyraksys HRM Application

echo "Starting Skyraksys HRM Application..."

# Start backend
echo "Starting backend service..."
systemctl start hrm-backend
sleep 5

# Start frontend
echo "Starting frontend service..."
systemctl start hrm-frontend
sleep 5

# Check status
echo "Checking service status..."
systemctl status hrm-backend --no-pager -l
systemctl status hrm-frontend --no-pager -l

echo "Application started successfully!"
echo "Access the application at: http://localhost or http://$(hostname -I | awk '{print $1}')"
EOF

# Create application stop script
cat > "$APP_DIR/stop_application.sh" << EOF
#!/bin/bash
# Stop Skyraksys HRM Application

echo "Stopping Skyraksys HRM Application..."

# Stop services
systemctl stop hrm-frontend
systemctl stop hrm-backend

echo "Application stopped successfully!"
EOF

# Create application restart script
cat > "$APP_DIR/restart_application.sh" << EOF
#!/bin/bash
# Restart Skyraksys HRM Application

echo "Restarting Skyraksys HRM Application..."

# Restart services
systemctl restart hrm-backend
sleep 5
systemctl restart hrm-frontend
sleep 5

# Restart nginx
systemctl restart nginx

echo "Application restarted successfully!"
systemctl status hrm-backend --no-pager -l
systemctl status hrm-frontend --no-pager -l
EOF

# Create application status script
cat > "$APP_DIR/check_status.sh" << EOF
#!/bin/bash
# Check Skyraksys HRM Application Status

echo "=== Skyraksys HRM Application Status ==="
echo "Date: \$(date)"
echo ""

echo "=== Service Status ==="
echo "Backend Service:"
systemctl status hrm-backend --no-pager -l
echo ""
echo "Frontend Service:"
systemctl status hrm-frontend --no-pager -l
echo ""
echo "Nginx Service:"
systemctl status nginx --no-pager -l
echo ""
echo "PostgreSQL Service:"
systemctl status postgresql-17 --no-pager -l
echo ""

echo "=== Port Status ==="
echo "Listening ports:"
netstat -tlnp | grep -E ':(80|3000|5000|5432) '

echo ""
echo "=== Process Information ==="
ps aux | grep -E '(node|nginx|postgres)' | grep -v grep

echo ""
echo "=== Memory Usage ==="
free -h

echo ""
echo "=== Disk Usage ==="
df -h /opt/skyraksys-hrm
df -h /var/log/skyraksys-hrm

echo ""
echo "=== Recent Logs ==="
echo "Backend logs (last 10 lines):"
tail -n 10 $LOG_DIR/backend.log 2>/dev/null || echo "No backend logs found"

echo ""
echo "Frontend logs (last 10 lines):"
tail -n 10 $LOG_DIR/frontend.log 2>/dev/null || echo "No frontend logs found"
EOF

# Make scripts executable
chmod +x "$APP_DIR"/*.sh
chown "$APP_USER:$APP_USER" "$APP_DIR"/*.sh

print_header "ENABLING SERVICES"
print_status "Enabling services to start on boot..."
systemctl enable hrm-backend
systemctl enable hrm-frontend
systemctl enable nginx
systemctl enable postgresql-17

print_header "STARTING SERVICES"
print_status "Starting application services..."

# Start backend
systemctl start hrm-backend
sleep 5

# Check backend status
if systemctl is-active --quiet hrm-backend; then
    print_status "✅ Backend service: RUNNING"
else
    print_error "❌ Backend service: FAILED"
    print_error "Check logs: journalctl -u hrm-backend -f"
fi

# Start frontend
systemctl start hrm-frontend
sleep 5

# Check frontend status
if systemctl is-active --quiet hrm-frontend; then
    print_status "✅ Frontend service: RUNNING"
else
    print_error "❌ Frontend service: FAILED"
    print_error "Check logs: journalctl -u hrm-frontend -f"
fi

# Restart nginx
systemctl restart nginx

# Check nginx status
if systemctl is-active --quiet nginx; then
    print_status "✅ Nginx service: RUNNING"
else
    print_error "❌ Nginx service: FAILED"
fi

print_header "DEPLOYMENT VERIFICATION"
print_status "Testing application endpoints..."

# Wait for services to be fully ready
sleep 10

# Test backend API
if curl -s http://localhost:5000/api/health > /dev/null; then
    print_status "✅ Backend API: ACCESSIBLE"
else
    print_warning "⚠️  Backend API: NOT ACCESSIBLE (This might be normal if no health endpoint exists)"
fi

# Test frontend
if curl -s http://localhost:3000 > /dev/null; then
    print_status "✅ Frontend: ACCESSIBLE"
else
    print_warning "⚠️  Frontend: NOT ACCESSIBLE"
fi

# Test nginx proxy
if curl -s http://localhost > /dev/null; then
    print_status "✅ Nginx Proxy: ACCESSIBLE"
else
    print_warning "⚠️  Nginx Proxy: NOT ACCESSIBLE"
fi

# Final status check
print_header "DEPLOYMENT COMPLETE"
print_status "Application deployed successfully!"
print_status ""
print_status "Application URLs:"
print_status "- Main Application: http://$SERVER_NAME"
print_status "- API Documentation: http://$SERVER_NAME/api/docs"
print_status "- Backend API: $API_BASE_URL"
print_status "- Health Check: http://$SERVER_NAME/health"
print_status ""
print_status "Management Scripts:"
print_status "- Start: $APP_DIR/start_application.sh"
print_status "- Stop: $APP_DIR/stop_application.sh"
print_status "- Restart: $APP_DIR/restart_application.sh"
print_status "- Status Check: $APP_DIR/check_status.sh"
print_status "- Database Backup: $APP_DIR/backup_database.sh"
print_status "- Database Status: $APP_DIR/check_database.sh"
print_status ""
print_status "Log Files:"
print_status "- Backend: $LOG_DIR/backend.log"
print_status "- Frontend: $LOG_DIR/frontend.log"
print_status "- Nginx: /var/log/nginx/access.log"
print_status "- System: journalctl -u hrm-backend -f"
print_status ""
print_status "Default Login Credentials:"
print_status "- Username: admin"
print_status "- Password: SkyRak@Prod2025!Secure#HRM"
print_status ""
print_warning "IMPORTANT: Please change default passwords after first login!"
print_status "Domain configuration completed: $SERVER_NAME"

echo "Deployment completed at: $(date)"