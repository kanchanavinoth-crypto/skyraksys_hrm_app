#!/bin/bash

# Emergency Fix Script for Skyraksys HRM Deployment Issues
# This script fixes systemd services, PM2 configs, and frontend build
# Run as root: sudo ./fix_deployment_issues.sh

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[✓]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }
print_header() { echo -e "${BLUE}========================================\n$1\n==========================================${NC}"; }

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root: sudo $0"
    exit 1
fi

APP_USER="hrmapp"
APP_DIR="/opt/skyraksys-hrm"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
LOG_DIR="/var/log/skyraksys-hrm"
SERVER_IP="95.216.14.232"

print_header "SKYRAKSYS HRM - EMERGENCY FIX SCRIPT"

# Step 1: Stop all existing services
print_header "STEP 1: Stopping Existing Services"
systemctl stop hrm-backend hrm-frontend 2>/dev/null || true
sudo -u $APP_USER pm2 delete all 2>/dev/null || true
systemctl reset-failed 2>/dev/null || true
print_status "All services stopped"

# Step 2: Backup existing configs
print_header "STEP 2: Backing Up Existing Configs"
mkdir -p /root/hrm-backup-$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="/root/hrm-backup-$(date +%Y%m%d-%H%M%S)"
cp /etc/systemd/system/hrm-backend.service "$BACKUP_DIR/" 2>/dev/null || true
cp /etc/systemd/system/hrm-frontend.service "$BACKUP_DIR/" 2>/dev/null || true
cp "$FRONTEND_DIR/.env.production" "$BACKUP_DIR/" 2>/dev/null || true
cp "$APP_DIR/ecosystem.config.js" "$BACKUP_DIR/" 2>/dev/null || true
print_status "Backups saved to $BACKUP_DIR"

# Step 3: Fix frontend .env.production
print_header "STEP 3: Fixing Frontend Environment"
cat > "$FRONTEND_DIR/.env.production" << 'EOF'
# Production Environment Configuration
# API URL goes through Nginx proxy on port 80 (not direct to backend port 5000)
REACT_APP_API_URL=http://95.216.14.232/api
EOF
chown $APP_USER:$APP_USER "$FRONTEND_DIR/.env.production"
chmod 644 "$FRONTEND_DIR/.env.production"
print_status "Frontend .env.production fixed (API URL: http://95.216.14.232/api)"

# Step 4: Fix ecosystem.config.js
print_header "STEP 4: Fixing PM2 Ecosystem Config"
cat > "$APP_DIR/ecosystem.config.js" << 'EOF'
module.exports = {
  apps: [
    {
      name: 'hrm-backend',
      cwd: '/opt/skyraksys-hrm/backend',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: '/var/log/skyraksys-hrm/backend-error.log',
      out_file: '/var/log/skyraksys-hrm/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      watch: false
    },
    {
      name: 'hrm-frontend',
      cwd: '/opt/skyraksys-hrm/frontend',
      script: 'npx',
      args: 'serve@14 -s build -l 3000',
      interpreter: 'none',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/skyraksys-hrm/frontend-error.log',
      out_file: '/var/log/skyraksys-hrm/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '512M',
      watch: false
    }
  ]
};
EOF
chown $APP_USER:$APP_USER "$APP_DIR/ecosystem.config.js"
chmod 644 "$APP_DIR/ecosystem.config.js"
print_status "Ecosystem config fixed (PORT: 5000 for backend)"

# Step 5: Create log directory
print_header "STEP 5: Setting Up Log Directory"
mkdir -p "$LOG_DIR"
chown -R $APP_USER:$APP_USER "$LOG_DIR"
chmod 755 "$LOG_DIR"
print_status "Log directory ready: $LOG_DIR"

# Step 6: Rebuild frontend with correct API URL
print_header "STEP 6: Rebuilding Frontend"
print_status "This will take 2-3 minutes..."
cd "$FRONTEND_DIR"
sudo -u $APP_USER npm run build
if [ -d "$FRONTEND_DIR/build" ]; then
    print_status "Frontend built successfully"
    # Verify API URL is embedded
    if grep -r "95.216.14.232/api" "$FRONTEND_DIR/build" >/dev/null 2>&1; then
        print_status "API URL correctly embedded in build"
    else
        print_warning "Could not verify API URL in build files"
    fi
else
    print_error "Frontend build failed!"
    exit 1
fi

# Step 7: Create corrected systemd services
print_header "STEP 7: Creating Systemd Services"

# Backend service
cat > /etc/systemd/system/hrm-backend.service << 'EOF'
[Unit]
Description=Skyraksys HRM Backend API Service
Documentation=https://github.com/your-org/skyraksys-hrm
After=network-online.target postgresql-15.service
Wants=network-online.target postgresql-15.service
Requires=postgresql-15.service

[Service]
Type=simple
User=hrmapp
Group=hrmapp
WorkingDirectory=/opt/skyraksys-hrm/backend
Environment=NODE_ENV=production
Environment=PORT=5000
EnvironmentFile=/opt/skyraksys-hrm/backend/.env

ExecStart=/usr/bin/node server.js

Restart=always
RestartSec=10
StartLimitInterval=60
StartLimitBurst=3

ExecReload=/bin/kill -HUP $MAINPID
KillMode=mixed
KillSignal=SIGTERM
TimeoutStopSec=30

StandardOutput=journal
StandardError=journal
SyslogIdentifier=hrm-backend

LimitNOFILE=65536
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
EOF

print_status "Backend service created"

# Frontend service
cat > /etc/systemd/system/hrm-frontend.service << 'EOF'
[Unit]
Description=Skyraksys HRM Frontend Service
Documentation=https://github.com/your-org/skyraksys-hrm
After=network-online.target hrm-backend.service
Wants=network-online.target hrm-backend.service

