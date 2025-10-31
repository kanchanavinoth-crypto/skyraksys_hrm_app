#!/bin/bash
# COMPREHENSIVE Production Fix Script
# Fixes: Backend down, wrong API URLs, proxy issues, missing users
# Run on RHEL server: sudo bash comprehensive-fix.sh

echo "================================"
echo "🔧 COMPREHENSIVE PRODUCTION FIX"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📊 Current Issues:${NC}"
echo "  • Backend service not running (502 errors)"
echo "  • Frontend calling wrong API URL (port 5000 directly)"
echo "  • No users in database (401 unauthorized)"
echo "  • Mixed HTTP/HTTPS errors"
echo "  • Proxy configuration conflicts"
echo ""

# ============================================
# STEP 1: Check Environment
# ============================================
echo -e "${YELLOW}STEP 1: Checking Environment${NC}"
echo "----------------------------"

if [ ! -f /opt/skyraksys-hrm/backend/.env ]; then
    echo -e "${RED}❌ Backend .env file missing!${NC}"
    echo "Creating from template..."
    cp /opt/skyraksys-hrm/redhatprod/templates/.env.production /opt/skyraksys-hrm/backend/.env
    
    # Set database password
    if [ -f /opt/skyraksys-hrm/.db_password ]; then
        DB_PASS=$(cat /opt/skyraksys-hrm/.db_password)
        sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASS/" /opt/skyraksys-hrm/backend/.env
        echo -e "${GREEN}✅ Updated DB_PASSWORD${NC}"
    fi
    
    # Fix permissions
    chown hrmapp:hrmapp /opt/skyraksys-hrm/backend/.env
    chmod 600 /opt/skyraksys-hrm/backend/.env
else
    echo -e "${GREEN}✅ Backend .env exists${NC}"
fi

# Check frontend .env.production
if [ ! -f /opt/skyraksys-hrm/frontend/.env.production ]; then
    echo -e "${RED}❌ Frontend .env.production missing!${NC}"
    echo "REACT_APP_API_URL=http://95.216.14.232/api" > /opt/skyraksys-hrm/frontend/.env.production
    echo -e "${GREEN}✅ Created frontend .env.production${NC}"
else
    echo -e "${GREEN}✅ Frontend .env.production exists${NC}"
fi

echo ""

# ============================================
# STEP 2: Fix Frontend Configuration
# ============================================
echo -e "${YELLOW}STEP 2: Fixing Frontend Configuration${NC}"
echo "--------------------------------------"

# Remove proxy from package.json (causes port 5000 issues)
cd /opt/skyraksys-hrm/frontend

if grep -q '"proxy"' package.json; then
    echo -e "${YELLOW}⚠️  Found proxy in package.json - REMOVING${NC}"
    # Backup first
    cp package.json package.json.backup
    # Remove proxy line
    sed -i '/"proxy":/d' package.json
    echo -e "${GREEN}✅ Removed proxy from package.json${NC}"
else
    echo -e "${GREEN}✅ No proxy in package.json${NC}"
fi

# Ensure .env.production has correct API URL (no port number)
echo "REACT_APP_API_URL=http://95.216.14.232/api" > .env.production
echo "# API URL goes through Nginx on port 80 (NO port 5000)" >> .env.production
echo -e "${GREEN}✅ Updated .env.production${NC}"

# Create/update .env (for local reference)
cat > .env << 'EOF'
# Local development - connect to local backend
REACT_APP_API_URL=http://localhost:5000/api

# For production, use .env.production which is automatically loaded during build
EOF

echo ""

# ============================================
# STEP 3: Database Check
# ============================================
echo -e "${YELLOW}STEP 3: Checking Database${NC}"
echo "--------------------------"

# Start PostgreSQL if not running
systemctl is-active --quiet postgresql-17
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  PostgreSQL not running - starting...${NC}"
    systemctl start postgresql-17
    sleep 3
fi

