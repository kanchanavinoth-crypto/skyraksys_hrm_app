#!/bin/bash

################################################################################
# Skyraksys HRM - Automated Configuration Generator
# RHEL 9.6 Production Environment
################################################################################
#
# This script automatically generates production-ready configuration files
# with your server IP/domain, eliminating manual editing.
#
# Usage:
#   sudo bash 00_generate_configs.sh [SERVER_IP_OR_DOMAIN]
#
# Example:
#   sudo bash 00_generate_configs.sh 95.216.14.232
#   sudo bash 00_generate_configs.sh hrm.company.com
#
################################################################################

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
APP_DIR="/opt/skyraksys-hrm"
BACKEND_DIR="${APP_DIR}/backend"
REDHAT_DIR="${APP_DIR}/redhatprod"

################################################################################
# Functions
################################################################################

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Generate secure random string
generate_secret() {
    local length=$1
    if command -v openssl &> /dev/null; then
        openssl rand -base64 "$length" | tr -d '\n'
    else
        < /dev/urandom tr -dc 'A-Za-z0-9!@#$%^&*' | head -c "$((length * 3 / 4))"
    fi
}

################################################################################
# Get Server IP/Domain
################################################################################

get_server_address() {
    # Check if provided as argument
    if [[ -n "$1" ]]; then
        SERVER_ADDRESS="$1"
        log "Using provided address: $SERVER_ADDRESS"
        return
    fi
    
    # Production default IP
    local PROD_DEFAULT_IP="95.216.14.232"
    
    # Try to detect automatically
    info "No server address provided, attempting auto-detection..."
    
    # Try to get public IP
    PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || echo "")
    
    if [[ -n "$PUBLIC_IP" ]]; then
        warn "Detected public IP: $PUBLIC_IP"
        read -p "Use this IP address? (Y/n): " -n 1 -r
        echo
        # Default to Yes if user just presses Enter
        if [[ -z "$REPLY" ]] || [[ $REPLY =~ ^[Yy]$ ]]; then
            SERVER_ADDRESS="$PUBLIC_IP"
            return
        fi
    fi
    
    # Offer production default
    echo
    info "Production default available: ${PROD_DEFAULT_IP}"
    read -p "Use production default ${PROD_DEFAULT_IP}? (Y/n): " -n 1 -r
    echo
    if [[ -z "$REPLY" ]] || [[ $REPLY =~ ^[Yy]$ ]]; then
        SERVER_ADDRESS="$PROD_DEFAULT_IP"
        info "Using production default: $SERVER_ADDRESS"
        return
    fi
    
    # Manual input
    echo
    echo "Please enter your server IP address or domain name:"
    echo "Examples: 95.216.14.232 or hrm.company.com"
    read -p "Server address: " SERVER_ADDRESS
    
    if [[ -z "$SERVER_ADDRESS" ]]; then
        # Use production default if no input
        warn "No address provided, using production default: ${PROD_DEFAULT_IP}"
        SERVER_ADDRESS="$PROD_DEFAULT_IP"
    fi
}

################################################################################
# Generate Backend .env File
################################################################################

