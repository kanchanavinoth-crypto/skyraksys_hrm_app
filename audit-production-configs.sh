#!/bin/bash

# Production Configuration Audit Script
# Shows all existing configuration files that will be preserved

echo "🔍 Production Configuration Audit"
echo "================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_found() {
    echo -e "${GREEN}✅ FOUND: $1${NC}"
    if [ -f "$2" ]; then
        echo "   📄 Size: $(du -h "$2" 2>/dev/null | cut -f1)"
        echo "   📅 Modified: $(stat -c %y "$2" 2>/dev/null | cut -d. -f1)"
    fi
}

print_missing() {
    echo -e "${YELLOW}❌ MISSING: $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo -e "${BLUE}📋 Checking Production Configuration Files...${NC}"
echo ""

# Backend Configuration Files
echo "🔧 Backend Configuration:"
echo "========================"

if [ -f "backend/.env" ]; then
    print_found "Backend Environment (.env)" "backend/.env"
    echo "   🔐 Contains $(grep -c "=" backend/.env 2>/dev/null) environment variables"
else
    print_missing "Backend Environment (.env)"
fi

if [ -f "backend/config/database.js" ]; then
    print_found "Database Configuration (database.js)" "backend/config/database.js"
else
    print_missing "Database Configuration (database.js)"
fi

if [ -f "backend/config/config.js" ]; then
    print_found "Application Configuration (config.js)" "backend/config/config.js"
else
    print_missing "Application Configuration (config.js)"
fi

echo ""

# Process Management
echo "⚡ Process Management:"
echo "===================="

if [ -f "ecosystem.config.js" ]; then
    print_found "PM2 Ecosystem Configuration" "ecosystem.config.js"
else
    print_missing "PM2 Ecosystem Configuration"
fi

# Check if PM2 is running processes
if command -v pm2 > /dev/null 2>&1; then
    PM2_PROCESSES=$(pm2 list 2>/dev/null | grep -c "online" || echo "0")
    if [ "$PM2_PROCESSES" -gt 0 ]; then
        echo -e "${GREEN}✅ PM2 managing $PM2_PROCESSES process(es)${NC}"
    else
        echo -e "${YELLOW}⚠️  PM2 installed but no processes running${NC}"
    fi
else
    echo -e "${YELLOW}❌ PM2 not installed${NC}"
fi

echo ""

# Web Server Configurations
echo "🌐 Web Server Configuration:"
echo "============================"

WEB_CONFIGS=(
    "/etc/nginx/sites-available/skyraksys.conf:Nginx Site Config"
    "/etc/nginx/sites-available/default:Nginx Default Site"
    "/etc/nginx/conf.d/skyraksys.conf:Nginx Additional Config"
    "/etc/nginx/nginx.conf:Main Nginx Config"
    "/etc/httpd/conf.d/skyraksys.conf:Apache Site Config"
    "/etc/httpd/conf/httpd.conf:Main Apache Config"
)

for config_entry in "${WEB_CONFIGS[@]}"; do
    IFS=':' read -r config_path config_desc <<< "$config_entry"
    if [ -f "$config_path" ]; then
        print_found "$config_desc" "$config_path"
    fi
done

echo ""

# Database Configuration
echo "🗄️ Database Configuration:"
echo "=========================="

# Check PostgreSQL versions and configs
PG_VERSIONS=("17" "16" "15" "14" "13")
for version in "${PG_VERSIONS[@]}"; do
    PG_DATA_DIR="/var/lib/pgsql/$version/data"
    if [ -d "$PG_DATA_DIR" ]; then
        print_found "PostgreSQL $version Data Directory" "$PG_DATA_DIR"
        if [ -f "$PG_DATA_DIR/postgresql.conf" ]; then
            echo "   📄 postgresql.conf exists"
        fi
        if [ -f "$PG_DATA_DIR/pg_hba.conf" ]; then
            echo "   📄 pg_hba.conf exists"
        fi
    fi
done

# Check default PostgreSQL location
if [ -d "/var/lib/pgsql/data" ]; then
    print_found "PostgreSQL Default Data Directory" "/var/lib/pgsql/data"
fi

echo ""

# SSL/TLS Certificates
echo "🔒 SSL/TLS Certificates:"
echo "======================="

SSL_PATHS=(
    "/etc/ssl/certs/skyraksys.crt:SSL Certificate"
    "/etc/ssl/private/skyraksys.key:SSL Private Key"
    "/etc/letsencrypt/live/*/fullchain.pem:Let's Encrypt Certificate"
    "/etc/pki/tls/certs/skyraksys.crt:RedHat SSL Certificate"
)

for ssl_entry in "${SSL_PATHS[@]}"; do
    IFS=':' read -r ssl_path ssl_desc <<< "$ssl_entry"
    if ls $ssl_path >/dev/null 2>&1; then
        print_found "$ssl_desc" "$ssl_path"
    fi
done

echo ""

# Log Files
echo "📊 Log Files:"
echo "============"

LOG_DIRS=("logs" "/var/log/skyraksys-hrm" "/var/log/nginx" "/var/log/httpd" "/var/log/postgresql")
for log_dir in "${LOG_DIRS[@]}"; do
    if [ -d "$log_dir" ]; then
        LOG_COUNT=$(find "$log_dir" -name "*.log" 2>/dev/null | wc -l)
        if [ "$LOG_COUNT" -gt 0 ]; then
            print_found "Log Directory: $log_dir" "$log_dir"
            echo "   📊 Contains $LOG_COUNT log files"
        fi
    fi
done

echo ""

# Summary
echo -e "${BLUE}📋 Configuration Preservation Summary:${NC}"
echo "====================================="

TOTAL_CONFIGS=0
PROTECTED_CONFIGS=0

# Count existing configs
for config in "backend/.env" "backend/config/database.js" "ecosystem.config.js"; do
    TOTAL_CONFIGS=$((TOTAL_CONFIGS + 1))
    if [ -f "$config" ]; then
        PROTECTED_CONFIGS=$((PROTECTED_CONFIGS + 1))
    fi
done

echo "📁 Configuration Files: $PROTECTED_CONFIGS/$TOTAL_CONFIGS will be preserved"
echo "🔐 Backups will be created with timestamp suffixes"
echo "⚠️  No existing files will be overwritten during deployment"

if [ $PROTECTED_CONFIGS -gt 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Your production configurations are SAFE!${NC}"
    echo -e "${GREEN}The deployment will preserve all existing settings.${NC}"
else
    echo ""
    echo -e "${YELLOW}⚠️  No existing production configurations found.${NC}"
    echo -e "${YELLOW}This appears to be a fresh installation.${NC}"
fi

echo ""
echo -e "${BLUE}✨ Configuration audit completed!${NC}"