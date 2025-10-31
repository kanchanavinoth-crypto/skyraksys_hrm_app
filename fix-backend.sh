#!/bin/bash
# Quick Fix Script for Production Backend Issues
# Run on RHEL server: sudo bash fix-backend.sh

echo "🔧 FIXING BACKEND SERVICE..."
echo ""

# Stop backend
echo "1. Stopping backend service..."
systemctl stop hrm-backend

# Check if .env exists
echo "2. Checking .env file..."
if [ ! -f /opt/skyraksys-hrm/backend/.env ]; then
    echo "❌ .env file not found! Copying template..."
    cp /opt/skyraksys-hrm/redhatprod/templates/.env.production.template /opt/skyraksys-hrm/backend/.env
    
    # Get database password
    if [ -f /opt/skyraksys-hrm/.db_password ]; then
        DB_PASS=$(cat /opt/skyraksys-hrm/.db_password)
        sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASS/" /opt/skyraksys-hrm/backend/.env
        echo "✅ Updated DB_PASSWORD in .env"
    fi
    
    chown hrmapp:hrmapp /opt/skyraksys-hrm/backend/.env
    chmod 600 /opt/skyraksys-hrm/backend/.env
    
    echo "⚠️  WARNING: Please update JWT secrets and other settings in .env"
    echo "   Edit: sudo nano /opt/skyraksys-hrm/backend/.env"
fi

# Check database
echo "3. Checking database..."
sudo -u postgres psql -d skyraksys_hrm_prod -c "SELECT 1;" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Database is accessible"
    
    # Check if users table has data
    USER_COUNT=$(sudo -u postgres psql -d skyraksys_hrm_prod -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | xargs)
    if [ "$USER_COUNT" = "0" ] || [ -z "$USER_COUNT" ]; then
        echo "⚠️  No users in database. Running seeders..."
        cd /opt/skyraksys-hrm/backend
        sudo -u hrmapp npx sequelize-cli db:seed:all
        echo "✅ Demo users seeded"
    else
        echo "✅ Users exist in database ($USER_COUNT users)"
    fi
else
    echo "❌ Database not accessible - starting PostgreSQL..."
    systemctl start postgresql-17
    sleep 3
fi

# Fix permissions
echo "4. Fixing permissions..."
chown -R hrmapp:hrmapp /opt/skyraksys-hrm/backend
chown -R hrmapp:hrmapp /var/log/skyraksys-hrm

# Start backend
echo "5. Starting backend service..."
systemctl start hrm-backend
sleep 3

# Check status
echo "6. Checking status..."
systemctl status hrm-backend --no-pager | grep "Active:"

# Test health endpoint
echo "7. Testing health endpoint..."
sleep 2
curl -s http://localhost:5000/api/health | python3 -m json.tool 2>/dev/null || echo "⚠️  Health check failed"

echo ""
echo "================================"
echo "✅ BACKEND FIX COMPLETE"
echo "================================"
echo ""
echo "View logs: sudo journalctl -u hrm-backend -f"
echo "Test API:  curl http://localhost:5000/api/health"
echo ""
echo "Default login:"
echo "  Email: admin@skyraksys.com"
echo "  Password: admin123"
echo ""
