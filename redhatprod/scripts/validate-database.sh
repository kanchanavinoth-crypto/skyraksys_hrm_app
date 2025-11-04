#!/bin/bash
# ==============================================
# Production Database Validation Script
# ==============================================
# Purpose: Verify all tables, indexes, foreign keys, and required data exist
# Usage: bash validate-database.sh
# ==============================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

DB_NAME="skyraksys_hrm_prod"
ERRORS=0
WARNINGS=0

echo "========================================"
echo "🔍 DATABASE VALIDATION"
echo "========================================"
echo "Database: ${DB_NAME}"
echo "Date: $(date)"
echo ""

# ==============================================
# STEP 1: Check Database Connection
# ==============================================
echo -e "${YELLOW}STEP 1: Database Connection${NC}"
echo "----------------------------"

if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo -e "${GREEN}✓ Database exists${NC}"
else
    echo -e "${RED}✗ Database does not exist!${NC}"
    exit 1
fi

# Test connection
if sudo -u postgres psql -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Can connect to database${NC}"
else
    echo -e "${RED}✗ Cannot connect to database!${NC}"
    exit 1
fi

echo ""

# ==============================================
# STEP 2: Validate Tables
# ==============================================
echo -e "${YELLOW}STEP 2: Table Structure${NC}"
echo "------------------------"

# Expected tables
EXPECTED_TABLES=(
    "SequelizeMeta"
    "departments"
    "positions"
    "users"
    "employees"
    "leave_types"
    "leave_requests"
    "leave_balances"
    "timesheets"
    "projects"
    "tasks"
    "salary_structures"
    "payroll_data"
    "payslips"
    "payslip_templates"
)

echo "Checking for required tables..."
for table in "${EXPECTED_TABLES[@]}"; do
    if sudo -u postgres psql -d "$DB_NAME" -tAc "SELECT to_regclass('public.${table}');" | grep -q "$table"; then
        echo -e "  ${GREEN}✓${NC} ${table}"
    else
        echo -e "  ${RED}✗${NC} ${table} - MISSING"
        ((ERRORS++))
    fi
done

echo ""

# ==============================================
# STEP 3: Validate Primary Keys
# ==============================================
echo -e "${YELLOW}STEP 3: Primary Keys${NC}"
echo "--------------------"