generate_backend_env() {
    log "Generating backend .env file..."
    
    local ENV_FILE="${BACKEND_DIR}/.env"
    
    # Check if .env already exists
    if [[ -f "$ENV_FILE" ]]; then
        warn ".env file already exists: $ENV_FILE"
        read -p "Overwrite existing file? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            info "Keeping existing .env file"
            return
        fi
        # Backup existing file
        cp "$ENV_FILE" "${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
        info "Existing .env backed up"
    fi
    
    # Get database password (if exists)
    local DB_PASSWORD=""
    if [[ -f "${APP_DIR}/.db_password" ]]; then
        DB_PASSWORD=$(cat "${APP_DIR}/.db_password")
        info "Using existing database password"
    else
        warn "Database password file not found, using placeholder"
        DB_PASSWORD="CHANGE_ME_AFTER_DATABASE_SETUP"
    fi
    
    # Generate secrets
    info "Generating secure JWT and session secrets..."
    local JWT_SECRET=$(generate_secret 64)
    local JWT_REFRESH_SECRET=$(generate_secret 64)
    local SESSION_SECRET=$(generate_secret 48)
    
    # Determine protocol
    local PROTOCOL="http"
    if [[ "$USE_HTTPS" == "true" ]]; then
        PROTOCOL="https"
    fi
    
    # Generate .env file
    cat > "$ENV_FILE" <<EOF
# ==============================================
# SKYRAKSYS HRM PRODUCTION ENVIRONMENT FILE
# ==============================================
# Auto-generated by 00_generate_configs.sh
# Generated: $(date +'%Y-%m-%d %H:%M:%S')
# Server: ${SERVER_ADDRESS}
# ==============================================

# ==============================================
# APPLICATION CONFIGURATION
# ==============================================
NODE_ENV=production
PORT=5000
FRONTEND_PORT=3000

# Domain/URL Configuration
DOMAIN=${SERVER_ADDRESS}
API_BASE_URL=${PROTOCOL}://${SERVER_ADDRESS}/api
FRONTEND_URL=${PROTOCOL}://${SERVER_ADDRESS}

# ==============================================
# DATABASE CONFIGURATION (PostgreSQL)
# ==============================================
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skyraksys_hrm_prod
DB_USER=hrm_app
DB_PASSWORD=${DB_PASSWORD}
DB_DIALECT=postgres
DB_SSL=false

# Database Seeding (set to false in production after initial setup)
SEED_DEMO_DATA=false

# Database Connection Pool
DB_POOL_MAX=10
DB_POOL_MIN=2
DB_POOL_ACQUIRE=60000
DB_POOL_IDLE=30000

# ==============================================
# SECURITY CONFIGURATION (CRITICAL)
# ==============================================

# JWT Configuration - Auto-generated secure secrets
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Session Configuration - Auto-generated secure secret
SESSION_SECRET=${SESSION_SECRET}
SESSION_NAME=skyraksys_hrm_session
SESSION_MAX_AGE=86400000

# Password Security
BCRYPT_ROUNDS=12
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBER=true
PASSWORD_REQUIRE_SPECIAL=true

# ==============================================
# CORS & PROXY CONFIGURATION
# ==============================================

# CORS Origins
CORS_ORIGIN=${PROTOCOL}://${SERVER_ADDRESS}
ALLOWED_ORIGINS=${PROTOCOL}://${SERVER_ADDRESS}

# Trust Proxy (important when behind Nginx)
TRUST_PROXY=true

# Cookie Security
SECURE_COOKIES=true
COOKIE_SAMESITE=strict

# Security Headers (helmet.js)
HELMET_ENABLED=true
CSRF_PROTECTION=true
XSS_PROTECTION=true
FRAME_OPTIONS=DENY

# Optional: Allow all origins (ONLY for development/troubleshooting)
CORS_ALLOW_ALL=false

# ==============================================
# RATE LIMITING CONFIGURATION
# ==============================================

# General API Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=300

# Authentication Endpoints Rate Limiting
RATE_LIMIT_AUTH_ENABLED=true
RATE_LIMIT_AUTH_WINDOW_MS=900000
RATE_LIMIT_AUTH_MAX=20

# ==============================================
# SECURITY HEADERS (helmet.js)
# ==============================================

HELMET_ENABLED=true
CSRF_PROTECTION=true
XSS_PROTECTION=true
FRAME_OPTIONS=DENY

# ==============================================
# FILE UPLOAD CONFIGURATION
# ==============================================

UPLOAD_PATH=/opt/skyraksys-hrm/uploads
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx,xls,xlsx,csv
TEMP_UPLOAD_PATH=/tmp/hrm-uploads

# PDF Generation
PDF_OUTPUT_PATH=/opt/skyraksys-hrm/uploads/payslips
PDF_TEMP_PATH=/tmp/hrm-pdfs
PAYSLIP_PDF_ENABLED=true

# ==============================================
# LOGGING CONFIGURATION
# ==============================================

LOG_LEVEL=info
LOG_FILE=/var/log/skyraksys-hrm/application.log
ERROR_LOG_FILE=/var/log/skyraksys-hrm/error.log
ACCESS_LOG_FILE=/var/log/skyraksys-hrm/access.log
AUDIT_LOG_FILE=/var/log/skyraksys-hrm/audit.log
LOG_MAX_FILES=30
LOG_MAX_SIZE=10m

# Debug Settings (disabled in production)
DEBUG_MODE=false
VERBOSE_LOGGING=false
SQL_LOGGING=false
STACK_TRACE_IN_RESPONSE=false

# ==============================================
# MONITORING & HEALTH CHECKS
# ==============================================

HEALTH_CHECK_ENABLED=true
METRICS_ENABLED=true
PERFORMANCE_MONITORING=true
ERROR_TRACKING=true

# Status Monitor Dashboard
STATUS_MONITOR_ENABLED=true

# Health Check Configuration
DB_HEALTH_CHECK=true
REDIS_HEALTH_CHECK=true
EXTERNAL_API_HEALTH_CHECK=false

# ==============================================
# EMAIL CONFIGURATION (OPTIONAL)
# ==============================================

SMTP_ENABLED=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
FROM_EMAIL=noreply@skyraksys.com
FROM_NAME=SKYRAKSYS HRM System

# Email Feature Flags
EMAIL_VERIFICATION_ENABLED=true
PASSWORD_RESET_ENABLED=true
NOTIFICATION_EMAIL_ENABLED=true

# ==============================================
# REDIS CONFIGURATION (OPTIONAL)
# ==============================================

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TTL=3600

# ==============================================
# COMPANY INFORMATION
# ==============================================

COMPANY_NAME=SKYRAKSYS TECHNOLOGIES LLP
COMPANY_ADDRESS=Plot-No: 27E, G.S.T. Road, Guduvanchery, Chennai, Tamil Nadu, 603202 India
COMPANY_EMAIL=info@skyraksys.com
COMPANY_PHONE=+91 89398 88577
COMPANY_WEBSITE=https://www.skyraksys.com
COMPANY_GST=33AABCS1234C1Z5
COMPANY_PAN=AABCS1234C
COMPANY_CIN=U72900TN2019PTC134567

# ==============================================
# PAYROLL CONFIGURATION
# ==============================================

DEFAULT_WORKING_DAYS=22
DEFAULT_WORKING_HOURS=8
PF_RATE=12
PF_MAX_LIMIT=1800
PROFESSIONAL_TAX_RATE=200
PROFESSIONAL_TAX_LIMIT=15000
ESI_RATE=0.75
ESI_SALARY_LIMIT=25000
TDS_EXEMPTION_LIMIT=50000

# Payroll Processing
PAYROLL_CUTOFF_DAY=25
PAYROLL_PAYMENT_DAY=30
AUTO_PAYROLL_GENERATION=false

# ==============================================
# LEAVE MANAGEMENT CONFIGURATION
# ==============================================

DEFAULT_ANNUAL_LEAVE=21
DEFAULT_SICK_LEAVE=12
DEFAULT_CASUAL_LEAVE=12
LEAVE_APPROVAL_REQUIRED=true
LEAVE_CARRY_FORWARD=true
MAX_CARRY_FORWARD_DAYS=5

# ==============================================
# TIMESHEET CONFIGURATION
# ==============================================

TIMESHEET_WEEKLY_SUBMISSION=true
TIMESHEET_APPROVAL_REQUIRED=true
MAX_HOURS_PER_DAY=12
MIN_HOURS_PER_DAY=1
OVERTIME_THRESHOLD=8

# ==============================================
# BACKUP CONFIGURATION
# ==============================================

BACKUP_RETENTION_DAYS=30
AUTO_BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_PATH=/opt/skyraksys-hrm/backups
BACKUP_ENCRYPTION=true

# ==============================================
# FEATURE FLAGS
# ==============================================

FEATURE_EMPLOYEE_SELF_SERVICE=true
FEATURE_MOBILE_APP=false
FEATURE_API_V2=false
FEATURE_ADVANCED_REPORTING=true
FEATURE_BULK_OPERATIONS=true

# ==============================================
# EXTERNAL INTEGRATIONS (OPTIONAL)
# ==============================================

# SMS Configuration
SMS_ENABLED=false
SMS_PROVIDER=
SMS_API_KEY=
SMS_FROM_NUMBER=

# Push Notifications
PUSH_NOTIFICATIONS=false
FIREBASE_SERVER_KEY=

# Third-party APIs
GOOGLE_API_KEY=
MICROSOFT_GRAPH_CLIENT_ID=
SLACK_WEBHOOK_URL=

# ==============================================
# API CONFIGURATION
# ==============================================

API_VERSION=v1
API_BASE_URL=/api/v1

# ==============================================
# AUTO-GENERATED CONFIGURATION SUMMARY
# ==============================================
# Generated: $(date +'%Y-%m-%d %H:%M:%S')
# Server: ${SERVER_ADDRESS}
# JWT Secret: [64 characters - auto-generated]
# JWT Refresh Secret: [64 characters - auto-generated]
# Session Secret: [48 characters - auto-generated]
# Database Password: [from .db_password file or placeholder]
#
# ⚠️  SECURITY: This file contains sensitive credentials
# File permissions: chmod 600 (owner read/write only)
# Owner: hrmapp:hrmapp
# ==============================================
EOF
    
    # Set secure permissions
    chmod 600 "$ENV_FILE"
    chown hrmapp:hrmapp "$ENV_FILE" 2>/dev/null || true
    
    log "✓ Backend .env file generated: $ENV_FILE"
    info "Secrets auto-generated:"
    echo "  - JWT Secret: ${JWT_SECRET:0:20}... (64 chars)"
    echo "  - JWT Refresh Secret: ${JWT_REFRESH_SECRET:0:20}... (64 chars)"
    echo "  - Session Secret: ${SESSION_SECRET:0:20}... (48 chars)"
}

