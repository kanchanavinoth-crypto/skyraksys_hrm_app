#!/bin/bash
# ==============================================
# Production Database Migration & Seeding Script
# ==============================================
# Purpose: Run migrations, generate before/after report, seed demo data
# Usage: sudo bash 03_migrate_and_seed_production.sh
# ==============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_DIR="/opt/skyraksys-hrm/migration-reports"
REPORT_FILE="${REPORT_DIR}/migration_report_${TIMESTAMP}.txt"

# Database credentials
DB_NAME="skyraksys_hrm_prod"
DB_USER="hrm_app"

echo "========================================"
echo "🔄 PRODUCTION DATABASE MIGRATION"
echo "========================================"
echo ""
echo -e "${CYAN}Timestamp: $(date)${NC}"
echo -e "${CYAN}Database: ${DB_NAME}${NC}"
echo ""

# Create report directory
mkdir -p "$REPORT_DIR"

# Start report
{
    echo "========================================"
    echo "DATABASE MIGRATION REPORT"
    echo "========================================"
    echo "Date: $(date)"
    echo "Database: ${DB_NAME}"
    echo "Server: $(hostname)"
    echo ""
} > "$REPORT_FILE"

# ==============================================
# STEP 1: Pre-Migration Database State
# ==============================================
echo -e "${YELLOW}STEP 1: Capturing Pre-Migration State${NC}"
echo "----------------------------------------"

{
    echo "========================================"
    echo "1. PRE-MIGRATION STATE"
    echo "========================================"
    echo ""
} >> "$REPORT_FILE"

# Check if database exists
echo -n "Checking database existence... "
DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" 2>/dev/null || echo "0")

