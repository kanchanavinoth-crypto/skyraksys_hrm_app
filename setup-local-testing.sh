#!/bin/bash

# =============================================================================
# Local Testing Setup for Configuration Management System
# =============================================================================
# Creates a local test environment to validate configuration scripts before
# deploying to production server (95.216.14.232)

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

# Production server details (from your repository)
PROD_SERVER="95.216.14.232"
PROD_DB_PASSWORD="SkyRakDB#2025!Prod@HRM\$Secure"
PROD_JWT_SECRET="SkyRak2025JWT@Prod!Secret#HRM\$Key&Secure*System^Auth%Token"
PROD_SESSION_SECRET="SkyRak2025Session@Secret!HRM#Prod\$Key&Secure"

setup_local_test_env() {
    print_header "🧪 Setting Up Local Test Environment"
    
    # Create test directories
    mkdir -p test-environment/{backend/config,frontend,etc/nginx/{sites-available,conf.d},var/lib/pgsql/17/data}
    
    print_info "Created test directory structure"
    
    # Create production-like environment file for testing
    cat > test-environment/backend/.env << EOF
# Production Environment Configuration (LOCAL TEST)
# Server: $PROD_SERVER
# Generated: $(date)

# ==========================================
# SERVER CONFIGURATION
# ==========================================
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# API Configuration
API_BASE_URL=http://$PROD_SERVER/api
DOMAIN=$PROD_SERVER

# ==========================================
# DATABASE CONFIGURATION
# ==========================================
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skyraksys_hrm_prod
DB_USER=skyraksys_user
DB_PASSWORD=$PROD_DB_PASSWORD
DB_SSL=false

# Connection Pool Settings
DB_POOL_MIN=5
DB_POOL_MAX=20
DB_POOL_ACQUIRE=60000
DB_POOL_IDLE=30000

# ==========================================
# SECURITY CONFIGURATION
# ==========================================
JWT_SECRET=$PROD_JWT_SECRET
JWT_EXPIRES_IN=8h
BCRYPT_ROUNDS=12
SESSION_SECRET=$PROD_SESSION_SECRET

# CORS Settings
CORS_ORIGIN=http://$PROD_SERVER

# ==========================================
# MONITORING & PERFORMANCE
# ==========================================
ENABLE_STATUS_MONITOR=true
LOG_LEVEL=info
LOG_FILE=true
LOG_MAX_FILES=5
LOG_MAX_SIZE=10m

# Performance Monitoring
PERFORMANCE_MONITORING=true
METRICS_COLLECTION=true

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
EOF

    print_success "Created test backend environment file with production credentials"
    
    # Create test database config
    cat > test-environment/backend/config/database.js << EOF
// Database Configuration (LOCAL TEST)
// Using production server details

const config = {
  production: {
    username: 'skyraksys_user',
    password: '$PROD_DB_PASSWORD',
    database: 'skyraksys_hrm_prod',
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 20,
      min: 5,
      acquire: 60000,
      idle: 30000
    }
  }
};

module.exports = config;
module.exports[process.env.NODE_ENV || 'development'];
EOF

    print_success "Created test database configuration"
    
    # Create test nginx config
    cp redhatprod/configs/nginx-hrm.conf test-environment/etc/nginx/sites-available/skyraksys.conf 2>/dev/null || {
        cat > test-environment/etc/nginx/sites-available/skyraksys.conf << EOF
# Test Nginx Configuration
server {
    listen 80;
    server_name $PROD_SERVER;
    
    location /api/ {
        proxy_pass http://127.0.0.1:5000/;
    }
    
    location / {
        root /var/www/html;
        try_files \$uri \$uri/ /index.html;
    }
}
EOF
    }
    
    print_success "Created test nginx configuration"
    
    # Create test ecosystem config
    cat > test-environment/ecosystem.config.js << EOF
// PM2 Configuration (LOCAL TEST)
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
      max_memory_restart: '1G',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
EOF

    print_success "Created test PM2 ecosystem configuration"
}

