#!/bin/bash

# =============================================================================
# 🎯 One-Line Deployment Commands for SkyrakSys HRM
# =============================================================================
# Copy and paste these commands for instant deployment
# =============================================================================

# ============== FIRST TIME DEPLOYMENT ==============

echo "🚀 FIRST TIME DEPLOYMENT COMMANDS:"
echo ""
echo "1. SSH to your RHEL server:"
echo "   ssh root@95.216.14.232"
echo ""
echo "2. Deploy with ONE command:"
echo "   curl -sSL https://raw.githubusercontent.com/kanchanavinoth-crypto/skyraksys_hrm_app/master/rhel-quick-deploy.sh | bash"
echo ""

# ============== QUICK UPDATES ==============

echo "🔄 QUICK UPDATE COMMANDS:"
echo ""
echo "After making changes and pushing to Git:"
echo "   ssh root@95.216.14.232"
echo "   curl -sSL https://raw.githubusercontent.com/kanchanavinoth-crypto/skyraksys_hrm_app/master/quick-update.sh | bash"
echo ""

# ============== MANUAL DEPLOYMENT ==============

echo "📋 MANUAL DEPLOYMENT COMMANDS:"
echo ""
echo "If you prefer manual control:"
echo ""
echo "# Clone repository"
echo "cd /opt"
echo "git clone https://github.com/kanchanavinoth-crypto/skyraksys_hrm_app.git"
echo "cd skyraksys_hrm_app"
echo ""
echo "# Make scripts executable"
echo "chmod +x *.sh"
echo ""
echo "# Choose deployment method:"
echo "./rhel-quick-deploy.sh          # Fastest automated deployment"
echo "./FINAL-PRODUCTION-DEPLOY.sh    # Full deployment with options"
echo "./master-deploy.sh              # Standard deployment script"
echo "./deploy-from-github.sh         # GitHub-specific deployment"
echo ""

# ============== MANAGEMENT COMMANDS ==============

echo "⚙️ MANAGEMENT COMMANDS:"
echo ""
echo "# Check application status"
echo "pm2 status"
echo ""
echo "# View logs"
echo "pm2 logs skyraksys-hrm"
echo "tail -f /var/log/skyraksys-deployment.log"
echo ""
echo "# Restart application"
echo "pm2 restart skyraksys-hrm"
echo ""
echo "# Stop application"
echo "pm2 stop skyraksys-hrm"
echo ""
echo "# Update from Git"
echo "cd /opt/skyraksys_hrm_app && git pull && pm2 restart skyraksys-hrm"
echo ""

# ============== QUICK FIXES ==============

echo "🔧 QUICK FIX COMMANDS:"
echo ""
echo "# Restart all services"
echo "systemctl restart nginx && pm2 restart skyraksys-hrm"
echo ""
echo "# Rebuild frontend only"
echo "cd /opt/skyraksys_hrm_app/frontend && npm run build && pm2 restart skyraksys-hrm"
echo ""
echo "# Reset to clean state"
echo "cd /opt/skyraksys_hrm_app && git reset --hard HEAD && git pull && pm2 restart skyraksys-hrm"
echo ""
echo "# Check what's running on ports"
echo "netstat -tlnp | grep ':80\\|:3001\\|:5432'"
echo ""

# ============== CONFIGURATION UPDATES ==============

echo "📝 CONFIGURATION UPDATE COMMANDS:"
echo ""
echo "# Update environment variables"
echo "nano /opt/skyraksys_hrm_app/backend/.env"
echo "pm2 restart skyraksys-hrm"
echo ""
echo "# Update Nginx configuration"
echo "nano /etc/nginx/conf.d/skyraksys-hrm.conf"
echo "nginx -t && systemctl reload nginx"
echo ""

# ============== TROUBLESHOOTING ==============

echo "🚨 TROUBLESHOOTING COMMANDS:"
echo ""
echo "# Check all service status"
echo "systemctl status nginx postgresql"
echo "pm2 status"
echo ""
echo "# Check database connection"
echo "sudo -u postgres psql -d skyraksys_hrm_prod -c '\\dt'"
echo ""
echo "# Check application health"
echo "curl http://localhost/api/health"
echo ""
echo "# View error logs"
echo "journalctl -u nginx -f"
echo "pm2 logs skyraksys-hrm --err"
echo ""

echo "================================================"
echo "🎉 Copy and paste commands as needed!"
echo "📋 See RHEL-QUICK-DEPLOYMENT.md for full guide"
echo "================================================"