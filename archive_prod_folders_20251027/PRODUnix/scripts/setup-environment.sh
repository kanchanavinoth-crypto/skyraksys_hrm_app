#!/bin/bash

# ============================================
# Environment Configuration Setup (Unix/Linux)
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
log $CYAN "[Environment Setup] Creating production environment files..."

# Create backend .env.production template
log $YELLOW "Creating backend production environment..."
cat > backend/.env.production << 'EOF'
# ============================================
# SkyRakSys HRM - Production Environment
# ============================================

# Server Configuration
NODE_ENV=production
PORT=8080

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skyraksys_hrm_prod
DB_USER=hrm_prod_user
DB_PASSWORD=CHANGE_THIS_SECURE_PASSWORD
DB_SSL=true

# JWT Configuration - CHANGE THESE IN PRODUCTION
JWT_SECRET=CHANGE_THIS_SUPER_SECRET_JWT_KEY_MINIMUM_32_CHARACTERS_LONG
JWT_REFRESH_SECRET=CHANGE_THIS_SUPER_SECRET_REFRESH_KEY_MINIMUM_32_CHARACTERS_LONG
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com

# File Upload Configuration
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880

# Email Configuration (if using email features)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=logs/backend/app.log

# SSL Configuration
SSL_ENABLED=false
SSL_CERT_PATH=ssl/cert.pem
SSL_KEY_PATH=ssl/key.pem
EOF

# Create frontend environment
log $YELLOW "Creating frontend production environment..."
cat > frontend/.env.production << 'EOF'
# ============================================
# Frontend Production Environment
# ============================================

REACT_APP_API_URL=https://yourdomain.com/api
REACT_APP_ENV=production
REACT_APP_VERSION=2.0.0

# Build optimizations
GENERATE_SOURCEMAP=false
INLINE_RUNTIME_CHUNK=false
EOF

# Create backend .env.example for reference
log $YELLOW "Creating backend environment example..."
cat > backend/.env.example << 'EOF'
# ============================================
# SkyRakSys HRM - Environment Configuration
# ============================================

# Server Configuration
NODE_ENV=development
PORT=8080

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skyraksys_hrm
DB_USER=hrm_user
DB_PASSWORD=your_secure_password
DB_SSL=false

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
JWT_REFRESH_SECRET=your_super_secret_refresh_key_minimum_32_characters
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# File Upload Configuration
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880

# Logging Configuration
LOG_LEVEL=debug
LOG_FILE=logs/app.log
EOF

# Copy production config to current env for initial setup
cp backend/.env.production backend/.env

log $GREEN "✅ Environment files created:"
log $GREEN "  - backend/.env.production"
log $GREEN "  - backend/.env.example"
log $GREEN "  - frontend/.env.production"
echo ""

log $YELLOW "⚠️  IMPORTANT: Update the following in backend/.env.production:"
log $YELLOW "  - DB_PASSWORD: Set a secure database password"
log $YELLOW "  - JWT_SECRET: Generate a secure JWT secret"
log $YELLOW "  - JWT_REFRESH_SECRET: Generate a secure refresh secret"
log $YELLOW "  - CORS_ORIGIN: Set your production domain"
echo ""

log $YELLOW "  You can generate secure secrets using:"
log $YELLOW "  node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
echo ""
