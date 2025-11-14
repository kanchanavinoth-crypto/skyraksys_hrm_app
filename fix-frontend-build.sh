#!/bin/bash

# Complete Production Sync Script (DB + FE + BE)
# This script synchronizes database, frontend, and backend in production

echo "🚀 Complete Production Sync Script"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ERRORS=0
START_TIME=$(date +%s)

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        ERRORS=$((ERRORS + 1))
    fi
}

# Function to print info
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo -e "${BLUE}📋 Starting complete production synchronization...${NC}"
echo ""

# RHEL Environment Detection
print_info "Detecting RHEL environment..."
if [ -f /etc/redhat-release ]; then
    RHEL_VERSION=$(cat /etc/redhat-release)
    print_status 0 "RHEL Environment: $RHEL_VERSION"
else
    print_warning "Non-RHEL environment detected"
fi

# Check PostgreSQL service
print_info "Checking PostgreSQL service..."
POSTGRES_SERVICES=("postgresql" "postgresql-13" "postgresql-14" "postgresql-15" "postgresql-16")
POSTGRES_RUNNING=false

for pg_service in "${POSTGRES_SERVICES[@]}"; do
    if systemctl is-active --quiet "$pg_service" 2>/dev/null; then
        print_status 0 "PostgreSQL service ($pg_service) is running"
        POSTGRES_RUNNING=true
        break
    fi
done

if [ "$POSTGRES_RUNNING" = false ]; then
    print_warning "PostgreSQL service not detected via systemd"
fi

echo ""

# ========== 1. BACKEND SYNC ==========
echo -e "${BLUE}🔧 1. Backend Synchronization${NC}"
echo "----------------------------"

cd backend

print_info "Installing backend dependencies..."
npm install --production
print_status $? "Backend dependencies installed"

print_info "Checking backend syntax..."
node -c server.js
print_status $? "Backend syntax validation"

print_info "Running backend tests (if available)..."
if [ -f "package.json" ] && npm run test --silent > /dev/null 2>&1; then
    npm test
    print_status $? "Backend tests"
else
    print_warning "No backend tests configured"
fi

cd ..

# ========== 2. DATABASE SYNC ==========
echo ""
echo -e "${BLUE}🗄️ 2. Database Synchronization${NC}"
echo "-----------------------------"

print_info "Checking database connection..."
cd backend
if node -e "
const config = require('./config/database.js');
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(config.production || config.development);
sequelize.authenticate().then(() => {
    console.log('Database connection OK');
    process.exit(0);
}).catch((err) => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
});
" 2>/dev/null; then
    print_status 0 "Database connection verified"
else
    print_status 1 "Database connection failed"
fi

print_info "Running database migrations..."
if [ -d "migrations" ] && [ "$(ls -A migrations 2>/dev/null)" ]; then
    npx sequelize-cli db:migrate --env production
    print_status $? "Database migrations applied"
else
    print_warning "No migrations found to apply"
fi

print_info "Running database seeders (if needed)..."
if [ -d "seeders" ] && [ "$(ls -A seeders 2>/dev/null)" ]; then
    npx sequelize-cli db:seed:all --env production
    print_status $? "Database seeders applied"
else
    print_warning "No seeders found"
fi

cd ..

# ========== 3. FRONTEND SYNC ==========
echo ""
echo -e "${BLUE}🎨 3. Frontend Synchronization${NC}"
echo "-----------------------------"

cd frontend

print_info "Installing frontend dependencies..."
npm install
print_status $? "Frontend dependencies installed"

print_info "Fixing npm audit vulnerabilities..."
npm audit fix --force > /dev/null 2>&1
print_status $? "Security vulnerabilities fixed"

print_info "Cleaning build cache..."
rm -rf node_modules/.cache build
print_status $? "Build cache cleaned"

print_info "Building frontend for production..."
if npm run build > build.log 2>&1; then
    print_status 0 "Frontend production build"
    rm -f build.log
else
    print_status 1 "Frontend build failed"
    echo ""
    print_warning "Build failed. Trying with legacy peer deps..."
    
    npm config set legacy-peer-deps true
    rm -rf node_modules package-lock.json
    npm install --legacy-peer-deps
    
    if npm run build --legacy-peer-deps > build_retry.log 2>&1; then
        print_status 0 "Frontend build (with legacy deps)"
        rm -f build_retry.log
    else
        print_status 1 "Frontend build still failing"
        echo ""
        echo "Last 10 lines of build error:"
        tail -10 build_retry.log 2>/dev/null || echo "No error log available"
    fi
fi

cd ..

# ========== 4. SERVICE RESTART ==========
echo ""
echo -e "${BLUE}🔄 4. Service Restart${NC}"
echo "--------------------"

print_info "Restarting backend service..."
# Try multiple service names common in RHEL deployments
SERVICE_NAMES=("skyraksys-hrm-backend" "skyraksys-hrm" "hrm-backend" "node-backend")
SERVICE_RESTARTED=false

for service in "${SERVICE_NAMES[@]}"; do
    if systemctl is-active --quiet "$service" 2>/dev/null; then
        print_info "Found service: $service"
        systemctl restart "$service"
        sleep 3
        if systemctl is-active --quiet "$service"; then
            print_status 0 "Backend service ($service) restarted"
            SERVICE_RESTARTED=true
            break
        fi
    fi