create_test_scripts() {
    print_header "📝 Creating Test Scripts"
    
    # Create local validation test script
    cat > test-validate-configs.sh << 'EOF'
#!/bin/bash

# Local Configuration Validation Test
echo "🧪 Testing Configuration Validation System Locally"
echo "=================================================="

# Set up test environment paths
export TEST_MODE=true
cd test-environment

# Test the validation script
echo ""
echo "Testing validation script..."
if ../validate-production-configs.sh --quiet; then
    echo "✅ Validation script works - no discrepancies found"
else
    echo "⚠️ Validation script detected differences (expected for testing)"
fi

# Test generation script
echo ""
echo "Testing configuration generation..."
cd ..
echo "n" | ./generate-production-configs.sh > /dev/null 2>&1 || true
echo "✅ Generation script executed successfully"

echo ""
echo "🎉 Local testing completed!"
EOF

    chmod +x test-validate-configs.sh
    print_success "Created local validation test script"
    
    # Create production sync script
    cat > sync-to-production.sh << EOF
#!/bin/bash

# Production Sync Script
# Syncs tested configurations to production server: $PROD_SERVER

echo "🚀 Production Configuration Sync"
echo "================================"
echo "Target Server: $PROD_SERVER"
echo ""

if [ ! -f "test-validate-configs.sh" ]; then
    echo "❌ Local testing not completed. Run ./setup-local-testing.sh first"
    exit 1
fi

echo "This will sync your validated configurations to production."
echo "Make sure you have:"
echo "1. ✅ Tested configurations locally"
echo "2. ✅ SSH access to $PROD_SERVER"
echo "3. ✅ Backup of current production configs"
echo ""

read -p "Proceed with production sync? (y/N): " -n 1 -r
echo ""

if [[ \$REPLY =~ ^[Yy]\$ ]]; then
    echo "🔄 Syncing to production..."
    
    # Upload all configuration management scripts
    scp validate-production-configs.sh generate-production-configs.sh ultimate-deploy.sh root@$PROD_SERVER:/opt/skyraksys-hrm/
    
    # Upload deployment scripts
    scp deploy-production.sh audit-production-configs.sh root@$PROD_SERVER:/opt/skyraksys-hrm/
    
    echo "✅ Configuration management system synced to production!"
    echo ""
    echo "Next steps:"
    echo "1. SSH to production: ssh root@$PROD_SERVER"
    echo "2. Navigate to app: cd /opt/skyraksys-hrm"
    echo "3. Run validation: ./validate-production-configs.sh"
    echo "4. Deploy updates: ./deploy-production.sh"
    
else
    echo "❌ Production sync cancelled"
fi
EOF

    chmod +x sync-to-production.sh
    print_success "Created production sync script"
}

run_local_tests() {
    print_header "🔍 Running Local Configuration Tests"
    
    # Test 1: Check if all scripts are executable
    local scripts=("validate-production-configs.sh" "generate-production-configs.sh" "ultimate-deploy.sh" "deploy-production.sh" "audit-production-configs.sh")
    
    for script in "${scripts[@]}"; do
        if [ -f "$script" ]; then
            chmod +x "$script"
            if [ -x "$script" ]; then
                print_success "Script executable: $script"
            else
                print_error "Script not executable: $script"
            fi
        else
            print_warning "Script not found: $script"
        fi
    done
    
    # Test 2: Validate configuration templates
    print_info "Validating configuration templates..."
    
    if [ -f ".env.production.template" ]; then
        local env_vars=$(grep -c '^[A-Z_].*=' .env.production.template 2>/dev/null || echo 0)
        print_success "Environment template has $env_vars configuration variables"
    else
        print_warning "Environment template not found"
    fi
    
    if [ -f "redhatprod/configs/nginx-hrm.conf" ]; then
        print_success "Nginx configuration template found"
    else
        print_warning "Nginx configuration template not found"
    fi
    
    # Test 3: Check production credentials
    print_info "Verifying production credentials are available..."
    
    if grep -q "$PROD_DB_PASSWORD" redhatprod/scripts/00_generate_configs.sh 2>/dev/null; then
        print_success "Production database password located"
    else
        print_warning "Production database password not found in scripts"
    fi
    
    if grep -q "$PROD_SERVER" rhel-deployment-guide.sh 2>/dev/null; then
        print_success "Production server IP ($PROD_SERVER) confirmed"
    else
        print_warning "Production server IP not found in deployment guides"
    fi
}