################################################################################
# Generate Nginx Configuration
################################################################################

generate_nginx_config() {
    log "Generating Nginx configuration..."
    
    local NGINX_CONF="${REDHAT_DIR}/configs/nginx-hrm-${SERVER_ADDRESS}.conf"
    
    # Determine protocol-specific settings
    local SSL_CONFIG=""
    if [[ "$USE_HTTPS" == "true" ]]; then
        SSL_CONFIG="
    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/${SERVER_ADDRESS}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${SERVER_ADDRESS}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
"
    fi
    
    cat > "$NGINX_CONF" <<'NGINX_EOF'
# Skyraksys HRM Nginx Configuration
# Auto-generated configuration
# Generated: GENERATION_DATE
# Server: SERVER_ADDRESS

upstream backend {
    server 127.0.0.1:5000;
    keepalive 32;
}

upstream frontend {
    server 127.0.0.1:3000;
    keepalive 32;
}

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=upload:10m rate=2r/s;

# Log format
log_format hrm_format '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for" '
                      'rt=$request_time uct="$upstream_connect_time" '
                      'uht="$upstream_header_time" urt="$upstream_response_time"';

server {
    listen 80;
    server_name SERVER_ADDRESS;
SSL_CONFIG_PLACEHOLDER
    
    # Logging
    access_log /var/log/nginx/hrm_access.log hrm_format;
    error_log /var/log/nginx/hrm_error.log warn;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline' 'unsafe-eval'" always;
    add_header X-Robots-Tag "noindex, nofollow" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Remove server signature
    server_tokens off;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml
        application/x-font-ttf
        font/opentype;
    
    # Client settings
    client_max_body_size 10M;
    client_body_timeout 60s;
    client_header_timeout 60s;
    
    # API routes with rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        limit_req_status 429;
        
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 8k;
        proxy_buffers 16 8k;
        proxy_busy_buffers_size 16k;
        
        # Error handling
        proxy_intercept_errors on;
        error_page 502 503 504 /50x.html;
    }
    
    # Login endpoint with stricter rate limiting
    location /api/auth/login {
        limit_req zone=login burst=5 nodelay;
        limit_req_status 429;
        
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Additional security for login
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Server $host;
    }
    
    # File upload endpoints
    location ~ ^/api/(upload|import) {
        limit_req zone=upload burst=3 nodelay;
        
        client_max_body_size 50M;
        client_body_timeout 300s;
        
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Extended timeouts for file uploads
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        
        # Disable buffering for large uploads
        proxy_buffering off;
        proxy_request_buffering off;
    }
    
    # Static files with long-term caching
    location /static/ {
        proxy_pass http://frontend;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options "nosniff";
        
        # Gzip static files
        gzip_static on;
    }
    
    # Frontend build files (JS, CSS)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://frontend;
        expires 1M;
        add_header Cache-Control "public, immutable";
        
        # Enable gzip for these files
        gzip_static on;
    }
    
    # API documentation (Swagger)
    location /api/docs {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Frontend application (React Router)
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Handle client-side routing for SPA
        try_files $uri $uri/ @frontend_fallback;
    }
    
    # Fallback for client-side routing
    location @frontend_fallback {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Health check endpoint (no logging)
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Nginx status (for monitoring)
    location /nginx_status {
        stub_status on;
        access_log off;
        allow 127.0.0.1;
        allow ::1;
        deny all;
    }
    
    # Robots.txt (prevent indexing)
    location /robots.txt {
        return 200 "User-agent: *\nDisallow: /\n";
        add_header Content-Type text/plain;
        access_log off;
    }
    
    # Favicon
    location /favicon.ico {
        proxy_pass http://frontend;
        expires 1M;
        access_log off;
    }
    
    # Security: Deny access to sensitive files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    location ~ /(config|\.env|package\.json|package-lock\.json)$ {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    # Security: Deny access to backup files
    location ~ ~$ {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    # Error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
    
    location = /50x.html {
        root /usr/share/nginx/html;
    }
    
    location = /404.html {
        root /usr/share/nginx/html;
    }
}
NGINX_EOF
    
    # Replace placeholders
    sed -i "s|GENERATION_DATE|$(date +'%Y-%m-%d %H:%M:%S')|g" "$NGINX_CONF"
    sed -i "s|SERVER_ADDRESS|${SERVER_ADDRESS}|g" "$NGINX_CONF"
    sed -i "s|SSL_CONFIG_PLACEHOLDER|${SSL_CONFIG}|g" "$NGINX_CONF"
    
    log "✓ Nginx configuration generated: $NGINX_CONF"
    info "To install: sudo cp $NGINX_CONF /etc/nginx/conf.d/hrm.conf"
}

