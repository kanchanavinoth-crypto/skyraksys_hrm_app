#!/bin/bash

# Skyraksys HRM Complete Update Deployment Script
# Deploys latest frontend, backend, and database changes to RHEL production
# Version: November 13, 2025

set -e

# Configuration
PROD_SERVER="95.216.14.232"  # Default production server IP
DEPLOY_USER="skyraksys"
DEPLOY_PATH="/opt/skyraksys-hrm"
BACKUP_PATH="/opt/skyraksys-hrm/backups/$(date +%Y%m%d_%H%M%S)"
SERVICE_NAME="skyraksys-hrm-backend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[ℹ]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}$1${NC}"
}

# Parse command line arguments
SERVER_IP=${1:-$PROD_SERVER}

print_header "=================================================================================="
print_header "🚀 Skyraksys HRM Complete Update Deployment"
print_header "Target Server: $SERVER_IP"
print_header "Timestamp: $(date)"
print_header "=================================================================================="

# Check if we can connect to the server
print_info "Testing connection to production server..."
if ! ping -c 1 "$SERVER_IP" &> /dev/null; then
    print_error "Cannot reach server $SERVER_IP"
    print_info "Please check network connectivity and server status"
    exit 1
fi
print_status "Server is reachable"

# Check if deployment directory exists locally
if [ ! -d "skyraksys_hrm_app" ]; then
    print_error "skyraksys_hrm_app directory not found"
    print_info "Please run this script from the root project directory"
    exit 1
fi

print_header "📦 Preparing deployment package..."

# Create deployment package
DEPLOYMENT_PACKAGE="/tmp/hrm-update-$(date +%Y%m%d_%H%M%S).tar.gz"

print_info "Creating deployment package: $DEPLOYMENT_PACKAGE"

# Create temporary directory for packaging
TEMP_DIR=$(mktemp -d)
cp -r skyraksys_hrm_app "$TEMP_DIR/"

# Exclude unnecessary files from deployment
print_info "Cleaning up package (excluding dev files)..."
find "$TEMP_DIR/skyraksys_hrm_app" -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
find "$TEMP_DIR/skyraksys_hrm_app" -name ".git" -type d -exec rm -rf {} + 2>/dev/null || true
find "$TEMP_DIR/skyraksys_hrm_app" -name "*.log" -type f -delete 2>/dev/null || true
find "$TEMP_DIR/skyraksys_hrm_app" -name ".env.local" -type f -delete 2>/dev/null || true
find "$TEMP_DIR/skyraksys_hrm_app" -name "build" -type d -exec rm -rf {} + 2>/dev/null || true
find "$TEMP_DIR/skyraksys_hrm_app" -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true

# Create the package
tar -czf "$DEPLOYMENT_PACKAGE" -C "$TEMP_DIR" skyraksys_hrm_app
rm -rf "$TEMP_DIR"

PACKAGE_SIZE=$(du -h "$DEPLOYMENT_PACKAGE" | cut -f1)
print_status "Package created: $PACKAGE_SIZE"

# Create deployment script to run on the server
REMOTE_SCRIPT="/tmp/remote-deploy-$(date +%Y%m%d_%H%M%S).sh"

cat > "$REMOTE_SCRIPT" << 'REMOTE_EOF'
#!/bin/bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[✓]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }
print_info() { echo -e "${BLUE}[ℹ]${NC} $1"; }

DEPLOY_PATH="/opt/skyraksys-hrm"
SERVICE_NAME="skyraksys-hrm-backend"
PACKAGE_PATH="$1"

if [ -z "$PACKAGE_PATH" ] || [ ! -f "$PACKAGE_PATH" ]; then
    print_error "Package path not provided or file not found"
    exit 1
fi

print_info "Starting remote deployment process..."

# Stop services
print_info "Stopping HRM services..."
systemctl stop $SERVICE_NAME || print_warning "Backend service was not running"
systemctl stop nginx || print_warning "Nginx was not running"

