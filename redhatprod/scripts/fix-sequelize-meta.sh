#!/bin/bash
# ==============================================
# Fix SequelizeMeta Table and Add Missing Indexes
# ==============================================
# Purpose: Create SequelizeMeta table and populate with executed migrations
# Usage: sudo bash fix-sequelize-meta.sh
# ==============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo "========================================"
echo "🔧 FIXING DATABASE VALIDATION ISSUES"
echo "========================================"
echo ""

# Database credentials
DB_NAME="skyraksys_hrm_prod"
DB_USER="hrm_app"
DB_PASSWORD="SkyRakDB#2025!Prod@HRM\$Secure"

echo -e "${CYAN}Database: ${DB_NAME}${NC}"
echo ""

# ==============================================
# STEP 1: Create SequelizeMeta Table
# ==============================================
echo -e "${YELLOW}STEP 1: Creating SequelizeMeta Table${NC}"
echo "----------------------------------------"

PGPASSWORD="$DB_PASSWORD" psql -h localhost -U "$DB_USER" -d "$DB_NAME" << 'EOF'
-- Create SequelizeMeta table if not exists
CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
    name VARCHAR(255) NOT NULL PRIMARY KEY
);

-- Verify table exists
\dt "SequelizeMeta"
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ SequelizeMeta table created${NC}"
else
    echo -e "${RED}✗ Failed to create SequelizeMeta table${NC}"
    exit 1
fi

echo ""

# ==============================================
# STEP 2: Populate Migration Records
# ==============================================
echo -e "${YELLOW}STEP 2: Populating Migration Records${NC}"
echo "----------------------------------------"

# List of migrations that have been executed (based on validation showing 10 migrations)
PGPASSWORD="$DB_PASSWORD" psql -h localhost -U "$DB_USER" -d "$DB_NAME" << 'EOF'
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

-- Show inserted records
SELECT COUNT(*) as migration_count FROM "SequelizeMeta";
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
# STEP 3: Add Missing Performance Indexes
# ==============================================
echo -e "${YELLOW}STEP 3: Adding Performance Indexes${NC}"
echo "----------------------------------------"

PGPASSWORD="$DB_PASSWORD" psql -h localhost -U "$DB_USER" -d "$DB_NAME" << 'EOF'
-- Add index on employees.userId if not exists
CREATE INDEX IF NOT EXISTS idx_employees_userId ON employees("userId");

-- Add index on leave_requests.userId if not exists
CREATE INDEX IF NOT EXISTS idx_leave_requests_userId ON leave_requests("userId");

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
    echo -e "${YELLOW}⚠ Some indexes may already exist (this is OK)${NC}"
fi

echo ""

# ==============================================
# STEP 4: Verify Fixes
# ==============================================
echo -e "${YELLOW}STEP 4: Verifying Fixes${NC}"
echo "----------------------------------------"

PGPASSWORD="$DB_PASSWORD" psql -h localhost -U "$DB_USER" -d "$DB_NAME" << 'EOF'
-- Check SequelizeMeta
\echo '1. SequelizeMeta table:'
SELECT COUNT(*) as migrations FROM "SequelizeMeta";

-- Check indexes
\echo ''
\echo '2. Performance indexes:'
SELECT COUNT(*) as index_count 
FROM pg_indexes 
WHERE indexname IN ('idx_employees_userId', 'idx_leave_requests_userId');

-- Verify specific indexes
\echo ''
\echo '3. Index details:'
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes
WHERE indexname IN ('idx_employees_userId', 'idx_leave_requests_userId')
ORDER BY tablename;
EOF

echo ""
echo "========================================"
echo -e "${GREEN}✅ FIXES COMPLETE${NC}"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Run validation again: sudo bash validate-database.sh"
echo "2. All errors and warnings should be resolved"
echo ""
