#!/bin/bash
# Quick Migration Report Generator (Local Testing)
# Usage: bash migration-report.sh

DB_NAME="skyraksys_hrm_prod"  # Production database

echo "========================================"
echo "DATABASE MIGRATION REPORT"
echo "========================================"
echo "Database: ${DB_NAME}"
echo "Date: $(date)"
echo ""

# Check database exists
psql -U postgres -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"
if [ $? -ne 0 ]; then
    echo "❌ Database ${DB_NAME} does not exist!"
    exit 1
fi

echo "📊 CURRENT STATE"
echo "========================================"
echo ""

# List all tables
echo "Tables:"
echo "----------------------------------------"
psql -U postgres -d "$DB_NAME" -c "
    SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
    FROM pg_tables 
    WHERE schemaname = 'public' 
    ORDER BY tablename;
"

echo ""
echo "Row Counts:"
echo "----------------------------------------"
psql -U postgres -d "$DB_NAME" -t -c "
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
" | while read table; do
    if [ ! -z "$table" ]; then
        count=$(psql -U postgres -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM \"${table}\";" | xargs)
        printf "%-30s : %s rows\n" "$table" "$count"
    fi
done

echo ""
echo "🔄 MIGRATIONS STATUS"
echo "========================================"
psql -U postgres -d "$DB_NAME" -c "
    SELECT 
        name as migration_file,
        \"createdAt\" as executed_at
    FROM \"SequelizeMeta\" 
    ORDER BY \"createdAt\";
"

echo ""
echo "👥 USERS"
echo "========================================"
psql -U postgres -d "$DB_NAME" -c "
    SELECT 
        email,
        role,
        COALESCE(\"firstName\", '') || ' ' || COALESCE(\"lastName\", '') as name,
        \"isActive\" as active,
        \"createdAt\"
    FROM users 
    ORDER BY role, email;
"

echo ""
echo "🏢 DEPARTMENTS"
echo "========================================"
psql -U postgres -d "$DB_NAME" -c "
    SELECT 
        name,
        description,
        \"isActive\" as active,
        (SELECT COUNT(*) FROM employees WHERE \"departmentId\" = departments.id) as employee_count
    FROM departments 
    ORDER BY name;
"

echo ""
