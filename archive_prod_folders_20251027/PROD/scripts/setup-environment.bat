@echo off
REM ============================================
REM  Environment Configuration Setup
REM ============================================

echo.
echo [Environment Setup] Creating production environment files...

REM Create backend .env.production template
echo Creating backend production environment...
(
echo # ============================================
echo # SkyRakSys HRM - Production Environment
echo # ============================================
echo.
echo # Server Configuration
echo NODE_ENV=production
echo PORT=8080
echo.
echo # Database Configuration
echo DB_HOST=localhost
echo DB_PORT=5432
echo DB_NAME=skyraksys_hrm_prod
echo DB_USER=hrm_prod_user
echo DB_PASSWORD=CHANGE_THIS_SECURE_PASSWORD
echo DB_SSL=true
echo.
echo # JWT Configuration - CHANGE THESE IN PRODUCTION
echo JWT_SECRET=CHANGE_THIS_SUPER_SECRET_JWT_KEY_MINIMUM_32_CHARACTERS_LONG
echo JWT_REFRESH_SECRET=CHANGE_THIS_SUPER_SECRET_REFRESH_KEY_MINIMUM_32_CHARACTERS_LONG
echo JWT_EXPIRE=24h
echo JWT_REFRESH_EXPIRE=7d
echo.
echo # Security Configuration
echo BCRYPT_ROUNDS=12
echo RATE_LIMIT_WINDOW_MS=900000
echo RATE_LIMIT_MAX_REQUESTS=100
echo.
echo # CORS Configuration
echo CORS_ORIGIN=https://yourdomain.com
echo.
echo # File Upload Configuration
echo UPLOAD_DIR=uploads
echo MAX_FILE_SIZE=5242880
echo.
echo # Email Configuration ^(if using email features^)
echo # SMTP_HOST=smtp.gmail.com
echo # SMTP_PORT=587
echo # SMTP_USER=your-email@gmail.com
echo # SMTP_PASS=your-app-password
echo.
echo # Logging Configuration
echo LOG_LEVEL=info
echo LOG_FILE=logs/backend/app.log
echo.
echo # SSL Configuration
echo SSL_ENABLED=false
echo SSL_CERT_PATH=ssl/cert.pem
echo SSL_KEY_PATH=ssl/key.pem
) > backend\.env.production

REM Create frontend environment
echo Creating frontend production environment...
(
echo # ============================================
echo # Frontend Production Environment
echo # ============================================
echo.
echo REACT_APP_API_URL=https://yourdomain.com/api
echo REACT_APP_ENV=production
echo REACT_APP_VERSION=2.0.0
echo.
echo # Build optimizations
echo GENERATE_SOURCEMAP=false
echo INLINE_RUNTIME_CHUNK=false
) > frontend\.env.production

REM Create backend .env.example for reference
echo Creating backend environment example...
(
echo # ============================================
echo # SkyRakSys HRM - Environment Configuration
echo # ============================================
echo.
echo # Server Configuration
echo NODE_ENV=development
echo PORT=8080
echo.
echo # Database Configuration
echo DB_HOST=localhost
echo DB_PORT=5432
echo DB_NAME=skyraksys_hrm
echo DB_USER=hrm_user
echo DB_PASSWORD=your_secure_password
echo DB_SSL=false
echo.
echo # JWT Configuration
echo JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
echo JWT_REFRESH_SECRET=your_super_secret_refresh_key_minimum_32_characters
echo JWT_EXPIRE=24h
echo JWT_REFRESH_EXPIRE=7d
echo.
echo # Security Configuration
echo BCRYPT_ROUNDS=12
echo RATE_LIMIT_WINDOW_MS=900000
echo RATE_LIMIT_MAX_REQUESTS=100
echo.
echo # CORS Configuration
echo CORS_ORIGIN=http://localhost:3000
echo.
echo # File Upload Configuration
echo UPLOAD_DIR=uploads
echo MAX_FILE_SIZE=5242880
echo.
echo # Logging Configuration
echo LOG_LEVEL=debug
echo LOG_FILE=logs/app.log
) > backend\.env.example

REM Copy production config to current env for initial setup
copy backend\.env.production backend\.env

echo ✅ Environment files created:
echo   - backend/.env.production
echo   - backend/.env.example  
echo   - frontend/.env.production
echo.
echo ⚠️  IMPORTANT: Update the following in backend/.env.production:
echo   - DB_PASSWORD: Set a secure database password
echo   - JWT_SECRET: Generate a secure JWT secret
echo   - JWT_REFRESH_SECRET: Generate a secure refresh secret
echo   - CORS_ORIGIN: Set your production domain
echo.
echo   You can generate secure secrets using:
echo   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
echo.