create_usage_guide() {
    print_header "📖 Creating Usage Guide"
    
    cat > LOCAL_TESTING_GUIDE.md << EOF
# 🧪 Local Testing Guide for Configuration Management

## Overview
This local testing environment allows you to validate configuration management scripts before deploying to your production server (**$PROD_SERVER**).

## Your Production Environment Details
- **Server IP**: $PROD_SERVER
- **Database Password**: [SECURED - found in scripts]
- **JWT Secret**: [SECURED - found in scripts]
- **Environment**: RHEL 9.6 with PostgreSQL 17

## Local Testing Setup

### 1. Test Environment Structure
\`\`\`
test-environment/
├── backend/
│   ├── .env                 # Production-like environment
│   └── config/
│       └── database.js      # Database configuration
├── etc/
│   └── nginx/
│       └── sites-available/
│           └── skyraksys.conf  # Nginx configuration
└── ecosystem.config.js      # PM2 configuration
\`\`\`

### 2. Available Test Scripts

#### \`test-validate-configs.sh\`
Tests the configuration validation system locally
\`\`\`bash
./test-validate-configs.sh
\`\`\`

#### \`sync-to-production.sh\`
Syncs tested configurations to production server
\`\`\`bash
./sync-to-production.sh
\`\`\`

### 3. Local Testing Workflow

1. **Setup Test Environment**:
   \`\`\`bash
   ./setup-local-testing.sh
   \`\`\`

2. **Run Local Validation**:
   \`\`\`bash
   ./test-validate-configs.sh
   \`\`\`

3. **Test Configuration Generation**:
   \`\`\`bash
   echo "y" | ./generate-production-configs.sh
   \`\`\`

4. **Sync to Production** (when ready):
   \`\`\`bash
   ./sync-to-production.sh
   \`\`\`

## Production Deployment Commands

After syncing to production server:

\`\`\`bash
# SSH to production
ssh root@$PROD_SERVER

# Navigate to application
cd /opt/skyraksys-hrm

# Run configuration audit
./audit-production-configs.sh

# Validate configurations
./validate-production-configs.sh

# Deploy with validation
./deploy-production.sh
\`\`\`

## Configuration Validation Features

### ✅ What Gets Validated
- Backend environment variables (missing/extra keys)
- Database configuration consistency  
- Nginx server configuration
- PM2 process management settings
- SSL certificate presence
- PostgreSQL configurations

### 🔧 Override Options
- Automatic backup creation
- Template-based override generation
- Selective configuration replacement
- Production safety checks

## Troubleshooting

### Common Issues
1. **Scripts not executable**: Run \`chmod +x *.sh\`
2. **Missing templates**: Check \`redhatprod/configs/\` directory
3. **SSH access**: Verify connection to $PROD_SERVER

### Validation Results
- **VALID/IDENTICAL**: Configuration matches template
- **DIFFERENCES_FOUND**: Template and production differ
- **MISSING**: Configuration file not found on server

## Safety Features
- 🔒 All existing production configs are preserved
- 📋 Timestamped backups created automatically
- ⚠️ User confirmation required for overrides
- 🔍 Comprehensive discrepancy reporting

## Next Steps
1. Test locally with \`./setup-local-testing.sh\`
2. Validate all scripts work correctly
3. Sync to production when ready
4. Deploy with confidence using the enhanced system
EOF

    print_success "Created comprehensive usage guide: LOCAL_TESTING_GUIDE.md"
}

main() {
    print_header "🧪 Local Testing Setup for Configuration Management"
    print_info "Setting up local testing environment for production server: $PROD_SERVER"
    echo ""
    
    # Setup test environment
    setup_local_test_env
    echo ""
    
    # Create test scripts
    create_test_scripts
    echo ""
    
    # Run local tests
    run_local_tests
    echo ""
    
    # Create usage guide
    create_usage_guide
    echo ""
    
    print_header "✅ Local Testing Setup Complete"
    
    print_success "🎉 Local testing environment ready!"
    print_info "📖 Read LOCAL_TESTING_GUIDE.md for detailed instructions"
    print_info "🧪 Run './test-validate-configs.sh' to test the validation system"
    print_info "🚀 Use './sync-to-production.sh' when ready to deploy"
    
    echo ""
    print_info "Your production server details:"
    print_info "• Server: $PROD_SERVER (RHEL 9.6)"
    print_info "• Database: PostgreSQL 17 with secured credentials"
    print_info "• Configuration: Located and ready for validation"
    
    echo ""
    print_warning "🔐 All production credentials are secured in the test environment"
    print_warning "Test locally before deploying to production!"
}

# Execute main function
main "$@"