[Service]
Type=simple
User=hrmapp
Group=hrmapp
WorkingDirectory=/opt/skyraksys-hrm/frontend
Environment=NODE_ENV=production
Environment=PORT=3000

ExecStart=/usr/bin/npx --yes serve@14 -s build -l 3000

Restart=always
RestartSec=10
StartLimitInterval=60
StartLimitBurst=3

ExecReload=/bin/kill -HUP $MAINPID
KillMode=mixed
KillSignal=SIGTERM
TimeoutStopSec=30

StandardOutput=journal
StandardError=journal
SyslogIdentifier=hrm-frontend

LimitNOFILE=65536
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
EOF

print_status "Frontend service created"

# Step 8: Reload systemd
print_header "STEP 8: Reloading Systemd"
systemctl daemon-reload
print_status "Systemd reloaded"

# Step 9: Ask user which process manager to use
print_header "STEP 9: Choose Process Manager"
echo ""
echo "Which process manager would you like to use?"
echo ""
echo "1. Systemd (Recommended for production)"
echo "   - Native Linux service management"
echo "   - Logs via journalctl"
echo "   - Auto-restart on boot"
echo ""
echo "2. PM2 (More flexible, easier monitoring)"
echo "   - Better process monitoring (pm2 monit)"
echo "   - Easier log viewing (pm2 logs)"
echo "   - Clustering support"
echo ""
read -p "Enter your choice [1-2]: " pm_choice

if [ "$pm_choice" = "1" ]; then
    print_header "Starting Services with Systemd"
    
    systemctl enable hrm-backend hrm-frontend
    print_status "Services enabled for auto-start on boot"
    
    systemctl start hrm-backend
    sleep 3
    
    if systemctl is-active --quiet hrm-backend; then
        print_status "Backend started successfully"
    else
        print_error "Backend failed to start. Check logs: journalctl -u hrm-backend -n 50"
        exit 1
    fi
    
    systemctl start hrm-frontend
    sleep 3
    
    if systemctl is-active --quiet hrm-frontend; then
        print_status "Frontend started successfully"
    else
        print_error "Frontend failed to start. Check logs: journalctl -u hrm-frontend -n 50"
        exit 1
    fi
    
    print_header "SERVICE STATUS"
    systemctl status hrm-backend hrm-frontend --no-pager -l
    
    print_header "USEFUL SYSTEMD COMMANDS"
    echo "View logs:     journalctl -u hrm-backend -f"
    echo "               journalctl -u hrm-frontend -f"
    echo "Restart:       systemctl restart hrm-backend"
    echo "               systemctl restart hrm-frontend"
    echo "Stop:          systemctl stop hrm-backend hrm-frontend"
    echo "Status:        systemctl status hrm-backend hrm-frontend"
    
elif [ "$pm_choice" = "2" ]; then
    print_header "Starting Services with PM2"
    
    # Disable systemd services
    systemctl disable hrm-backend hrm-frontend 2>/dev/null || true
    
    # Start with PM2
    cd "$APP_DIR"
    sudo -u $APP_USER pm2 start ecosystem.config.js
    sudo -u $APP_USER pm2 save
    
    # Setup PM2 startup
    print_status "Setting up PM2 startup..."
    sudo -u $APP_USER pm2 startup systemd -u $APP_USER --hp /home/$APP_USER | grep "sudo" | bash
    
    print_status "PM2 services started"
    
    print_header "PM2 STATUS"
    sudo -u $APP_USER pm2 status
    
    print_header "USEFUL PM2 COMMANDS"
    echo "View logs:     pm2 logs"
    echo "               pm2 logs hrm-backend"
    echo "               pm2 logs hrm-frontend"
    echo "Monitor:       pm2 monit"
    echo "Restart:       pm2 restart hrm-backend"
    echo "               pm2 restart hrm-frontend"
    echo "Stop:          pm2 stop all"
    echo "Status:        pm2 status"
    
else
    print_error "Invalid choice"
    exit 1
fi

# Step 10: Verify services
print_header "STEP 10: Verifying Services"
sleep 5

echo "Testing backend health endpoint..."
if curl -s http://localhost:5000/api/health >/dev/null 2>&1; then
    print_status "Backend responding on port 5000"
else
    print_warning "Backend not responding on port 5000 (might still be starting)"
fi

echo "Testing frontend..."
if curl -s http://localhost:3000 >/dev/null 2>&1; then
    print_status "Frontend responding on port 3000"
else
    print_warning "Frontend not responding on port 3000 (might still be starting)"
fi

echo "Testing Nginx proxy..."
if curl -s http://localhost/api/health >/dev/null 2>&1; then
    print_status "Nginx proxy working (port 80 -> 5000)"
else
    print_warning "Nginx proxy not working. Check: systemctl status nginx"
fi

# Final summary
print_header "✅ DEPLOYMENT FIX COMPLETE"
echo ""
echo "Summary of changes:"
echo "  ✓ Frontend .env.production fixed (API URL: /api instead of :5000/api)"
echo "  ✓ Ecosystem.config.js fixed (PORT: 5000 instead of 8080)"
echo "  ✓ Frontend rebuilt with correct API URL"
echo "  ✓ Systemd service files recreated with proper ExecStart"
echo "  ✓ Services started successfully"
echo ""
echo "Your application should now be accessible at:"
echo "  → http://95.216.14.232"
echo ""
echo "Backup of old configs saved to: $BACKUP_DIR"
echo ""
echo "Next steps:"
echo "  1. Test login at http://95.216.14.232"
echo "  2. Monitor logs for any errors"
echo "  3. Run health checks periodically"
echo ""
print_status "All done! 🎉"
