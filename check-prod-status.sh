#!/bin/bash
# Production Server Diagnostics Script
# Run this on your RHEL server: bash check-prod-status.sh

echo "================================"
echo "SKYRAKSYS HRM - PRODUCTION STATUS"
echo "================================"
echo ""

echo "1. CHECKING SERVICES STATUS"
echo "----------------------------"
systemctl status hrm-backend --no-pager | grep "Active:"
systemctl status hrm-frontend --no-pager | grep "Active:"
systemctl status nginx --no-pager | grep "Active:"
systemctl status postgresql-17 --no-pager | grep "Active:"
echo ""

echo "2. CHECKING PORTS"
echo "-----------------"
echo "Backend (should be listening on 5000):"
ss -tlnp | grep :5000 || echo "❌ Port 5000 NOT listening"
echo ""
echo "Frontend (should be listening on 3000):"
ss -tlnp | grep :3000 || echo "❌ Port 3000 NOT listening"
echo ""
echo "Nginx (should be listening on 80):"
ss -tlnp | grep :80 || echo "❌ Port 80 NOT listening"
echo ""

echo "3. CHECKING BACKEND HEALTH"
echo "--------------------------"
curl -s http://localhost:5000/api/health || echo "❌ Backend health check FAILED"
echo ""

echo "4. RECENT BACKEND LOGS (Last 20 lines)"
echo "---------------------------------------"
journalctl -u hrm-backend -n 20 --no-pager
echo ""

echo "5. RECENT NGINX ERROR LOGS (Last 10 lines)"
echo "-------------------------------------------"
tail -n 10 /var/log/nginx/hrm_error.log 2>/dev/null || echo "No Nginx error log found"
echo ""

echo "6. DATABASE CONNECTION TEST"
echo "---------------------------"
sudo -u postgres psql -d skyraksys_hrm_prod -c "SELECT 'Database Connected' as status;" 2>/dev/null || echo "❌ Database connection FAILED"
echo ""

echo "7. CHECKING .ENV FILE"
echo "---------------------"
if [ -f /opt/skyraksys-hrm/backend/.env ]; then
    echo "✅ .env file exists"
    ls -l /opt/skyraksys-hrm/backend/.env
else
    echo "❌ .env file NOT FOUND"
fi
echo ""

echo "8. DISK SPACE"
echo "-------------"
df -h / | tail -1
echo ""

echo "================================"
echo "DIAGNOSTICS COMPLETE"
echo "================================"
echo ""
echo "QUICK FIXES:"
echo "------------"
echo "Start backend:    sudo systemctl start hrm-backend"
echo "Restart backend:  sudo systemctl restart hrm-backend"
echo "View logs:        sudo journalctl -u hrm-backend -f"
echo "Check .env:       sudo cat /opt/skyraksys-hrm/backend/.env"
echo ""
