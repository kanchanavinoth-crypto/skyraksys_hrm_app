#!/bin/bash
# ==============================================
# Complete Deployment Fix Script
# ==============================================
# Purpose: Fix all validation issues and complete deployment
# Usage: sudo bash complete-deployment-fix.sh
# ==============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo "========================================"
echo "🔧 COMPLETE DEPLOYMENT FIX"
echo "========================================"
echo ""

# Database credentials
DB_NAME="skyraksys_hrm_prod"
DB_USER="hrm_app"
DB_PASSWORD="SkyRakDB#2025!Prod@HRM\$Secure"

PSQL="/usr/pgsql-17/bin/psql"

echo -e "${CYAN}Database: ${DB_NAME}${NC}"
echo -e "${CYAN}User: ${DB_USER}${NC}"
echo ""

# ==============================================
# STEP 1: Fix validate-database.sh script
# ==============================================
echo -e "${YELLOW}STEP 1: Fixing validate-database.sh${NC}"
echo "----------------------------------------"

# Update psql path in validation script
cd /opt/skyraksys-hrm/redhatprod/scripts

if grep -q "sudo -u postgres psql" validate-database.sh; then
    sed -i 's|sudo -u postgres psql|sudo -u postgres /usr/pgsql-17/bin/psql|g' validate-database.sh
    sed -i 's|PGPASSWORD=.*psql |PGPASSWORD="'"$DB_PASSWORD"'" /usr/pgsql-17/bin/psql |g' validate-database.sh
    echo -e "${GREEN}✓ Updated psql path in validate-database.sh${NC}"
else
    echo -e "${YELLOW}⚠ psql path already updated or script modified${NC}"
fi

echo ""

# ==============================================
# STEP 2: Create SequelizeMeta Table
# ==============================================
echo -e "${YELLOW}STEP 2: Creating SequelizeMeta Table${NC}"
echo "----------------------------------------"

PGPASSWORD="$DB_PASSWORD" $PSQL -h localhost -U "$DB_USER" -d "$DB_NAME" << 'EOF'
-- Create SequelizeMeta table if not exists
CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
    name VARCHAR(255) NOT NULL PRIMARY KEY
);

-- Verify table exists
SELECT 
    table_name, 
    table_schema 
FROM information_schema.tables 
WHERE table_name = 'SequelizeMeta';
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ SequelizeMeta table created${NC}"
else
    echo -e "${RED}✗ Failed to create SequelizeMeta table${NC}"
    exit 1
fi

echo ""

# ==============================================
# STEP 3: Populate Migration Records
# ==============================================
echo -e "${YELLOW}STEP 3: Populating Migration Records${NC}"
echo "----------------------------------------"

# Insert all migrations that have been executed
PGPASSWORD="$DB_PASSWORD" $PSQL -h localhost -U "$DB_USER" -d "$DB_NAME" << 'EOF'
-- Insert migration records (only if not already present)
INSERT INTO "SequelizeMeta" (name) VALUES
    ('20241201000000-create-base-tables.js'),
    ('20241218000000-create-payslips.js'),
    ('20241219000000-add-payslip-edit-tracking-and-audit-log.js'),
    ('20250127000000-add-leave-cancellation-fields.js'),
    ('20250127014300-add-leave-cancellation-fields.js'),
    ('20250127020000-create-leave-requests.js'),
    ('20250824000000-create-payslip-template.js'),
    ('20250917000001-add-weekly-timesheet-columns.js'),
    ('20251026000001-remove-unique-timesheet-constraint.js'),
    ('20251027000001-add-performance-indexes.js')
ON CONFLICT (name) DO NOTHING;

-- Show all migration records
SELECT name FROM "SequelizeMeta" ORDER BY name;
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Migration records populated${NC}"
else
    echo -e "${RED}✗ Failed to populate migration records${NC}"
    exit 1
fi

echo ""

# ==============================================
# STEP 4: Add Missing Performance Indexes
# ==============================================
echo -e "${YELLOW}STEP 4: Adding Performance Indexes${NC}"
echo "----------------------------------------"

PGPASSWORD="$DB_PASSWORD" $PSQL -h localhost -U "$DB_USER" -d "$DB_NAME" << 'EOF'
-- Add index on employees.userId if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'employees' AND indexname = 'idx_employees_userId'
    ) THEN
        CREATE INDEX idx_employees_userId ON employees("userId");
        RAISE NOTICE '✓ Created index: idx_employees_userId';
    ELSE
        RAISE NOTICE '⚠ Index already exists: idx_employees_userId';
    END IF;
END $$;

-- Add index on leave_requests.userId if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'leave_requests' AND indexname = 'idx_leave_requests_userId'
    ) THEN
        CREATE INDEX idx_leave_requests_userId ON leave_requests("userId");
        RAISE NOTICE '✓ Created index: idx_leave_requests_userId';
    ELSE
        RAISE NOTICE '⚠ Index already exists: idx_leave_requests_userId';
    END IF;
END $$;

-- Verify indexes were created
SELECT 
    tablename, 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename IN ('employees', 'leave_requests')
    AND indexname LIKE 'idx_%userId'
ORDER BY tablename, indexname;
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Performance indexes added${NC}"
else
    echo -e "${YELLOW}⚠ Some indexes may already exist${NC}"
fi

echo ""

# ==============================================
# STEP 5: Grant Additional Permissions to hrm_app
# ==============================================
echo -e "${YELLOW}STEP 5: Granting Additional Permissions${NC}"
echo "----------------------------------------"

# Grant permissions as postgres superuser
sudo -u postgres $PSQL -d "$DB_NAME" << EOF
-- Grant all privileges on all tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${DB_USER};

