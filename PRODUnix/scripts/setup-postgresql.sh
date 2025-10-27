#!/bin/bash

# ============================================
# PostgreSQL Production Setup (Unix/Linux)
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

# Detect OS and package manager
detect_os() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS_ID=$ID
        OS_VERSION=$VERSION_ID
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS_ID="macos"
    else
        OS_ID="unknown"
    fi
}

echo ""
log $CYAN "[Database Setup] Setting up PostgreSQL for production..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo ""
    log $RED "❌ PostgreSQL is not installed."
    echo ""
    
    detect_os
    
    log $YELLOW "To install PostgreSQL:"
    case $OS_ID in
        ubuntu|debian)
            log $YELLOW "  sudo apt update"
            log $YELLOW "  sudo apt install postgresql postgresql-contrib"
            ;;
        centos|rhel|fedora)
            log $YELLOW "  sudo dnf install postgresql postgresql-server postgresql-contrib"
            log $YELLOW "  sudo postgresql-setup --initdb"
            log $YELLOW "  sudo systemctl enable postgresql"
            ;;
        arch)
            log $YELLOW "  sudo pacman -S postgresql"
            log $YELLOW "  sudo systemctl enable postgresql"
            ;;
        macos)
            log $YELLOW "  brew install postgresql"
            log $YELLOW "  brew services start postgresql"
            ;;
        *)
            log $YELLOW "  Please install PostgreSQL for your system"
            ;;
    esac
    echo ""
    
    read -p "Install PostgreSQL now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        case $OS_ID in
            ubuntu|debian)
                sudo apt update && sudo apt install -y postgresql postgresql-contrib
                ;;
            centos|rhel|fedora)
                sudo dnf install -y postgresql postgresql-server postgresql-contrib
                sudo postgresql-setup --initdb
                sudo systemctl enable postgresql
                sudo systemctl start postgresql
                ;;
            arch)
                sudo pacman -S postgresql
                sudo systemctl enable postgresql
                sudo systemctl start postgresql
                ;;
            macos)
                brew install postgresql
                brew services start postgresql
                ;;
            *)
                log $RED "Automatic installation not supported for your OS"
                exit 1
                ;;
        esac
        
        log $GREEN "✅ PostgreSQL installed"
    else
        log $YELLOW "Please install PostgreSQL manually and run this script again"
        exit 1
    fi
fi

log $GREEN "✅ PostgreSQL detected:"
psql --version

echo ""
echo "PostgreSQL setup options:"
echo "1. Create new local database"
echo "2. Connect to existing PostgreSQL server"
echo "3. Use Docker PostgreSQL (recommended)"
echo "4. Generate SQL scripts only (manual setup)"

read -p "Enter your choice (1-4): " pg_choice

setup_local_db() {
    echo ""
    log $CYAN "[Local Database Setup]"
    
    # Use environment variables if available (from main setup script)
    if [[ -n "$APP_DB_PASSWORD" && -n "$POSTGRES_ADMIN_PASSWORD" ]]; then
        db_name="skyraksys_hrm_prod"
        db_user="hrm_prod_user"
        db_password="$APP_DB_PASSWORD"
        postgres_password="$POSTGRES_ADMIN_PASSWORD"
        
        log $GREEN "✅ Using automatically generated passwords from setup"
    else
        # Manual password entry for standalone use
        echo "Please enter database configuration:"
        
        read -p "Database name [skyraksys_hrm_prod]: " db_name
        db_name=${db_name:-skyraksys_hrm_prod}
        
        read -p "Database user [hrm_prod_user]: " db_user
        db_user=${db_user:-hrm_prod_user}
        
        while true; do
            read -sp "Database password: " db_password
            echo
            if [[ -n "$db_password" ]]; then
                break
            fi
            log $RED "❌ Password cannot be empty"
        done
        
        while true; do
            read -sp "PostgreSQL admin password: " postgres_password
            echo
            if [[ -n "$postgres_password" ]]; then
                break
            fi
            log $RED "❌ PostgreSQL admin password cannot be empty"
        done
    fi
    
    echo ""
    log $YELLOW "Creating database and user with generated credentials..."
    
    cat > database/scripts/setup-database.sql << EOF
-- SkyRakSys HRM Production Database Setup
-- Run this script as PostgreSQL superuser

-- Create database
CREATE DATABASE $db_name;

-- Create user
CREATE USER $db_user WITH ENCRYPTED PASSWORD '$db_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $db_name TO $db_user;

-- Connect to the database
\c $db_name

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO $db_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $db_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $db_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $db_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $db_user;

-- Verify setup
SELECT current_database(), current_user;
EOF
    
    echo ""
    log $GREEN "✅ Database setup script created: database/scripts/setup-database.sql"
    echo ""
    
    log $YELLOW "To run the setup:"
    log $YELLOW "1. Connect to PostgreSQL as superuser:"
    log $YELLOW "   sudo -u postgres psql"
    log $YELLOW "2. Run the setup script:"
    log $YELLOW "   \\i database/scripts/setup-database.sql"
    echo ""
    
    # Try to run automatically if postgres user exists
    if id "postgres" &>/dev/null; then
        read -p "Try to run setup automatically? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log $YELLOW "Running database setup..."
            sudo -u postgres psql -f database/scripts/setup-database.sql
            if [[ $? -eq 0 ]]; then
                log $GREEN "✅ Database setup completed successfully"
            else
                log $RED "❌ Database setup failed. Please run manually."
            fi
        fi
    fi
    
    update_env_file "$db_name" "$db_user" "$db_password" "localhost" "5432"
}