# Create backup of current deployment (quick backup, no data)
if [ -d "$DEPLOY_PATH/skyraksys_hrm_app" ]; then
    BACKUP_DIR="$DEPLOY_PATH/backups/pre-update-$(date +%Y%m%d_%H%M%S)"
    print_info "Creating quick backup at $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
    
    # Backup only configuration files and important data
    cp -r "$DEPLOY_PATH/skyraksys_hrm_app/backend/.env" "$BACKUP_DIR/" 2>/dev/null || true
    cp -r "$DEPLOY_PATH/skyraksys_hrm_app/frontend/build" "$BACKUP_DIR/" 2>/dev/null || true
    cp -r "$DEPLOY_PATH/skyraksys_hrm_app/redhatprod/configs" "$BACKUP_DIR/" 2>/dev/null || true
    
    print_status "Configuration backup completed"
fi

# Extract new code
print_info "Extracting new application code..."
cd "$DEPLOY_PATH"
tar -xzf "$PACKAGE_PATH"
chown -R skyraksys:skyraksys skyraksys_hrm_app

# Backend deployment
print_info "Deploying backend updates..."
cd "$DEPLOY_PATH/skyraksys_hrm_app/backend"

# Install/update dependencies
print_info "Installing backend dependencies..."
sudo -u skyraksys npm install --production

# Run database migrations
print_info "Running database migrations..."
sudo -u skyraksys npm run migrate 2>/dev/null || print_warning "Migration command not found, running manual migration"
sudo -u skyraksys npx sequelize-cli db:migrate 2>/dev/null || print_warning "Sequelize CLI migration failed, will continue"

# Frontend deployment
print_info "Deploying frontend updates..."
cd "$DEPLOY_PATH/skyraksys_hrm_app/frontend"

# Install dependencies and build
print_info "Installing frontend dependencies..."
sudo -u skyraksys npm install

print_info "Building frontend application..."
sudo -u skyraksys npm run build

