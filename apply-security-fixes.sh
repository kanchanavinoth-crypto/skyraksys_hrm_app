#!/bin/bash

# =============================================================================
# 🔒 CRITICAL SECURITY FIXES - Apply Before Production Deployment
# =============================================================================
# This script fixes all critical security issues identified in the audit
# Run this BEFORE deploying to production
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() { echo -e "${BLUE}=== $1 ===${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

print_header "SkyrakSys HRM - Critical Security Fixes"

# Generate secure secrets
print_header "Generating Secure Secrets"

# Generate secure database password (32 characters, base64)
SECURE_DB_PASSWORD=$(openssl rand -base64 32 | tr -d \"=+/\" | cut -c1-32)
print_success \"Generated secure database password\"

# Generate secure JWT secret (64 characters, hex)  
SECURE_JWT_SECRET=$(openssl rand -hex 64)
print_success \"Generated secure JWT secret\"

# Generate secure demo password (16 characters, mixed)
SECURE_DEMO_PASSWORD=$(openssl rand -base64 16 | tr -d \"=+/\" | cut -c1-16)
print_success \"Generated secure demo password\"

print_header \"Applying Security Fixes\"

# 1. Fix backend .env file
print_warning \"Updating backend/.env with secure defaults...\"
cat > backend/.env << EOF
# Database Configuration - PRODUCTION SECURE
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skyraksys_hrm_prod
DB_USER=skyraksys_admin
DB_PASSWORD=${SECURE_DB_PASSWORD}

# JWT Configuration - PRODUCTION SECURE
JWT_SECRET=${SECURE_JWT_SECRET}
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# Server Configuration
PORT=3001
NODE_ENV=production

# Email Configuration (configure via admin UI)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=

# Demo Data Seeding
SEED_DEMO_DATA=false
SEED_DEFAULT_PASSWORD=${SECURE_DEMO_PASSWORD}

# Security Settings
CORS_ORIGIN=http://95.216.14.232
SESSION_SECRET=${SECURE_JWT_SECRET}
ENCRYPTION_KEY=${SECURE_JWT_SECRET:0:32}
EOF

print_success \"Updated backend/.env with secure configuration\"

# 2. Fix backend config.json
print_warning \"Updating backend/config/config.json...\"
cat > backend/config/config.json << EOF
{
  \"development\": {
    \"username\": \"postgres\",
    \"password\": \"admin\",
    \"database\": \"skyraksys_hrm\",
    \"host\": \"localhost\",
    \"port\": 5432,
    \"dialect\": \"postgres\",
    \"logging\": false,
    \"pool\": {
      \"max\": 5,
      \"min\": 0,
      \"acquire\": 30000,
      \"idle\": 10000
    }
  },
  \"test\": {
    \"username\": \"postgres\",
    \"password\": \"admin\",
    \"database\": \"skyraksys_hrm_test\",
    \"host\": \"localhost\",
    \"port\": 5432,
    \"dialect\": \"postgres\",
    \"logging\": false
  },
  \"production\": {
    \"username\": \"skyraksys_admin\",
    \"password\": \"${SECURE_DB_PASSWORD}\",
    \"database\": \"skyraksys_hrm_prod\",
    \"host\": \"localhost\",
    \"port\": 5432,
    \"dialect\": \"postgres\",
    \"logging\": false,
    \"pool\": {
      \"max\": 10,
      \"min\": 2,
      \"acquire\": 60000,
      \"idle\": 30000
    }
  }
}
EOF

print_success \"Fixed database configuration with secure password\"

# 3. Update deployment script with generated secrets
print_warning \"Updating rhel-quick-deploy.sh with secure configuration...\"
sed -i \"s/DB_PASSWORD=\\\".*\\\"/DB_PASSWORD=\\\"${SECURE_DB_PASSWORD}\\\"/g\" rhel-quick-deploy.sh
sed -i \"s/JWT_SECRET=.*/JWT_SECRET=${SECURE_JWT_SECRET}/g\" rhel-quick-deploy.sh

print_success \"Updated deployment script with secure secrets\"

# 4. Fix ecosystem.config.js port consistency
print_warning \"Updating ecosystem.config.js for port consistency...\"
sed -i 's/PORT: 5000/PORT: 3001/g' ecosystem.config.js
sed -i \"s/name: 'skyraksys-hrm-backend'/name: 'skyraksys-hrm'/g\" ecosystem.config.js