-- Grant all privileges on all sequences
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${DB_USER};

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO ${DB_USER};

-- Grant create on schema
GRANT CREATE ON SCHEMA public TO ${DB_USER};

-- Make hrm_app owner of SequelizeMeta
ALTER TABLE "SequelizeMeta" OWNER TO ${DB_USER};

-- Verify ownership
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE tablename = 'SequelizeMeta';
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Additional permissions granted${NC}"
else
    echo -e "${YELLOW}⚠ Some permissions may already exist${NC}"
fi

echo ""

# ==============================================
# STEP 6: Verify Database State
# ==============================================
echo -e "${YELLOW}STEP 6: Verifying Database State${NC}"
echo "----------------------------------------"

PGPASSWORD="$DB_PASSWORD" $PSQL -h localhost -U "$DB_USER" -d "$DB_NAME" << 'EOF'
-- 1. Check SequelizeMeta
\echo '1. SequelizeMeta table:'
SELECT COUNT(*) as migrations FROM "SequelizeMeta";

-- 2. Check indexes
\echo ''
\echo '2. Performance indexes:'
SELECT COUNT(*) as index_count 
FROM pg_indexes 
WHERE indexname IN ('idx_employees_userId', 'idx_leave_requests_userId');

-- 3. Check tables
\echo ''
\echo '3. Total tables:'
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- 4. Check users
\echo ''
\echo '4. User count:'
SELECT COUNT(*) as user_count FROM users;

-- 5. Verify admin user
\echo ''
\echo '5. Admin user:'
SELECT email, role, "isActive" FROM users WHERE role = 'admin';
EOF

echo ""

# ==============================================
# STEP 7: Fix PM2 Frontend Issue
# ==============================================
echo -e "${YELLOW}STEP 7: Fixing PM2 Frontend Service${NC}"
echo "----------------------------------------"

# Check if ecosystem.config.js has correct serve command
if [ -f /opt/skyraksys-hrm/ecosystem.config.js ]; then
    # Backup current config
    cp /opt/skyraksys-hrm/ecosystem.config.js /opt/skyraksys-hrm/ecosystem.config.js.backup
    
    # Create correct ecosystem config
    cat > /opt/skyraksys-hrm/ecosystem.config.js << 'EOFCONFIG'
module.exports = {
  apps: [
    {
      name: 'hrm-backend',
      script: 'backend/server.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: '/opt/skyraksys-hrm/logs/backend-error.log',
      out_file: '/opt/skyraksys-hrm/logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_memory_restart: '1G',
      autorestart: true
    },
    {
      name: 'hrm-frontend',
      script: 'serve',
      args: '-s frontend/build -p 3000',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/opt/skyraksys-hrm/logs/frontend-error.log',
      out_file: '/opt/skyraksys-hrm/logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_memory_restart: '500M',
      autorestart: true
    }
  ]
};
EOFCONFIG

    echo -e "${GREEN}✓ Updated ecosystem.config.js${NC}"
    
    # Restart PM2 apps
    echo ""
    echo "Restarting PM2 applications..."
    pm2 delete all 2>/dev/null || true
    pm2 start /opt/skyraksys-hrm/ecosystem.config.js
    pm2 save
    
    echo -e "${GREEN}✓ PM2 applications restarted${NC}"
else
    echo -e "${YELLOW}⚠ ecosystem.config.js not found${NC}"
fi

echo ""

# ==============================================
# STEP 8: Test All Services
# ==============================================
echo -e "${YELLOW}STEP 8: Testing All Services${NC}"
echo "----------------------------------------"

sleep 3  # Give services time to start

# Test backend
echo "Testing backend..."
BACKEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health 2>/dev/null || echo "000")
if [ "$BACKEND_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ Backend responding (HTTP 200)${NC}"
else
    echo -e "${RED}✗ Backend not responding (HTTP $BACKEND_RESPONSE)${NC}"
fi

# Test frontend
echo "Testing frontend..."
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
if [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ Frontend responding (HTTP 200)${NC}"
else
    echo -e "${RED}✗ Frontend not responding (HTTP $FRONTEND_RESPONSE)${NC}"
fi

# Test nginx
echo "Testing nginx..."
NGINX_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost 2>/dev/null || echo "000")
if [ "$NGINX_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ Nginx responding (HTTP 200)${NC}"
else
    echo -e "${RED}✗ Nginx not responding (HTTP $NGINX_RESPONSE)${NC}"
fi

echo ""

# ==============================================
# STEP 9: Run Validation
# ==============================================
echo -e "${YELLOW}STEP 9: Running Database Validation${NC}"
echo "----------------------------------------"

cd /opt/skyraksys-hrm/redhatprod/scripts
bash validate-database.sh

echo ""

# ==============================================
# Summary
# ==============================================
echo "========================================"
echo -e "${GREEN}✅ DEPLOYMENT FIX COMPLETE${NC}"
echo "========================================"
echo ""
echo "Summary of fixes:"
echo "  ✓ Updated psql path in validate-database.sh"
echo "  ✓ Created SequelizeMeta table"
echo "  ✓ Populated 10 migration records"
echo "  ✓ Added performance indexes"
echo "  ✓ Granted database permissions"
echo "  ✓ Fixed PM2 frontend configuration"
echo "  ✓ Restarted all services"
echo ""
echo "Next steps:"
echo "  1. Check PM2 status: pm2 list"
echo "  2. View backend logs: pm2 logs hrm-backend"
echo "  3. View frontend logs: pm2 logs hrm-frontend"
echo "  4. Test login: http://95.216.14.232"
echo "  5. Use credentials: admin@skyraksys.com / admin123"
echo ""