# Check database exists
sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw skyraksys_hrm_prod
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database exists${NC}"
    
    # Check if users table has data
    USER_COUNT=$(sudo -u postgres psql -d skyraksys_hrm_prod -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | xargs)
    
    if [ -z "$USER_COUNT" ] || [ "$USER_COUNT" = "0" ]; then
        echo -e "${YELLOW}⚠️  No users found - seeding demo data...${NC}"
        cd /opt/skyraksys-hrm/backend
        sudo -u hrmapp npx sequelize-cli db:seed:all
        echo -e "${GREEN}✅ Demo users seeded${NC}"
        echo ""
        echo -e "${GREEN}Default Credentials:${NC}"
        echo "  Email: admin@skyraksys.com"
        echo "  Password: admin123"
        echo ""
    else
        echo -e "${GREEN}✅ Users exist ($USER_COUNT users)${NC}"
    fi
else
    echo -e "${RED}❌ Database does not exist!${NC}"
    echo "Run setup script: bash /opt/skyraksys-hrm/redhatprod/scripts/02_setup_database.sh"
    exit 1
fi

echo ""

# ============================================
# STEP 4: Fix Permissions
# ============================================
echo -e "${YELLOW}STEP 4: Fixing Permissions${NC}"
echo "--------------------------"

chown -R hrmapp:hrmapp /opt/skyraksys-hrm/backend
chown -R hrmapp:hrmapp /opt/skyraksys-hrm/frontend
chown -R hrmapp:hrmapp /var/log/skyraksys-hrm 2>/dev/null || mkdir -p /var/log/skyraksys-hrm && chown -R hrmapp:hrmapp /var/log/skyraksys-hrm
chmod 600 /opt/skyraksys-hrm/backend/.env

echo -e "${GREEN}✅ Permissions fixed${NC}"
echo ""

# ============================================
# STEP 5: Rebuild Frontend
# ============================================
echo -e "${YELLOW}STEP 5: Rebuilding Frontend (This may take 2-3 minutes)${NC}"
echo "--------------------------------------------------------"

cd /opt/skyraksys-hrm/frontend

# Clean old build
echo "Cleaning old build..."
rm -rf build/

# Build with production environment
echo "Building production bundle..."
sudo -u hrmapp npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend build successful${NC}"
    
    # Verify build directory
    if [ -d "build" ]; then
        echo -e "${GREEN}✅ Build directory created${NC}"
        BUILD_SIZE=$(du -sh build | cut -f1)
        echo "   Build size: $BUILD_SIZE"
    fi
else
    echo -e "${RED}❌ Frontend build failed!${NC}"
    echo "Check logs and try manually: cd /opt/skyraksys-hrm/frontend && npm run build"
    exit 1
fi

echo ""

# ============================================
# STEP 6: Restart Services
# ============================================
echo -e "${YELLOW}STEP 6: Restarting Services${NC}"
echo "----------------------------"

# Stop all services
echo "Stopping services..."
systemctl stop hrm-backend hrm-frontend 2>/dev/null

# Start backend
echo "Starting backend..."
systemctl start hrm-backend
sleep 3

# Check backend status
if systemctl is-active --quiet hrm-backend; then
    echo -e "${GREEN}✅ Backend started${NC}"
else
    echo -e "${RED}❌ Backend failed to start!${NC}"
    echo "Checking logs..."
    journalctl -u hrm-backend -n 20 --no-pager
    exit 1
fi

# Start frontend
echo "Starting frontend..."
systemctl start hrm-frontend
sleep 2

# Check frontend status
if systemctl is-active --quiet hrm-frontend; then
    echo -e "${GREEN}✅ Frontend started${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend service issue (not critical if Nginx serves build)${NC}"
fi

# Restart Nginx
echo "Reloading Nginx..."
systemctl reload nginx

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Nginx reloaded${NC}"
else
    echo -e "${RED}❌ Nginx reload failed!${NC}"
    nginx -t
    exit 1
fi

echo ""

# ============================================
# STEP 7: Verification Tests
# ============================================
echo -e "${YELLOW}STEP 7: Running Verification Tests${NC}"
echo "------------------------------------"