setup_remote_db() {
    echo ""
    log $CYAN "[Remote Database Setup]"
    echo "Please enter your remote PostgreSQL server details:"
    
    read -p "Database host: " db_host
    read -p "Database port [5432]: " db_port
    db_port=${db_port:-5432}
    
    read -p "Database name: " db_name
    read -p "Database user: " db_user
    read -sp "Database password: " db_password
    echo
    
    echo ""
    log $YELLOW "Testing connection..."
    
    export PGPASSWORD="$db_password"
    if psql -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" -c "SELECT version();" &>/dev/null; then
        log $GREEN "✅ Database connection successful!"
        update_env_file "$db_name" "$db_user" "$db_password" "$db_host" "$db_port"
    else
        log $RED "❌ Failed to connect to database. Please check your credentials."
        setup_remote_db
    fi
}

setup_docker_db() {
    echo ""
    log $CYAN "[Docker PostgreSQL Setup]"
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log $RED "❌ Docker is not installed."
        
        detect_os
        log $YELLOW "Please install Docker:"
        case $OS_ID in
            ubuntu|debian)
                log $YELLOW "  curl -fsSL https://get.docker.com | sh"
                log $YELLOW "  sudo usermod -aG docker \$USER"
                ;;
            centos|rhel|fedora)
                log $YELLOW "  sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo"
                log $YELLOW "  sudo dnf install docker-ce docker-ce-cli containerd.io"
                log $YELLOW "  sudo systemctl enable docker"
                ;;
            arch)
                log $YELLOW "  sudo pacman -S docker docker-compose"
                log $YELLOW "  sudo systemctl enable docker"
                ;;
            macos)
                log $YELLOW "  brew install --cask docker"
                ;;
        esac
        exit 1
    fi
    
    log $GREEN "✅ Docker detected"
    
    # Create docker-compose for PostgreSQL
    log $YELLOW "Creating Docker PostgreSQL configuration..."
    
    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: skyraksys_hrm_postgres_prod
    environment:
      POSTGRES_DB: skyraksys_hrm_prod
      POSTGRES_USER: hrm_prod_user
      POSTGRES_PASSWORD: CHANGE_THIS_PASSWORD
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d
    restart: unless-stopped
    networks:
      - hrm_network

  # Optional: pgAdmin for database management
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: skyraksys_hrm_pgadmin_prod
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@yourdomain.com
      PGADMIN_DEFAULT_PASSWORD: admin123
    ports:
      - "8081:80"
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    depends_on:
      - postgres
    restart: unless-stopped
    networks:
      - hrm_network
    profiles:
      - tools

volumes:
  postgres_data:
    driver: local
  pgadmin_data:
    driver: local

networks:
  hrm_network:
    driver: bridge
EOF
    
    echo ""
    log $GREEN "✅ Docker configuration created: docker-compose.yml"
    echo ""
    
    log $YELLOW "⚠️  IMPORTANT: Update the POSTGRES_PASSWORD in docker-compose.yml"
    echo ""
    
    log $YELLOW "To start PostgreSQL:"
    log $YELLOW "  docker-compose up -d postgres"
    echo ""
    
    log $YELLOW "To start with pgAdmin:"
    log $YELLOW "  docker-compose --profile tools up -d"
    echo ""
    
    log $YELLOW "Access pgAdmin at: http://localhost:8081"
    echo ""
    
    read -p "Start PostgreSQL container now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose up -d postgres
        log $GREEN "✅ PostgreSQL container started"
        
        # Wait for PostgreSQL to be ready
        log $YELLOW "Waiting for PostgreSQL to be ready..."
        sleep 10
    fi
    
    update_env_file "skyraksys_hrm_prod" "hrm_prod_user" "CHANGE_THIS_PASSWORD" "localhost" "5432"
}