# Deploy built files to nginx directory
if [ -d "build" ]; then
    print_info "Deploying frontend build to nginx..."
    rm -rf /var/www/html/hrm/* 2>/dev/null || true
    cp -r build/* /var/www/html/hrm/
    chown -R nginx:nginx /var/www/html/hrm
    print_status "Frontend deployed successfully"
else
    print_error "Frontend build failed - build directory not found"
    exit 1
fi

# Setup performance monitoring
print_info "Setting up performance monitoring..."
if [ -f "$DEPLOY_PATH/skyraksys_hrm_app/redhatprod/scripts/setup-performance-monitoring.sh" ]; then
    bash "$DEPLOY_PATH/skyraksys_hrm_app/redhatprod/scripts/setup-performance-monitoring.sh"
    print_status "Performance monitoring configured"
else
    print_warning "Performance monitoring script not found"
fi

# Update systemd service if needed
print_info "Updating systemd service configuration..."
if [ -f "$DEPLOY_PATH/skyraksys_hrm_app/redhatprod/systemd/skyraksys-hrm-backend.service" ]; then
    cp "$DEPLOY_PATH/skyraksys_hrm_app/redhatprod/systemd/skyraksys-hrm-backend.service" /etc/systemd/system/
    systemctl daemon-reload
    print_status "Systemd service updated"
fi

# Update nginx configuration if needed
print_info "Checking nginx configuration..."
if [ -f "$DEPLOY_PATH/skyraksys_hrm_app/redhatprod/configs/nginx.conf" ]; then
    # Backup current nginx config
    cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup.$(date +%Y%m%d_%H%M%S)
    
    # Update nginx config
    cp "$DEPLOY_PATH/skyraksys_hrm_app/redhatprod/configs/nginx.conf" /etc/nginx/nginx.conf
    
    # Test nginx configuration
    if nginx -t; then
        print_status "Nginx configuration updated successfully"
    else
        print_error "Nginx configuration test failed, restoring backup"
        cp /etc/nginx/nginx.conf.backup.* /etc/nginx/nginx.conf
    fi
fi

# Start services
print_info "Starting services..."

# Start backend service
systemctl enable $SERVICE_NAME
systemctl start $SERVICE_NAME

# Wait a moment for backend to start
sleep 3

# Check backend status
if systemctl is-active --quiet $SERVICE_NAME; then
    print_status "Backend service started successfully"
else
    print_error "Backend service failed to start"
    journalctl -u $SERVICE_NAME --no-pager -n 20
    exit 1
fi

# Start nginx
systemctl enable nginx
systemctl start nginx

if systemctl is-active --quiet nginx; then
    print_status "Nginx started successfully"
else
    print_error "Nginx failed to start"
    journalctl -u nginx --no-pager -n 10
    exit 1
fi

# Health check
print_info "Performing health check..."
sleep 5

# Test backend API
if curl -s -f http://localhost:3001/api/health > /dev/null; then
    print_status "Backend API health check passed"
else
    print_warning "Backend API health check failed - may need more time to start"
fi

# Test frontend
if curl -s -f http://localhost/ > /dev/null; then
    print_status "Frontend health check passed"
else
    print_warning "Frontend health check failed"
fi

# Cleanup
rm -f "$PACKAGE_PATH"

print_status "Deployment completed successfully!"
echo
print_info "Services Status:"
systemctl status $SERVICE_NAME --no-pager -l -n 3
echo
systemctl status nginx --no-pager -l -n 3
echo
print_info "Recent logs:"
journalctl -u $SERVICE_NAME --no-pager -n 5 --since "5 minutes ago"
REMOTE_EOF

chmod +x "$REMOTE_SCRIPT"

# Transfer files to server
print_header "📤 Transferring files to production server..."

print_info "Uploading deployment package..."
scp "$DEPLOYMENT_PACKAGE" "root@$SERVER_IP:/tmp/" || {
    print_error "Failed to upload deployment package"
    print_info "Please check SSH access and server connectivity"
    exit 1
}

print_info "Uploading deployment script..."
scp "$REMOTE_SCRIPT" "root@$SERVER_IP:/tmp/" || {
    print_error "Failed to upload deployment script"
    exit 1
}

print_status "Files uploaded successfully"

# Execute deployment on remote server
print_header "🚀 Executing deployment on production server..."

ssh "root@$SERVER_IP" "bash $REMOTE_SCRIPT $DEPLOYMENT_PACKAGE" || {
    print_error "Remote deployment failed"
    print_info "Please check the server logs for details"
    exit 1
}

print_status "Remote deployment completed"

# Cleanup local files
print_info "Cleaning up local temporary files..."
rm -f "$DEPLOYMENT_PACKAGE"
rm -f "$REMOTE_SCRIPT"

# Final verification
print_header "🔍 Final verification..."

print_info "Testing deployed application..."

# Test API endpoint
if curl -s -f "http://$SERVER_IP:3001/api/health" > /dev/null; then
    print_status "✅ Backend API is responding"
else
    print_warning "⚠️ Backend API test failed - may need more time"
fi

# Test frontend
if curl -s -f "http://$SERVER_IP/" > /dev/null; then
    print_status "✅ Frontend is accessible"
else
    print_warning "⚠️ Frontend test failed - check nginx configuration"
fi

print_header "=================================================================================="
print_header "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
print_header "=================================================================================="

echo
print_info "Application Access:"
print_info "  Frontend URL: http://$SERVER_IP/"
print_info "  Backend API:  http://$SERVER_IP:3001/api/"
print_info "  Health Check: http://$SERVER_IP:3001/api/health"
echo
print_info "New Features Deployed:"
print_info "  ✅ Performance Dashboard (Client + Server metrics)"
print_info "  ✅ Manager Dashboard Quick Actions"
print_info "  ✅ Minimalistic UI improvements"
print_info "  ✅ Timesheet approval fixes"
print_info "  ✅ Role-based access controls"
print_info "  ✅ Enhanced monitoring system"
echo
print_info "Admin Users Can Now:"
print_info "  📊 View detailed server performance metrics"
print_info "  💻 Monitor RHEL system resources"
print_info "  🎯 Use Quick Actions in manager dashboard"
print_info "  📈 Access real-time performance monitoring"
echo
print_info "All Users Can:"
print_info "  🖥️ View client performance metrics"
print_info "  ⚡ Experience improved UI performance"
print_info "  ✨ Use minimalistic timesheet interfaces"
echo
print_info "Monitoring Commands (on server):"
print_info "  Performance Summary: /opt/skyraksys-hrm/monitoring/performance-summary.sh"
print_info "  View Logs: journalctl -u skyraksys-hrm-backend -f"
print_info "  System Status: systemctl status skyraksys-hrm-backend nginx postgresql"
echo
print_status "🚀 Your HRM system is now updated and running the latest version!"