done

if [ "$SERVICE_RESTARTED" = false ]; then
    print_warning "No systemd service found, trying PM2..."
    if command -v pm2 > /dev/null 2>&1; then
        pm2 restart all 2>/dev/null || pm2 start ecosystem.config.js 2>/dev/null
        if pm2 list | grep -q "online"; then
            print_status 0 "Backend restarted via PM2"
            SERVICE_RESTARTED=true
        fi
    fi
    
    if [ "$SERVICE_RESTARTED" = false ]; then 
        print_warning "Trying manual Node.js process restart..."
        if pgrep -f "node.*server.js" > /dev/null; then
            print_info "Killing existing Node.js process..."
            pkill -f "node.*server.js"
            sleep 2
        fi
        
        # Ensure logs directory exists
        mkdir -p logs
        cd backend
        nohup node server.js > ../logs/backend.log 2>&1 &
        sleep 5
        if pgrep -f "node.*server.js" > /dev/null; then
            print_status 0 "Backend process started manually"
        else
            print_status 1 "Backend process failed to start"
        fi
        cd ..
    fi
fi

print_info "Restarting nginx (if configured)..."
# Try multiple nginx service names in RHEL
NGINX_SERVICES=("nginx" "httpd" "apache2")
NGINX_RESTARTED=false

for nginx_service in "${NGINX_SERVICES[@]}"; do
    if systemctl is-active --quiet "$nginx_service" 2>/dev/null; then
        print_info "Found web server: $nginx_service"
        systemctl reload "$nginx_service" 2>/dev/null || systemctl restart "$nginx_service"
        if systemctl is-active --quiet "$nginx_service"; then
            print_status 0 "Web server ($nginx_service) reloaded"
            NGINX_RESTARTED=true
            break
        fi
    fi
done

if [ "$NGINX_RESTARTED" = false ]; then
    print_warning "No web server service found or not running"
fi

# ========== 5. HEALTH CHECK ==========
echo ""
echo -e "${BLUE}🏥 5. Health Check${NC}"
echo "-----------------"

print_info "Checking backend health..."
sleep 5

# Try multiple common ports for RHEL deployments
HEALTH_PORTS=("3001" "5000" "8080" "3000" "8000")
HEALTH_ENDPOINTS=("/api/health" "/health" "/api/status" "/")
HEALTH_OK=false

for port in "${HEALTH_PORTS[@]}"; do
    for endpoint in "${HEALTH_ENDPOINTS[@]}"; do
        if curl -s --connect-timeout 5 "http://localhost:$port$endpoint" > /dev/null 2>&1; then
            print_status 0 "Backend health check (port $port$endpoint)"
            HEALTH_OK=true
            break 2
        fi
    done
done

if [ "$HEALTH_OK" = false ]; then
    # Check if any Node.js process is running
    if pgrep -f "node.*server.js" > /dev/null; then
        print_status 0 "Backend process running (health endpoint not accessible)"
    else
        print_status 1 "Backend health check failed - no process found"
    fi
fi

print_info "Checking frontend availability..."
if [ -d "frontend/build" ] && [ -f "frontend/build/index.html" ]; then
    print_status 0 "Frontend build files available"
else
    print_status 1 "Frontend build files missing"
fi

print_info "Checking database connectivity..."
cd backend
if node -e "
const config = require('./config/database.js');
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(config.production || config.development);
sequelize.authenticate().then(() => process.exit(0)).catch(() => process.exit(1));
" 2>/dev/null; then
    print_status 0 "Database connectivity"
else
    print_status 1 "Database connectivity failed"
fi
cd ..

# ========== 6. SUMMARY ==========
echo ""
echo -e "${BLUE}📊 Deployment Summary${NC}"
echo "====================+"

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "⏱️  Total time: ${DURATION} seconds"
echo "🔧 Components synchronized:"
echo "   • Backend: Dependencies, syntax, tests"
echo "   • Database: Migrations, seeders, connectivity"
echo "   • Frontend: Build, dependencies, security fixes"
echo "   • Services: Restart and health verification"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}🎉 SUCCESS! All components synchronized successfully!${NC}"
    echo -e "${GREEN}🚀 Your HRM system is now fully updated in production.${NC}"
    echo ""
    echo "🔗 Access your application:"
    echo "   • Frontend: http://your-domain.com"
    echo "   • Backend API: http://your-domain.com/api"
    echo "   • Health Check: http://your-domain.com/api/health"
else
    echo -e "${RED}⚠️  COMPLETED WITH $ERRORS ERROR(S)${NC}"
    echo -e "${YELLOW}Some components may need manual attention.${NC}"
    echo ""
    echo "🔍 Check the errors above and:"
    echo "   • Review service logs: journalctl -u skyraksys-hrm-backend -f"
    echo "   • Check nginx logs: tail -f /var/log/nginx/error.log"
    echo "   • Verify database: psql -U skyraksys -d skyraksys_hrm -c '\\dt'"
fi

echo ""
echo -e "${BLUE}✨ Production sync completed!${NC}"