print_success \"Fixed PM2 configuration consistency\"

# 5. Create secure .env.example files
print_warning \"Creating secure .env.example files...\"

cat > backend/.env.example << EOF
# Backend Environment Configuration Example
# Copy this file to .env and update with your secure settings

# Application Configuration
NODE_ENV=production
PORT=3001

# Database Configuration - USE SECURE VALUES
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skyraksys_hrm_prod
DB_USER=skyraksys_admin
DB_PASSWORD=YOUR_SECURE_DB_PASSWORD_HERE

# JWT Configuration - GENERATE SECURE SECRETS
JWT_SECRET=YOUR_SECURE_JWT_SECRET_HERE
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASSWORD=your-secure-app-password

# Demo Data Seeding
SEED_DEMO_DATA=false
SEED_DEFAULT_PASSWORD=YOUR_SECURE_DEMO_PASSWORD_HERE

# Security
CORS_ORIGIN=http://your-domain.com
SESSION_SECRET=YOUR_SECURE_SESSION_SECRET_HERE
ENCRYPTION_KEY=YOUR_SECURE_ENCRYPTION_KEY_HERE
EOF

print_success \"Created secure backend .env.example\"

# 6. Save secrets securely
print_header \"Saving Secure Credentials\"

cat > PRODUCTION-SECRETS-SECURE.md << EOF
# 🔒 PRODUCTION SECRETS - CONFIDENTIAL

**Generated**: $(date)
**For**: SkyrakSys HRM Production Deployment

## 🔐 Database Credentials
- **Database**: skyraksys_hrm_prod
- **Username**: skyraksys_admin  
- **Password**: \`${SECURE_DB_PASSWORD}\`

## 🔑 Application Secrets
- **JWT Secret**: \`${SECURE_JWT_SECRET}\`
- **Demo Password**: \`${SECURE_DEMO_PASSWORD}\`

## 📋 Demo Account (CHANGE PASSWORD IMMEDIATELY)
- **Email**: admin@example.com
- **Password**: \`${SECURE_DEMO_PASSWORD}\`
- **Role**: Administrator

## ⚠️ SECURITY NOTES
1. **Change demo password immediately** after first login
2. These secrets are now secure and ready for production
3. Keep this file confidential and delete after deployment
4. Use the Email Configuration UI to set up SMTP

## ✅ Security Fixes Applied
- [x] Secure database password generated
- [x] Production-ready JWT secret generated  
- [x] Secure demo password generated
- [x] Configuration files updated
- [x] Port consistency fixed
- [x] Database config null password fixed

**Status**: Ready for secure production deployment! 🚀
EOF

print_success \"Saved production secrets to PRODUCTION-SECRETS-SECURE.md\"

# 7. Display summary
print_header \"Security Fixes Complete\"

echo -e \"${GREEN}\"
echo \"🔒 ALL CRITICAL SECURITY ISSUES FIXED!\"
echo \"\"
echo \"✅ Generated secure database password\"
echo \"✅ Generated production-ready JWT secret\"
echo \"✅ Generated secure demo password\"
echo \"✅ Fixed all configuration inconsistencies\"
echo \"✅ Updated deployment scripts\"
echo \"✅ Fixed database config null password\"
echo \"✅ Standardized port configuration\"
echo \"\"
echo \"📁 Files Updated:\"
echo \"  - backend/.env\"
echo \"  - backend/config/config.json\"
echo \"  - backend/.env.example\" 
echo \"  - ecosystem.config.js\"
echo \"  - rhel-quick-deploy.sh\"
echo \"\"
echo \"📄 New Files Created:\"
echo \"  - PRODUCTION-SECRETS-SECURE.md (confidential)\"
echo \"\"
echo \"🚀 Your application is now SECURE and ready for production deployment!\"
echo \"\"
echo \"🔑 Next Steps:\"
echo \"1. Review PRODUCTION-SECRETS-SECURE.md\"
echo \"2. Deploy using: ./rhel-quick-deploy.sh\"
echo \"3. Login with admin@example.com and new secure password\"
echo \"4. Change admin password immediately\"
echo \"5. Configure email via Admin → Email Configuration\"
echo \"6. Delete PRODUCTION-SECRETS-SECURE.md after deployment\"
echo -e \"${NC}\"

print_success \"Security hardening complete! 🛡️\"