generate_sql_scripts() {
    echo ""
    log $CYAN "[SQL Scripts Generation]"
    log $YELLOW "Generating database setup scripts..."
    
    mkdir -p database/scripts
    
    # Create database creation script
    cat > database/scripts/01-create-database.sql << 'EOF'
-- ============================================
-- SkyRakSys HRM Production Database Setup
-- ============================================

-- Create database and user
CREATE DATABASE skyraksys_hrm_prod;
CREATE USER hrm_prod_user WITH ENCRYPTED PASSWORD 'CHANGE_THIS_PASSWORD';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE skyraksys_hrm_prod TO hrm_prod_user;

-- Connect to database
\c skyraksys_hrm_prod

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO hrm_prod_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO hrm_prod_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO hrm_prod_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO hrm_prod_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO hrm_prod_user;
EOF
    
    # Create backup script
    cat > database/scripts/02-backup-restore.sql << 'EOF'
-- ============================================
-- Database Backup Script
-- ============================================

-- Create backup
-- Run this command from terminal:
-- pg_dump -h localhost -U hrm_prod_user -d skyraksys_hrm_prod > backup_$(date +%Y%m%d_%H%M%S).sql

-- Restore from backup:
-- psql -h localhost -U hrm_prod_user -d skyraksys_hrm_prod < backup_file.sql
EOF
    
    # Create maintenance script
    cat > database/scripts/03-maintenance.sql << 'EOF'
-- ============================================
-- Database Maintenance Script
-- ============================================

-- Analyze tables for performance
ANALYZE;

-- Vacuum tables
VACUUM;

-- Reindex all tables
REINDEX DATABASE skyraksys_hrm_prod;

-- Check database size
SELECT pg_size_pretty(pg_database_size('skyraksys_hrm_prod')) as database_size;

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
EOF
    
    # Create backup shell script
    cat > database/scripts/backup.sh << 'EOF'
#!/bin/bash

# Database backup script
DB_NAME="skyraksys_hrm_prod"
DB_USER="hrm_prod_user"
DB_HOST="localhost"
BACKUP_DIR="database/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

echo "Creating backup..."
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

if [[ $? -eq 0 ]]; then
    echo "✅ Backup created: $BACKUP_DIR/backup_$DATE.sql"
    
    # Compress backup
    gzip $BACKUP_DIR/backup_$DATE.sql
    echo "✅ Backup compressed: $BACKUP_DIR/backup_$DATE.sql.gz"
    
    # Remove old backups (keep 30 days)
    find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
    echo "✅ Old backups cleaned up"
else
    echo "❌ Backup failed"
    exit 1
fi
EOF
    
    chmod +x database/scripts/backup.sh
    
    log $GREEN "✅ SQL scripts generated in database/scripts/:"
    log $GREEN "  - 01-create-database.sql"
    log $GREEN "  - 02-backup-restore.sql"
    log $GREEN "  - 03-maintenance.sql"
    log $GREEN "  - backup.sh (executable)"
    echo ""
    
    log $YELLOW "Manual setup required:"
    log $YELLOW "1. Run 01-create-database.sql as PostgreSQL superuser"
    log $YELLOW "2. Update environment files with your database credentials"
    echo ""
}

update_env_file() {
    local db_name=$1
    local db_user=$2
    local db_password=$3
    local db_host=$4
    local db_port=$5
    
    echo ""
    log $YELLOW "Updating environment file..."
    
    # Update the backend .env.production file
    sed -i "s/DB_NAME=.*/DB_NAME=$db_name/" backend/.env.production
    sed -i "s/DB_USER=.*/DB_USER=$db_user/" backend/.env.production
    sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$db_password/" backend/.env.production
    sed -i "s/DB_HOST=.*/DB_HOST=$db_host/" backend/.env.production
    sed -i "s/DB_PORT=.*/DB_PORT=$db_port/" backend/.env.production
    
    log $GREEN "✅ Environment file updated with database configuration"
}

# Main execution
case $pg_choice in
    1)
        setup_local_db
        ;;
    2)
        setup_remote_db
        ;;
    3)
        setup_docker_db
        ;;
    4)
        generate_sql_scripts
        ;;
    *)
        log $RED "Invalid choice"
        exit 1
        ;;
esac

echo ""
log $CYAN "[Database Setup Complete]"
echo ""

log $YELLOW "Next steps:"
log $YELLOW "1. Verify database connection"
log $YELLOW "2. Run database migrations: cd backend && npm run migrate"
log $YELLOW "3. Seed initial data: cd backend && npm run seed"
echo ""

log $YELLOW "Database connection test:"
log $YELLOW "  cd backend"
log $YELLOW "  node -e \"const {sequelize} = require('./models'); sequelize.authenticate().then(() => console.log('✅ Database connected')).catch(err => console.error('❌ Database error:', err));\""
echo ""