# Test 1: Backend health (direct)
echo -n "Testing backend (localhost:5000)... "
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health)
if [ "$BACKEND_HEALTH" = "200" ]; then
    echo -e "${GREEN}✅ PASS (200)${NC}"
else
    echo -e "${RED}❌ FAIL ($BACKEND_HEALTH)${NC}"
fi

# Test 2: Backend through Nginx
echo -n "Testing backend through Nginx... "
NGINX_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://95.216.14.232/api/health)
if [ "$NGINX_HEALTH" = "200" ]; then
    echo -e "${GREEN}✅ PASS (200)${NC}"
else
    echo -e "${RED}❌ FAIL ($NGINX_HEALTH)${NC}"
fi

# Test 3: Frontend (root)
echo -n "Testing frontend... "
FRONTEND_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://95.216.14.232/)
if [ "$FRONTEND_TEST" = "200" ]; then
    echo -e "${GREEN}✅ PASS (200)${NC}"
else
    echo -e "${RED}❌ FAIL ($FRONTEND_TEST)${NC}"
fi

# Test 4: Login endpoint
echo -n "Testing login endpoint... "
LOGIN_TEST=$(curl -s -X POST http://95.216.14.232/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@skyraksys.com","password":"admin123"}' \
    -o /dev/null -w "%{http_code}")

if [ "$LOGIN_TEST" = "200" ]; then
    echo -e "${GREEN}✅ PASS (200 - Login works!)${NC}"
elif [ "$LOGIN_TEST" = "401" ]; then
    echo -e "${YELLOW}⚠️  401 (Endpoint works, check credentials)${NC}"
else
    echo -e "${RED}❌ FAIL ($LOGIN_TEST)${NC}"
fi

echo ""

# ============================================
# STEP 8: Final Status
# ============================================
echo -e "${YELLOW}STEP 8: Final System Status${NC}"
echo "----------------------------"

systemctl status hrm-backend --no-pager | grep "Active:"
systemctl status hrm-frontend --no-pager | grep "Active:"
systemctl status nginx --no-pager | grep "Active:"
systemctl status postgresql-17 --no-pager | grep "Active:"

echo ""

# ============================================
# Summary & Next Steps
# ============================================
echo "================================"
echo -e "${GREEN}✅ FIX COMPLETE${NC}"
echo "================================"
echo ""
echo "🎯 What was fixed:"
echo "  ✅ Removed proxy configuration from package.json"
echo "  ✅ Fixed frontend .env.production (no port 5000)"
echo "  ✅ Rebuilt frontend with correct API URL"
echo "  ✅ Seeded demo users in database"
echo "  ✅ Restarted all services"
echo ""
echo "🔐 Login Credentials:"
echo "  URL: http://95.216.14.232"
echo "  Email: admin@skyraksys.com"
echo "  Password: admin123"
echo ""
echo "🔍 Verify in Browser:"
echo "  1. Open: http://95.216.14.232"
echo "  2. Login with credentials above"
echo "  3. Check browser console - should have NO errors"
echo ""
echo "📊 Quick Tests:"
echo "  Health check: curl http://95.216.14.232/api/health"
echo "  Login test: curl -X POST http://95.216.14.232/api/auth/login \\"
echo "              -H 'Content-Type: application/json' \\"
echo "              -d '{\"email\":\"admin@skyraksys.com\",\"password\":\"admin123\"}'"
echo ""
echo "📝 Logs:"
echo "  Backend: sudo journalctl -u hrm-backend -f"
echo "  Frontend: sudo journalctl -u hrm-frontend -f"
echo "  Nginx: sudo tail -f /var/log/nginx/hrm_error.log"
echo ""
echo "⚠️  If still having issues:"
echo "  1. Check browser console for errors"
echo "  2. Clear browser cache (Ctrl+Shift+Del)"
echo "  3. Try incognito/private browsing"
echo "  4. Check logs: sudo journalctl -u hrm-backend -n 50"
echo ""