if [ "$DB_EXISTS" = "1" ]; then
    echo -e "${GREEN}✓ Database exists${NC}"
    
    # Get list of tables BEFORE migration
    echo -n "Querying existing tables... "
    TABLES_BEFORE=$(sudo -u postgres psql -d "$DB_NAME" -t -c "
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
    " 2>/dev/null | grep -v '^$' | xargs)
    
    TABLE_COUNT_BEFORE=$(echo "$TABLES_BEFORE" | wc -w)
    echo -e "${GREEN}✓ Found ${TABLE_COUNT_BEFORE} tables${NC}"
    
    {
        echo "📊 Tables Before Migration (${TABLE_COUNT_BEFORE} total):"
        echo "----------------------------------------"
        echo "$TABLES_BEFORE" | tr ' ' '\n' | nl
        echo ""
    } >> "$REPORT_FILE"
    
    # Get row counts for each table
    echo "Counting rows in each table..."
    {
        echo "📈 Row Counts Before Migration:"
        echo "----------------------------------------"
    } >> "$REPORT_FILE"
    
    for table in $TABLES_BEFORE; do
        ROW_COUNT=$(sudo -u postgres psql -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM \"${table}\";" 2>/dev/null | xargs || echo "0")
        printf "%-30s : %s rows\n" "$table" "$ROW_COUNT" | tee -a "$REPORT_FILE"
    done
    
    echo "" >> "$REPORT_FILE"
    
    # Get migration status
    echo -n "Checking migration status... "
    MIGRATIONS_DONE=$(sudo -u postgres psql -d "$DB_NAME" -t -c "
        SELECT name FROM \"SequelizeMeta\" ORDER BY name;
    " 2>/dev/null | grep -v '^$' | wc -l || echo "0")
    
    echo -e "${GREEN}✓ ${MIGRATIONS_DONE} migrations completed${NC}"
    
    {
        echo "🔄 Migrations Completed Before: ${MIGRATIONS_DONE}"
        echo "----------------------------------------"
        sudo -u postgres psql -d "$DB_NAME" -t -c "SELECT name FROM \"SequelizeMeta\" ORDER BY name;" 2>/dev/null | grep -v '^$' | nl
        echo ""
    } >> "$REPORT_FILE"
    
else
    echo -e "${RED}✗ Database does not exist!${NC}"
    {
        echo "❌ Database does not exist!"
        echo "Please run 02_setup_database.sh first"
        echo ""
    } >> "$REPORT_FILE"
    exit 1
fi

echo ""

# ==============================================
# STEP 2: Run Migrations
# ==============================================
echo -e "${YELLOW}STEP 2: Running Database Migrations${NC}"
echo "------------------------------------"

cd /opt/skyraksys-hrm/backend

{
    echo "========================================"
    echo "2. MIGRATION EXECUTION"
    echo "========================================"
    echo ""
} >> "$REPORT_FILE"

echo "Running sequelize migrations..."
echo ""

# Capture migration output
MIGRATION_OUTPUT=$(sudo -u hrmapp npx sequelize-cli db:migrate 2>&1)
MIGRATION_EXIT_CODE=$?

echo "$MIGRATION_OUTPUT"
echo ""

{
    echo "Migration Output:"
    echo "----------------------------------------"
    echo "$MIGRATION_OUTPUT"
    echo ""
    echo "Exit Code: ${MIGRATION_EXIT_CODE}"
    echo ""
} >> "$REPORT_FILE"

if [ $MIGRATION_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Migrations completed successfully${NC}"
else
    echo -e "${RED}❌ Migration failed with exit code ${MIGRATION_EXIT_CODE}${NC}"
    {
        echo "❌ MIGRATION FAILED"
        echo "Check logs above for details"
        echo ""
    } >> "$REPORT_FILE"
    
    echo ""
    echo "Report saved to: ${REPORT_FILE}"
    exit 1
fi

echo ""

# ==============================================
# STEP 3: Post-Migration Database State
# ==============================================
echo -e "${YELLOW}STEP 3: Capturing Post-Migration State${NC}"
echo "---------------------------------------"

{
    echo "========================================"
    echo "3. POST-MIGRATION STATE"
    echo "========================================"
    echo ""
} >> "$REPORT_FILE"

# Get list of tables AFTER migration
echo -n "Querying tables after migration... "
TABLES_AFTER=$(sudo -u postgres psql -d "$DB_NAME" -t -c "
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
" 2>/dev/null | grep -v '^$' | xargs)

TABLE_COUNT_AFTER=$(echo "$TABLES_AFTER" | wc -w)
echo -e "${GREEN}✓ Found ${TABLE_COUNT_AFTER} tables${NC}"

{
    echo "📊 Tables After Migration (${TABLE_COUNT_AFTER} total):"
    echo "----------------------------------------"
    echo "$TABLES_AFTER" | tr ' ' '\n' | nl
    echo ""
} >> "$REPORT_FILE"

# Get row counts after migration
echo "Counting rows after migration..."
{
    echo "📈 Row Counts After Migration:"
    echo "----------------------------------------"
} >> "$REPORT_FILE"

for table in $TABLES_AFTER; do
    ROW_COUNT=$(sudo -u postgres psql -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM \"${table}\";" 2>/dev/null | xargs || echo "0")
    printf "%-30s : %s rows\n" "$table" "$ROW_COUNT" | tee -a "$REPORT_FILE"
done

echo "" >> "$REPORT_FILE"

# Get final migration status
MIGRATIONS_DONE_AFTER=$(sudo -u postgres psql -d "$DB_NAME" -t -c "
    SELECT name FROM \"SequelizeMeta\" ORDER BY name;
" 2>/dev/null | grep -v '^$' | wc -l || echo "0")

{
    echo "🔄 Migrations Completed After: ${MIGRATIONS_DONE_AFTER}"
    echo "----------------------------------------"
    sudo -u postgres psql -d "$DB_NAME" -t -c "SELECT name FROM \"SequelizeMeta\" ORDER BY name;" 2>/dev/null | grep -v '^$' | nl
    echo ""
} >> "$REPORT_FILE"

echo ""

# ==============================================
# STEP 4: Compare Before & After
# ==============================================
echo -e "${YELLOW}STEP 4: Analyzing Changes${NC}"
echo "-------------------------"

{
    echo "========================================"
    echo "4. CHANGES SUMMARY"
    echo "========================================"
    echo ""
} >> "$REPORT_FILE"

# Calculate changes
NEW_TABLES=$(comm -13 <(echo "$TABLES_BEFORE" | tr ' ' '\n' | sort) <(echo "$TABLES_AFTER" | tr ' ' '\n' | sort) | wc -l)
REMOVED_TABLES=$(comm -23 <(echo "$TABLES_BEFORE" | tr ' ' '\n' | sort) <(echo "$TABLES_AFTER" | tr ' ' '\n' | sort) | wc -l)
NEW_MIGRATIONS=$((MIGRATIONS_DONE_AFTER - MIGRATIONS_DONE))

{
    echo "📊 Summary of Changes:"
    echo "----------------------------------------"
    echo "Tables before:        ${TABLE_COUNT_BEFORE}"
    echo "Tables after:         ${TABLE_COUNT_AFTER}"
    echo "New tables added:     ${NEW_TABLES}"
    echo "Tables removed:       ${REMOVED_TABLES}"
    echo ""
    echo "Migrations before:    ${MIGRATIONS_DONE}"
    echo "Migrations after:     ${MIGRATIONS_DONE_AFTER}"
    echo "New migrations run:   ${NEW_MIGRATIONS}"
    echo ""
} >> "$REPORT_FILE"

if [ $NEW_TABLES -gt 0 ]; then
    {
        echo "✨ New Tables Added:"
        echo "----------------------------------------"
        comm -13 <(echo "$TABLES_BEFORE" | tr ' ' '\n' | sort) <(echo "$TABLES_AFTER" | tr ' ' '\n' | sort) | nl
        echo ""
    } >> "$REPORT_FILE"
fi

if [ $REMOVED_TABLES -gt 0 ]; then
    {
        echo "🗑️  Tables Removed:"
        echo "----------------------------------------"
        comm -23 <(echo "$TABLES_BEFORE" | tr ' ' '\n' | sort) <(echo "$TABLES_AFTER" | tr ' ' '\n' | sort) | nl
        echo ""
    } >> "$REPORT_FILE"
fi

echo -e "${GREEN}✓ Analysis complete${NC}"
echo ""

# ==============================================
# STEP 5: Seed Demo Data (Optional)
# ==============================================
echo -e "${YELLOW}STEP 5: Seeding Demo Data${NC}"
echo "--------------------------"

{
    echo "========================================"
    echo "5. DEMO DATA SEEDING"
    echo "========================================"
    echo ""
} >> "$REPORT_FILE"

# Get default password from backend .env
cd /opt/skyraksys-hrm/backend
if [ -f .env ]; then
    DEFAULT_PASSWORD=$(grep "^SEED_DEFAULT_PASSWORD=" .env 2>/dev/null | cut -d '=' -f 2)
    if [ -z "$DEFAULT_PASSWORD" ]; then
        DEFAULT_PASSWORD="SkyRak@Prod2025!Secure#HRM"
    fi
else
    DEFAULT_PASSWORD="SkyRak@Prod2025!Secure#HRM"
fi

echo -e "${CYAN}ℹ️  Demo password set to: ${DEFAULT_PASSWORD}${NC}"
echo ""

# Check if users already exist
USER_COUNT=$(sudo -u postgres psql -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | xargs || echo "0")

if [ "$USER_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Database already contains ${USER_COUNT} users${NC}"
    echo ""
    echo "Do you want to:"
    echo "  1) Skip seeding (keep existing data)"
    echo "  2) Clear all data and re-seed"
    echo "  3) Add demo data alongside existing data"
    echo ""
    read -p "Enter choice (1-3): " SEED_CHOICE
    
    case $SEED_CHOICE in
        2)
            echo ""
            echo -e "${YELLOW}⚠️  WARNING: This will DELETE ALL EXISTING DATA!${NC}"
            read -p "Are you sure? Type 'YES' to confirm: " CONFIRM
            
            if [ "$CONFIRM" = "YES" ]; then
                echo "Clearing all data..."
                sudo -u hrmapp npx sequelize-cli db:seed:undo:all
                echo "Seeding fresh demo data..."
                SEED_OUTPUT=$(sudo -u hrmapp npx sequelize-cli db:seed:all 2>&1)
                echo "$SEED_OUTPUT"
                
                {
                    echo "Action: Cleared existing data and seeded fresh"
                    echo "----------------------------------------"
                    echo "$SEED_OUTPUT"
                    echo ""
                } >> "$REPORT_FILE"
            else
                echo -e "${YELLOW}Cancelled. Keeping existing data.${NC}"
                {
                    echo "Action: Cancelled by user"
                    echo ""
                } >> "$REPORT_FILE"
            fi
            ;;
        3)
            echo "Adding demo data..."
            SEED_OUTPUT=$(sudo -u hrmapp npx sequelize-cli db:seed:all 2>&1)
            echo "$SEED_OUTPUT"
            
            {
                echo "Action: Added demo data alongside existing"
                echo "----------------------------------------"
                echo "$SEED_OUTPUT"
                echo ""
            } >> "$REPORT_FILE"
            ;;
        *)
            echo -e "${GREEN}Skipping seeding - keeping existing data${NC}"
            {
                echo "Action: Skipped seeding (user choice)"
                echo ""
            } >> "$REPORT_FILE"
            ;;
    esac
else
    echo -e "${CYAN}No existing users found. Seeding demo data...${NC}"
    SEED_OUTPUT=$(sudo -u hrmapp npx sequelize-cli db:seed:all 2>&1)
    echo "$SEED_OUTPUT"
    
    {
        echo "Action: Seeded demo data (no existing users)"
        echo "----------------------------------------"
        echo "$SEED_OUTPUT"
        echo ""
    } >> "$REPORT_FILE"
fi

echo ""

# ==============================================
# STEP 6: Final Data Summary
# ==============================================
echo -e "${YELLOW}STEP 6: Final Data Summary${NC}"
echo "---------------------------"

{
    echo "========================================"
    echo "6. FINAL DATABASE STATE"
    echo "========================================"
    echo ""
} >> "$REPORT_FILE"

# Get final counts
{
    echo "📊 Final Row Counts:"
    echo "----------------------------------------"
} >> "$REPORT_FILE"

USERS_FINAL=$(sudo -u postgres psql -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | xargs || echo "0")
EMPLOYEES_FINAL=$(sudo -u postgres psql -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM employees;" 2>/dev/null | xargs || echo "0")
DEPARTMENTS_FINAL=$(sudo -u postgres psql -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM departments;" 2>/dev/null | xargs || echo "0")
POSITIONS_FINAL=$(sudo -u postgres psql -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM positions;" 2>/dev/null | xargs || echo "0")

printf "%-30s : %s\n" "Users" "$USERS_FINAL" | tee -a "$REPORT_FILE"
printf "%-30s : %s\n" "Employees" "$EMPLOYEES_FINAL" | tee -a "$REPORT_FILE"
printf "%-30s : %s\n" "Departments" "$DEPARTMENTS_FINAL" | tee -a "$REPORT_FILE"
printf "%-30s : %s\n" "Positions" "$POSITIONS_FINAL" | tee -a "$REPORT_FILE"

echo "" | tee -a "$REPORT_FILE"

if [ "$USERS_FINAL" -gt 0 ]; then
    {
        echo "👥 User List:"
        echo "----------------------------------------"
        sudo -u postgres psql -d "$DB_NAME" -c "
            SELECT 
                email, 
                role, 
                \"firstName\" || ' ' || \"lastName\" as name,
                \"isActive\" as active
            FROM users 
            ORDER BY role, email;
        " 2>/dev/null
        echo ""
    } >> "$REPORT_FILE"
    
    echo -e "${GREEN}✓ ${USERS_FINAL} users in database${NC}"
    
    if [ "$USERS_FINAL" -ge 5 ]; then
        echo ""
        echo -e "${CYAN}🔐 Default Demo Credentials:${NC}"
        echo "----------------------------------------"
        echo "Admin:     admin@skyraksys.com / ${DEFAULT_PASSWORD}"
        echo "HR:        hr@skyraksys.com / ${DEFAULT_PASSWORD}"
        echo "Manager:   lead@skyraksys.com / ${DEFAULT_PASSWORD}"
        echo "Employee1: employee1@skyraksys.com / ${DEFAULT_PASSWORD}"
        echo "Employee2: employee2@skyraksys.com / ${DEFAULT_PASSWORD}"
        echo ""
        
        {
            echo "🔐 Demo Credentials:"
            echo "----------------------------------------"
            echo "All passwords: ${DEFAULT_PASSWORD}"
            echo "Admin:     admin@skyraksys.com"
            echo "HR:        hr@skyraksys.com"
            echo "Manager:   lead@skyraksys.com"
            echo "Employee1: employee1@skyraksys.com"
            echo "Employee2: employee2@skyraksys.com"
            echo ""
        } >> "$REPORT_FILE"
    fi
fi

# ==============================================
# Finalize Report
# ==============================================
{
    echo "========================================"
    echo "MIGRATION COMPLETED"
    echo "========================================"
    echo "Completed at: $(date)"
    echo "Report saved to: ${REPORT_FILE}"
    echo ""
} >> "$REPORT_FILE"

echo ""
echo "========================================"
echo -e "${GREEN}✅ MIGRATION COMPLETE${NC}"
echo "========================================"
echo ""
echo "📄 Full report saved to:"
echo "   ${REPORT_FILE}"
echo ""
echo "📊 Quick Summary:"
echo "   - Tables: ${TABLE_COUNT_BEFORE} → ${TABLE_COUNT_AFTER} (${NEW_TABLES} new)"
echo "   - Migrations: ${MIGRATIONS_DONE} → ${MIGRATIONS_DONE_AFTER} (${NEW_MIGRATIONS} new)"
echo "   - Users: ${USERS_FINAL}"
echo "   - Employees: ${EMPLOYEES_FINAL}"
echo ""
echo "🔍 View full report:"
echo "   cat ${REPORT_FILE}"
echo ""
echo "📋 All migration reports:"
echo "   ls -lh ${REPORT_DIR}/"
echo ""