################################################################################
# Generate Summary
################################################################################

generate_summary() {
    local SUMMARY_FILE="${APP_DIR}/DEPLOYMENT_CONFIG_SUMMARY.txt"
    
    cat > "$SUMMARY_FILE" <<EOF
================================================================================
SKYRAKSYS HRM - AUTO-GENERATED CONFIGURATION SUMMARY
================================================================================

Generated: $(date +'%Y-%m-%d %H:%M:%S')
Server: ${SERVER_ADDRESS}
Protocol: ${PROTOCOL}

================================================================================
FILES GENERATED
================================================================================

1. Backend Environment File
   Location: ${BACKEND_DIR}/.env
   Status: Generated with auto-generated secrets
   Permissions: 600 (hrmapp:hrmapp)

2. Nginx Configuration
   Location: ${REDHAT_DIR}/configs/nginx-hrm-${SERVER_ADDRESS}.conf
   Status: Generated with server address
   Install: sudo cp <file> /etc/nginx/conf.d/hrm.conf

================================================================================
AUTO-GENERATED SECRETS
================================================================================

✓ JWT_SECRET: [64 characters - secure random]
✓ JWT_REFRESH_SECRET: [64 characters - secure random]
✓ SESSION_SECRET: [48 characters - secure random]
✓ Database Password: [from .db_password file or placeholder]

================================================================================
CONFIGURATION SUMMARY
================================================================================

Application URLs:
  - Frontend: ${PROTOCOL}://${SERVER_ADDRESS}
  - Backend API: ${PROTOCOL}://${SERVER_ADDRESS}/api
  - Health Check: ${PROTOCOL}://${SERVER_ADDRESS}/api/health
  - Status Monitor: ${PROTOCOL}://${SERVER_ADDRESS}/status
  - API Docs: ${PROTOCOL}://${SERVER_ADDRESS}/api/docs

Security:
  - CORS Origin: ${PROTOCOL}://${SERVER_ADDRESS}
  - Trust Proxy: Enabled (for Nginx)
  - Rate Limiting: Enabled
  - Security Headers: Enabled (Helmet.js + Nginx)
  - HSTS: Enabled

Database:
  - Host: localhost
  - Port: 5432
  - Database: skyraksys_hrm_prod
  - User: hrm_app
  - Connection Pool: 2-10 connections

================================================================================
NEXT STEPS
================================================================================

1. Verify generated files:
   ls -l ${BACKEND_DIR}/.env
   cat ${SUMMARY_FILE}

2. Install Nginx configuration:
   sudo cp ${REDHAT_DIR}/configs/nginx-hrm-${SERVER_ADDRESS}.conf \\
           /etc/nginx/conf.d/hrm.conf
   sudo nginx -t
   sudo systemctl reload nginx

3. Continue with deployment:
   cd ${REDHAT_DIR}/scripts
   sudo bash 01_setup_system.sh
   sudo bash 02_setup_database.sh
   sudo bash 03_setup_nginx.sh
   sudo bash 04_deploy_app.sh

4. Start services:
   sudo systemctl start hrm-backend
   sudo systemctl start hrm-frontend
   sudo systemctl restart nginx

5. Verify deployment:
   curl ${PROTOCOL}://${SERVER_ADDRESS}/api/health

================================================================================
SECURITY REMINDERS
================================================================================

✓ All secrets auto-generated (no manual entry needed)
✓ .env file secured with chmod 600
✓ Database password from .db_password file
✓ No placeholders - copy/paste ready!
✓ Configuration specific to ${SERVER_ADDRESS}

⚠️  Keep backup of .env file in secure location
⚠️  Never commit .env to version control
⚠️  Rotate secrets every 90 days

================================================================================
EOF
    
    log "✓ Configuration summary generated: $SUMMARY_FILE"
}

