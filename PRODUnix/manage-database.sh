#!/bin/bash

# ============================================
# Database Management Script (Unix/Linux)
# ============================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

echo ""
log $CYAN "========================================"
log $CYAN " SkyRakSys HRM Database Management"
log $CYAN "========================================"
echo ""

# Make sure we're in the right directory
cd "$(dirname "$0")"

# Make scripts executable
chmod +x scripts/*.sh

echo "Select an option:"
echo ""
echo "1. Install and setup PostgreSQL"
echo "2. Create database schema and tables"
echo "3. Seed initial system data"
echo "4. Create comprehensive test data"
echo "5. Reset database (drop and recreate)"
echo "6. Backup database"
echo "7. Restore database from backup"
echo "8. Check database status"
echo "9. Exit"
echo ""

read -p "Enter your choice (1-9): " choice

case $choice in
    1)
        log $YELLOW "Installing and setting up PostgreSQL..."
        ./scripts/setup-postgresql.sh
        ;;
    2)
        log $YELLOW "Creating database schema and tables..."
        ./scripts/create-database-schema.sh
        ;;
    3)
        log $YELLOW "Seeding initial system data..."
        ./scripts/seed-initial-data.sh
        ;;
    4)
        log $YELLOW "Creating comprehensive test data..."
        ./scripts/create-test-data.sh
        ;;
    5)
        log $RED "⚠️  WARNING: This will DELETE ALL DATA in the database!"
        read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirm
        if [[ "$confirm" == "yes" ]]; then
            log $YELLOW "Resetting database..."
            
            # Load environment variables
            if [[ -f "backend/.env" ]]; then
                source backend/.env
            elif [[ -f ".env" ]]; then
                source .env
            else
                log $RED "❌ Environment file not found"
                exit 1
            fi
            
            # Drop and recreate database
            export PGPASSWORD="$DB_PASSWORD"
            
            log $YELLOW "Dropping database..."
            psql -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "${DB_USER:-postgres}" -d postgres -c "DROP DATABASE IF EXISTS ${DB_NAME:-skyraksys_hrm};"
            
            log $YELLOW "Creating fresh database..."
            psql -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "${DB_USER:-postgres}" -d postgres -c "CREATE DATABASE ${DB_NAME:-skyraksys_hrm};"
            
            log $YELLOW "Creating schema..."
            ./scripts/create-database-schema.sh
            
            log $YELLOW "Seeding initial data..."
            ./scripts/seed-initial-data.sh
            
            read -p "Do you want to create test data? (y/N): " create_test
            if [[ "$create_test" =~ ^[Yy]$ ]]; then
                ./scripts/create-test-data.sh
            fi
            
            log $GREEN "✅ Database reset completed"
        else
            log $YELLOW "Database reset cancelled"
        fi
        ;;
    6)
        log $YELLOW "Creating database backup..."
        if [[ -f "../backup.sh" ]]; then
            ../backup.sh
        else
            log $YELLOW "Manual backup command:"
            echo "pg_dump -h localhost -U hrm_user -d skyraksys_hrm > backup_\$(date +%Y%m%d_%H%M%S).sql"
        fi
        ;;
    7)
        log $YELLOW "Available backup files:"
        if [[ -d "../backups" ]]; then
            ls -la ../backups/*/database.sql.gz 2>/dev/null || log $YELLOW "No backup files found"
            echo ""
            read -p "Enter backup file path: " backup_file
            if [[ -f "$backup_file" ]]; then
                if [[ "$backup_file" == *.gz ]]; then
                    gunzip -c "$backup_file" | psql -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "${DB_USER:-postgres}" -d "${DB_NAME:-skyraksys_hrm}"
                else
                    psql -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "${DB_USER:-postgres}" -d "${DB_NAME:-skyraksys_hrm}" < "$backup_file"
                fi
                log $GREEN "✅ Database restored from backup"
            else
                log $RED "❌ Backup file not found"
            fi
        else
            log $YELLOW "No backup directory found"
        fi
        ;;
    8)
        log $YELLOW "Checking database status..."
        
        # Load environment variables
        if [[ -f "backend/.env" ]]; then
            source backend/.env
        elif [[ -f ".env" ]]; then
            source .env
        fi
        
        export PGPASSWORD="$DB_PASSWORD"
        
        echo ""
        log $CYAN "Database Connection Test:"
        if psql -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "${DB_USER:-postgres}" -d "${DB_NAME:-skyraksys_hrm}" -c "SELECT NOW() as current_time;" 2>/dev/null; then
            log $GREEN "✅ Database connection successful"
            
            echo ""
            log $CYAN "Table Summary:"
            psql -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "${DB_USER:-postgres}" -d "${DB_NAME:-skyraksys_hrm}" -c "
            SELECT 
                schemaname,
                tablename,
                tableowner
            FROM pg_tables 
            WHERE schemaname = 'public' 
            ORDER BY tablename;
            "
            
            echo ""
            log $CYAN "Data Summary:"
            psql -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "${DB_USER:-postgres}" -d "${DB_NAME:-skyraksys_hrm}" -c "
            SELECT 
                'Users' as table_name, COUNT(*) as record_count FROM users
            UNION ALL
            SELECT 
                'Employees' as table_name, COUNT(*) as record_count FROM employees
            UNION ALL
            SELECT 
                'Departments' as table_name, COUNT(*) as record_count FROM departments
            UNION ALL
            SELECT 
                'Projects' as table_name, COUNT(*) as record_count FROM projects
            UNION ALL
            SELECT 
                'Tasks' as table_name, COUNT(*) as record_count FROM tasks
            ORDER BY table_name;
            "
        else
            log $RED "❌ Database connection failed"
        fi
        ;;
    9)
        log $GREEN "Goodbye!"
        exit 0
        ;;
    *)
        log $RED "Invalid choice. Please try again."
        ;;
esac

echo ""
log $YELLOW "Database management completed."
echo ""
