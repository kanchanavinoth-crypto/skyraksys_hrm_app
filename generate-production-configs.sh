#!/bin/bash

# =============================================================================
# Production Configuration Template Generator v2.0
# =============================================================================
# Creates production-ready configuration files from RedHat PROD templates
# with server-specific customizations

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_header() {
    echo -e "${CYAN}$1${NC}"
    echo "$(printf '=%.0s' {1..80})"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Server-specific configuration
SERVER_IP=""
DOMAIN_NAME=""
DB_HOST=""
DB_PASSWORD=""
JWT_SECRET=""
SESSION_SECRET=""

collect_server_info() {
    print_header "🖥️ Server Information Collection"
    
    # Get server IP automatically
    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
    
    echo "Detected server IP: $SERVER_IP"
    echo "Enter domain name (or press Enter to use IP): "
    read -r domain_input
    DOMAIN_NAME="${domain_input:-$SERVER_IP}"
    
    echo "Enter database host (default: localhost): "
    read -r db_host_input
    DB_HOST="${db_host_input:-localhost}"
    
    echo "Enter database password (or press Enter to generate): "
    read -s db_pass_input
    if [ -z "$db_pass_input" ]; then
        DB_PASSWORD="SkyRakDB#$(date +%Y)!Prod@HRM\$Secure"
    else
        DB_PASSWORD="$db_pass_input"
    fi
    
    echo ""
    echo "Generating secure secrets..."
    JWT_SECRET="SkyRak$(date +%Y)JWT@Prod!Secret$(openssl rand -hex 8)"
    SESSION_SECRET="SkyRak$(date +%Y)Session@Secret$(openssl rand -hex 8)"
    
    print_success "Server information collected"
}

generate_backend_env() {
    local target_file="backend/.env.production"
    
    print_info "Generating backend environment configuration"
    
    cat > "$target_file" << EOF
# Production Environment Configuration
# Generated: $(date)
# Server: $DOMAIN_NAME

# ==========================================
# SERVER CONFIGURATION
# ==========================================
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# API Configuration
API_BASE_URL=http://$DOMAIN_NAME/api
DOMAIN=$DOMAIN_NAME

# ==========================================
# DATABASE CONFIGURATION
# ==========================================
DB_HOST=$DB_HOST
DB_PORT=5432
DB_NAME=skyraksys_hrm_prod
DB_USER=skyraksys_user
DB_PASSWORD=$DB_PASSWORD
DB_SSL=false

# Connection Pool Settings
DB_POOL_MIN=5
DB_POOL_MAX=20
DB_POOL_ACQUIRE=60000
DB_POOL_IDLE=30000

# ==========================================
# SECURITY CONFIGURATION
# ==========================================
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=8h
BCRYPT_ROUNDS=12
SESSION_SECRET=$SESSION_SECRET

# CORS Settings
CORS_ORIGIN=http://$DOMAIN_NAME

# ==========================================
# MONITORING & PERFORMANCE
# ==========================================
# Status Monitor (enabled for RHEL)
ENABLE_STATUS_MONITOR=true

# Logging
LOG_LEVEL=info
LOG_FILE=true
LOG_MAX_FILES=5
LOG_MAX_SIZE=10m

# File Upload Settings
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10mb

# Email Configuration (optional)
EMAIL_ENABLED=false
EMAIL_HOST=
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=noreply@$DOMAIN_NAME

# Redis Configuration (optional)
REDIS_ENABLED=false
REDIS_HOST=localhost
REDIS_PORT=6379

# Performance Monitoring
PERFORMANCE_MONITORING=true
METRICS_COLLECTION=true

# Security Headers
HELMET_ENABLED=true
CSRF_PROTECTION=true

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# ==========================================
# RHEL SPECIFIC SETTINGS
# ==========================================
# System paths
SYSTEM_LOG_PATH=/var/log/skyraksys-hrm
SYSTEM_PID_PATH=/var/run/skyraksys-hrm

# Process Settings
PM2_INSTANCES=2
PM2_MAX_MEMORY=1G
PM2_MAX_RESTARTS=10

# Backup Settings
BACKUP_ENABLED=true
BACKUP_PATH=/opt/skyraksys-hrm/backups
BACKUP_RETENTION_DAYS=30
EOF

    chmod 600 "$target_file"
    print_success "Backend environment created: $target_file"
}

generate_frontend_env() {
    local target_file="frontend/.env.production"
    
    print_info "Generating frontend environment configuration"
    
    cat > "$target_file" << EOF
# Frontend Production Configuration
# Generated: $(date)
# Server: $DOMAIN_NAME

# API Configuration
REACT_APP_API_URL=http://$DOMAIN_NAME/api
REACT_APP_BASE_URL=http://$DOMAIN_NAME

# App Configuration
REACT_APP_NAME=SkyrakSys HRM
REACT_APP_VERSION=2.0.0
REACT_APP_ENVIRONMENT=production

# Features
REACT_APP_ENABLE_PERFORMANCE_MONITOR=true
REACT_APP_ENABLE_PWA=true
REACT_APP_ENABLE_OFFLINE=false

# Security
REACT_APP_ENABLE_HTTPS_REDIRECT=false
REACT_APP_SECURE_COOKIES=false

# Performance
REACT_APP_ENABLE_SERVICE_WORKER=true
REACT_APP_CACHE_ENABLED=true

# Build Configuration
GENERATE_SOURCEMAP=false
BUILD_PATH=build
PUBLIC_URL=/

# Error Tracking (optional)
REACT_APP_SENTRY_DSN=
REACT_APP_ERROR_TRACKING=false

# Analytics (optional)
REACT_APP_GOOGLE_ANALYTICS=
REACT_APP_ANALYTICS_ENABLED=false
EOF

    chmod 644 "$target_file"
    print_success "Frontend environment created: $target_file"
}

generate_nginx_config() {
    local target_file="nginx-hrm.production.conf"
    local reference_file="redhatprod/configs/nginx-hrm.conf"
    
    print_info "Generating Nginx configuration"
    
    if [ -f "$reference_file" ]; then
        # Copy reference and customize
        cp "$reference_file" "$target_file"
        
        # Replace server name
        sed -i "s/server_name .*/server_name $DOMAIN_NAME;/" "$target_file"
        
        # Update log paths if needed
        sed -i "s|/var/log/nginx/hrm_|/var/log/nginx/skyraksys_hrm_|g" "$target_file"
        
        print_success "Nginx configuration created: $target_file"
        print_info "Copy to: /etc/nginx/sites-available/skyraksys.conf"
    else
        print_warning "Reference nginx config not found, creating basic version"
        
        cat > "$target_file" << EOF
# SkyrakSys HRM Nginx Configuration
# Generated: $(date)
# Server: $DOMAIN_NAME

upstream backend {
    server 127.0.0.1:5000;
    keepalive 32;
}

server {
    listen 80;
    server_name $DOMAIN_NAME;
    
    # Logging
    access_log /var/log/nginx/skyraksys_hrm_access.log;
    error_log /var/log/nginx/skyraksys_hrm_error.log warn;
    
    # API Proxy
    location /api/ {
        proxy_pass http://backend/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Static files
    location / {
        root /var/www/html;
        try_files \$uri \$uri/ /index.html;
        index index.html;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
}
EOF
        print_success "Basic Nginx configuration created: $target_file"
    fi
}

generate_ecosystem_config() {
    local target_file="ecosystem.production.config.js"
    
    print_info "Generating PM2 ecosystem configuration"
    
    cat > "$target_file" << EOF
// SkyrakSys HRM PM2 Ecosystem Configuration
// Generated: $(new Date())
// Server: $DOMAIN_NAME

module.exports = {
  apps: [
    {
      name: 'skyraksys-hrm-backend',
      script: 'backend/server.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      merge_logs: true,
      max_memory_restart: '1G',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      watch: false,
      ignore_watch: ['node_modules', 'uploads', 'logs'],
      node_args: ['--max_old_space_size=1024'],
      
      // RHEL specific settings
      uid: 'skyraksys',
      gid: 'skyraksys',
      cwd: '/opt/skyraksys-hrm',
      
      // Auto restart settings
      autorestart: true,
      watch_delay: 1000,
      ignore_watch: [
        'node_modules',
        'uploads',
        'logs',
        '*.log',
        '.git'
      ],
      
      // Environment file
      env_file: './backend/.env.production'
    }
  ],
  
  deploy: {
    production: {
      user: 'skyraksys',
      host: '$DOMAIN_NAME',
      ref: 'origin/master',
      repo: 'https://github.com/kanchanavinoth-crypto/skyraksys_hrm_app.git',
      path: '/opt/skyraksys-hrm',
      'post-deploy': 'npm install --production && npm run build && pm2 reload ecosystem.production.config.js --env production',
      'pre-setup': 'mkdir -p /opt/skyraksys-hrm'
    }
  }
};
EOF

    chmod 644 "$target_file"
    print_success "PM2 ecosystem configuration created: $target_file"
}

generate_database_config() {
    local target_file="backend/config/database.production.js"
    
    print_info "Generating database configuration"
    
    mkdir -p "backend/config"
    
    cat > "$target_file" << EOF
// Database Configuration for Production
// Generated: $(date)
// Server: $DOMAIN_NAME

const { Sequelize } = require('sequelize');

const config = {
  development: {
    username: 'skyraksys_user',
    password: '$DB_PASSWORD',
    database: 'skyraksys_hrm_dev',
    host: '$DB_HOST',
    port: 5432,
    dialect: 'postgres',
    logging: console.log,
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000
    }
  },
  
  production: {
    username: 'skyraksys_user',
    password: '$DB_PASSWORD',
    database: 'skyraksys_hrm_prod',
    host: '$DB_HOST',
    port: 5432,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 20,
      min: 5,
      acquire: 60000,
      idle: 30000
    },
    dialectOptions: {
      charset: 'utf8mb4',
      connectTimeout: 30000,
      acquireTimeout: 30000,
      requestTimeout: 30000,
    },
    retry: {
      match: [
        /ETIMEDOUT/,
        /EHOSTUNREACH/,
        /ECONNRESET/,
        /ECONNREFUSED/,
        /EHOSTDOWN/,
        /ENETDOWN/,
        /ENETUNREACH/,
        /EAI_AGAIN/
      ],
      max: 3
    }
  }
};

module.exports = config;
module.exports[process.env.NODE_ENV || 'development'];
EOF

    chmod 600 "$target_file"
    print_success "Database configuration created: $target_file"
}

generate_systemd_services() {
    print_info "Generating systemd service files"
    
    # Backend service
    cat > "skyraksys-hrm-backend.service" << EOF
[Unit]
Description=SkyrakSys HRM Backend Service
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=forking
User=skyraksys
Group=skyraksys
WorkingDirectory=/opt/skyraksys-hrm
Environment=NODE_ENV=production
EnvironmentFile=/opt/skyraksys-hrm/backend/.env.production
ExecStart=/usr/bin/pm2 start ecosystem.production.config.js --env production
ExecReload=/usr/bin/pm2 reload ecosystem.production.config.js --env production
ExecStop=/usr/bin/pm2 stop ecosystem.production.config.js
PIDFile=/var/run/skyraksys-hrm/backend.pid
Restart=always
RestartSec=10

# Security
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/opt/skyraksys-hrm /var/log/skyraksys-hrm /var/run/skyraksys-hrm

[Install]
WantedBy=multi-user.target
EOF

    print_success "Systemd service file created: skyraksys-hrm-backend.service"
    print_info "Copy to: /etc/systemd/system/"
}

create_deployment_summary() {
    local summary_file="PRODUCTION_CONFIG_SUMMARY.md"
    
    print_info "Creating deployment summary"
    
    cat > "$summary_file" << EOF
# Production Configuration Summary

Generated: $(date)
Server: $DOMAIN_NAME ($SERVER_IP)

## Generated Files

### Environment Configurations
- \`backend/.env.production\` - Backend environment variables
- \`frontend/.env.production\` - Frontend environment variables

### System Configurations
- \`nginx-hrm.production.conf\` - Nginx web server configuration
- \`ecosystem.production.config.js\` - PM2 process management
- \`backend/config/database.production.js\` - Database configuration

### System Services
- \`skyraksys-hrm-backend.service\` - Systemd service definition

## Deployment Steps

1. **Copy environment files:**
   \`\`\`bash
   cp backend/.env.production backend/.env
   cp frontend/.env.production frontend/.env
   \`\`\`

2. **Deploy Nginx configuration:**
   \`\`\`bash
   sudo cp nginx-hrm.production.conf /etc/nginx/sites-available/skyraksys.conf
   sudo ln -sf /etc/nginx/sites-available/skyraksys.conf /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   \`\`\`

3. **Deploy PM2 configuration:**
   \`\`\`bash
   cp ecosystem.production.config.js ecosystem.config.js
   pm2 stop all
   pm2 start ecosystem.config.js --env production
   \`\`\`

4. **Deploy systemd service:**
   \`\`\`bash
   sudo cp skyraksys-hrm-backend.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable skyraksys-hrm-backend
   \`\`\`

## Security Notes

- Database password: [SECURED]
- JWT Secret: [SECURED]
- Session Secret: [SECURED]
- All sensitive files have restricted permissions (600)

## Validation

Use \`validate-production-configs.sh\` to verify all configurations are properly deployed.

EOF

    print_success "Summary created: $summary_file"
}

main() {
    print_header "🏭 Production Configuration Generator"
    print_info "Creating server-specific configurations from RedHat PROD templates"
    echo ""
    
    # Collect server information
    collect_server_info
    echo ""
    
    # Generate all configuration files
    print_header "📝 Generating Configuration Files"
    
    generate_backend_env
    generate_frontend_env
    generate_nginx_config
    generate_ecosystem_config
    generate_database_config
    generate_systemd_services
    
    echo ""
    
    # Create summary
    create_deployment_summary
    
    echo ""
    print_header "✅ Configuration Generation Complete"
    
    print_success "All production configurations generated successfully!"
    print_info "Review PRODUCTION_CONFIG_SUMMARY.md for deployment instructions"
    print_warning "Keep the generated files secure - they contain sensitive information"
    
    echo ""
    print_info "Next steps:"
    print_info "1. Review all generated configurations"
    print_info "2. Run ./validate-production-configs.sh to verify"
    print_info "3. Deploy configurations to production server"
    print_info "4. Test the deployment"
}

# Execute main function
main "$@"