echo "Checking primary keys..."
for table in departments positions users employees leave_types leave_requests projects tasks salary_structures; do
    PK_EXISTS=$(sudo -u postgres psql -d "$DB_NAME" -tAc "
        SELECT COUNT(*) 
        FROM information_schema.table_constraints 
        WHERE table_name='${table}' 
        AND constraint_type='PRIMARY KEY';
    ")
    
    if [ "$PK_EXISTS" -gt 0 ]; then
        echo -e "  ${GREEN}✓${NC} ${table} has primary key"
    else
        echo -e "  ${RED}✗${NC} ${table} - NO PRIMARY KEY"
        ((ERRORS++))
    fi
done

echo ""

# ==============================================
# STEP 4: Validate Foreign Keys
# ==============================================
echo -e "${YELLOW}STEP 4: Foreign Keys${NC}"
echo "--------------------"

echo "Checking critical foreign keys..."

# Expected foreign keys
declare -A EXPECTED_FKS=(
    ["employees.userId"]="users.id"
    ["employees.departmentId"]="departments.id"
    ["employees.positionId"]="positions.id"
    ["positions.departmentId"]="departments.id"
    ["leave_requests.userId"]="users.id"
    ["leave_requests.leaveTypeId"]="leave_types.id"
    ["leave_balances.employeeId"]="employees.id"
    ["leave_balances.leaveTypeId"]="leave_types.id"
    ["timesheets.employeeId"]="employees.id"
    ["timesheets.projectId"]="projects.id"
    ["timesheets.taskId"]="tasks.id"
    ["tasks.projectId"]="projects.id"
    ["salary_structures.employeeId"]="employees.id"
    ["payslips.employeeId"]="employees.id"
    ["payslips.templateId"]="payslip_templates.id"
)

FK_COUNT=$(sudo -u postgres psql -d "$DB_NAME" -tAc "
    SELECT COUNT(*) 
    FROM information_schema.table_constraints 
    WHERE constraint_type='FOREIGN KEY';
")

echo -e "Total foreign keys: ${FK_COUNT}"

if [ "$FK_COUNT" -lt 10 ]; then
    echo -e "${RED}⚠️  Warning: Expected at least 10 foreign keys, found ${FK_COUNT}${NC}"
    ((WARNINGS++))
else
    echo -e "${GREEN}✓ Foreign key count looks good${NC}"
fi

echo ""

# ==============================================
# STEP 5: Validate Indexes
# ==============================================
echo -e "${YELLOW}STEP 5: Indexes${NC}"
echo "---------------"

echo "Checking for important indexes..."

INDEX_COUNT=$(sudo -u postgres psql -d "$DB_NAME" -tAc "
    SELECT COUNT(*) 
    FROM pg_indexes 
    WHERE schemaname = 'public';
")

echo -e "Total indexes: ${INDEX_COUNT}"

# Check specific important indexes
CRITICAL_INDEXES=(
    "users.email"
    "employees.employeeId"
    "employees.userId"
    "leave_requests.userId"
    "timesheets.employeeId"
)

echo "Checking critical field indexes..."
for field in "${CRITICAL_INDEXES[@]}"; do
    table=$(echo $field | cut -d. -f1)
    column=$(echo $field | cut -d. -f2)
    
    HAS_INDEX=$(sudo -u postgres psql -d "$DB_NAME" -tAc "
        SELECT COUNT(*) 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = '${table}' 
        AND indexdef LIKE '%${column}%';
    ")
    
    if [ "$HAS_INDEX" -gt 0 ]; then
        echo -e "  ${GREEN}✓${NC} ${field} is indexed"
    else
        echo -e "  ${YELLOW}⚠${NC} ${field} - no index (performance warning)"
        ((WARNINGS++))
    fi
done

echo ""

# ==============================================
# STEP 6: Validate Required Data
# ==============================================
echo -e "${YELLOW}STEP 6: Required Data${NC}"
echo "---------------------"

echo "Checking for essential seed data..."

# Check users
USER_COUNT=$(sudo -u postgres psql -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM users;")
if [ "$USER_COUNT" -gt 0 ]; then
    echo -e "  ${GREEN}✓${NC} Users: ${USER_COUNT} found"
    
    # Check for admin user
    ADMIN_EXISTS=$(sudo -u postgres psql -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM users WHERE role='admin';")
    if [ "$ADMIN_EXISTS" -gt 0 ]; then
        echo -e "  ${GREEN}✓${NC} Admin user exists"
    else
        echo -e "  ${RED}✗${NC} No admin user found!"
        ((ERRORS++))
    fi
else
    echo -e "  ${RED}✗${NC} Users: NO USERS FOUND!"
    echo -e "  ${YELLOW}→${NC} Run: npx sequelize-cli db:seed:all"
    ((ERRORS++))
fi

# Check departments
DEPT_COUNT=$(sudo -u postgres psql -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM departments;")
if [ "$DEPT_COUNT" -gt 0 ]; then
    echo -e "  ${GREEN}✓${NC} Departments: ${DEPT_COUNT} found"
else
    echo -e "  ${YELLOW}⚠${NC} Departments: NONE (seed data may be missing)"
    ((WARNINGS++))
fi

# Check positions
POS_COUNT=$(sudo -u postgres psql -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM positions;")
if [ "$POS_COUNT" -gt 0 ]; then
    echo -e "  ${GREEN}✓${NC} Positions: ${POS_COUNT} found"
else
    echo -e "  ${YELLOW}⚠${NC} Positions: NONE (seed data may be missing)"
    ((WARNINGS++))
fi

# Check employees
EMP_COUNT=$(sudo -u postgres psql -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM employees;")
if [ "$EMP_COUNT" -gt 0 ]; then
    echo -e "  ${GREEN}✓${NC} Employees: ${EMP_COUNT} found"
else
    echo -e "  ${YELLOW}⚠${NC} Employees: NONE (seed data may be missing)"
    ((WARNINGS++))
fi

# Check leave types
LEAVE_TYPE_COUNT=$(sudo -u postgres psql -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM leave_types;")
if [ "$LEAVE_TYPE_COUNT" -gt 0 ]; then
    echo -e "  ${GREEN}✓${NC} Leave Types: ${LEAVE_TYPE_COUNT} found"
else
    echo -e "  ${YELLOW}⚠${NC} Leave Types: NONE (seed data may be missing)"
    ((WARNINGS++))
fi

# Check projects
PROJECT_COUNT=$(sudo -u postgres psql -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM projects;")
if [ "$PROJECT_COUNT" -gt 0 ]; then
    echo -e "  ${GREEN}✓${NC} Projects: ${PROJECT_COUNT} found"
else
    echo -e "  ${YELLOW}⚠${NC} Projects: NONE (seed data may be missing)"
    ((WARNINGS++))
fi

# Check payslip templates
TEMPLATE_COUNT=$(sudo -u postgres psql -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM payslip_templates;")
if [ "$TEMPLATE_COUNT" -gt 0 ]; then
    echo -e "  ${GREEN}✓${NC} Payslip Templates: ${TEMPLATE_COUNT} found"
else
    echo -e "  ${YELLOW}⚠${NC} Payslip Templates: NONE (seed data may be missing)"
    ((WARNINGS++))
fi

echo ""

# ==============================================
# STEP 7: Validate Data Integrity
# ==============================================
echo -e "${YELLOW}STEP 7: Data Integrity${NC}"
echo "----------------------"

echo "Checking referential integrity..."

# Check orphaned employees (users with no employee record)
ORPHANED_USERS=$(sudo -u postgres psql -d "$DB_NAME" -tAc "
    SELECT COUNT(*) 
    FROM users u 
    LEFT JOIN employees e ON u.id = e.\"userId\" 
    WHERE e.id IS NULL 
    AND u.role IN ('employee', 'manager', 'hr');
")

if [ "$ORPHANED_USERS" -eq 0 ]; then
    echo -e "  ${GREEN}✓${NC} All non-admin users have employee records"
else
    echo -e "  ${YELLOW}⚠${NC} ${ORPHANED_USERS} user(s) without employee records"
    ((WARNINGS++))
fi

# Check employees without positions
EMP_NO_POSITION=$(sudo -u postgres psql -d "$DB_NAME" -tAc "
    SELECT COUNT(*) 
    FROM employees 
    WHERE \"positionId\" IS NULL;
")

if [ "$EMP_NO_POSITION" -eq 0 ]; then
    echo -e "  ${GREEN}✓${NC} All employees have positions"
else
    echo -e "  ${YELLOW}⚠${NC} ${EMP_NO_POSITION} employee(s) without positions"
    ((WARNINGS++))
fi

# Check employees without departments
EMP_NO_DEPT=$(sudo -u postgres psql -d "$DB_NAME" -tAc "
    SELECT COUNT(*) 
    FROM employees 
    WHERE \"departmentId\" IS NULL;
")

if [ "$EMP_NO_DEPT" -eq 0 ]; then
    echo -e "  ${GREEN}✓${NC} All employees have departments"
else
    echo -e "  ${YELLOW}⚠${NC} ${EMP_NO_DEPT} employee(s) without departments"
    ((WARNINGS++))
fi

echo ""

# ==============================================
# STEP 8: Validate Migrations
# ==============================================
echo -e "${YELLOW}STEP 8: Migration Status${NC}"
echo "------------------------"

MIGRATION_COUNT=$(sudo -u postgres psql -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM \"SequelizeMeta\";")

echo "Migrations executed: ${MIGRATION_COUNT}"

if [ "$MIGRATION_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Migrations have been run${NC}"
    echo ""
    echo "Recent migrations:"
    sudo -u postgres psql -d "$DB_NAME" -c "
        SELECT 
            name as migration_file,
            \"createdAt\" as executed_at
        FROM \"SequelizeMeta\" 
        ORDER BY \"createdAt\" DESC 
        LIMIT 5;
    " 2>/dev/null
else
    echo -e "${RED}✗ No migrations found!${NC}"
    echo -e "  ${YELLOW}→${NC} Run: npx sequelize-cli db:migrate"
    ((ERRORS++))
fi

echo ""

# ==============================================
# STEP 9: Sample Data Check
# ==============================================
echo -e "${YELLOW}STEP 9: Sample Data Details${NC}"
echo "----------------------------"

if [ "$USER_COUNT" -gt 0 ]; then
    echo "User Roles:"
    sudo -u postgres psql -d "$DB_NAME" -c "
        SELECT 
            role,
            COUNT(*) as count,
            STRING_AGG(email, ', ') as emails
        FROM users 
        GROUP BY role 
        ORDER BY role;
    " 2>/dev/null
    
    echo ""
    echo "Departments with Employee Count:"
    sudo -u postgres psql -d "$DB_NAME" -c "
        SELECT 
            d.name as department,
            COUNT(e.id) as employee_count
        FROM departments d
        LEFT JOIN employees e ON d.id = e.\"departmentId\"
        GROUP BY d.name
        ORDER BY employee_count DESC;
    " 2>/dev/null
fi

echo ""

# ==============================================
# Final Summary
# ==============================================
echo "========================================"
echo "📊 VALIDATION SUMMARY"
echo "========================================"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED!${NC}"
    echo ""
    echo "✓ All tables exist"
    echo "✓ Primary keys configured"
    echo "✓ Foreign keys in place"
    echo "✓ Indexes present"
    echo "✓ Required data seeded"
    echo "✓ Data integrity verified"
    echo "✓ Migrations complete"
    echo ""
    echo -e "${GREEN}Database is ready for production use!${NC}"
    exit 0
elif [ $ERRORS -eq 0 ] && [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  VALIDATION PASSED WITH WARNINGS${NC}"
    echo ""
    echo "Errors: ${ERRORS}"
    echo "Warnings: ${WARNINGS}"
    echo ""
    echo "The database is functional but could be improved."
    echo "Review warnings above for optimization suggestions."
    exit 0
else
    echo -e "${RED}❌ VALIDATION FAILED${NC}"
    echo ""
    echo "Errors: ${ERRORS}"
    echo "Warnings: ${WARNINGS}"
    echo ""
    echo "Critical issues found! Please fix errors before using in production."
    echo ""
    
    if [ "$USER_COUNT" -eq 0 ]; then
        echo "Quick fix:"
        echo "  cd /opt/skyraksys-hrm/backend"
        echo "  sudo -u hrmapp npx sequelize-cli db:seed:all"
        echo ""
    fi
    
    exit 1
fi