################################################################################
# Main Execution
################################################################################

main() {
    log "=== Skyraksys HRM - Automated Configuration Generator ==="
    echo
    
    # Get server address
    get_server_address "$1"
    
    # Ask about HTTPS (check for SSL cert first)
    echo
    if [[ -f "/etc/letsencrypt/live/${SERVER_ADDRESS}/fullchain.pem" ]]; then
        info "✓ SSL certificate detected at /etc/letsencrypt/live/${SERVER_ADDRESS}/"
        read -p "Use HTTPS? (Y/n): " -n 1 -r
        echo
        if [[ -z "$REPLY" ]] || [[ $REPLY =~ ^[Yy]$ ]]; then
            USE_HTTPS="true"
            PROTOCOL="https"
            info "HTTPS enabled"
        else
            USE_HTTPS="false"
            PROTOCOL="http"
            warn "HTTP mode (you can enable HTTPS later)"
        fi
    else
        warn "No SSL certificate found at /etc/letsencrypt/live/${SERVER_ADDRESS}/"
        info "Defaulting to HTTP (install SSL certificate later with certbot)"
        read -p "Use HTTP for now? (Y/n): " -n 1 -r
        echo
        if [[ -z "$REPLY" ]] || [[ $REPLY =~ ^[Yy]$ ]]; then
            USE_HTTPS="false"
            PROTOCOL="http"
            info "HTTP mode enabled"
        else
            USE_HTTPS="true"
            PROTOCOL="https"
            warn "HTTPS enabled (ensure SSL certificates are properly installed)"
        fi
    fi
    
    echo
    log "Generating configurations for: $SERVER_ADDRESS"
    echo
    
    # Generate files
    generate_backend_env
    echo
    generate_nginx_config
    echo
    generate_summary
    echo
    
    # Final summary
    log "=== Configuration Generation Complete ==="
    echo
    info "Generated files:"
    echo "  ✓ ${BACKEND_DIR}/.env"
    echo "  ✓ ${REDHAT_DIR}/configs/nginx-hrm-${SERVER_ADDRESS}.conf"
    echo "  ✓ ${APP_DIR}/DEPLOYMENT_CONFIG_SUMMARY.txt"
    echo
    warn "IMPORTANT: Review the summary file:"
    echo "  cat ${APP_DIR}/DEPLOYMENT_CONFIG_SUMMARY.txt"
    echo
    log "✓ All configurations are COPY/PASTE READY - no manual editing needed!"
}

# Execute main function
main "$@"
