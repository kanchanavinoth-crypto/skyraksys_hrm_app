@echo off
echo.
echo ========================================
echo SkyrakSys HRM - Cloud Database Setup Guide
echo ========================================
echo.

echo 🌐 Cloud Database Options for Production:
echo.
echo 1. 💎 Heroku PostgreSQL (Recommended for startups)
echo    - Free tier: 10,000 rows
echo    - Easy deployment
echo    - Automatic backups
echo    - SSL included
echo.
echo 2. ☁️ AWS RDS PostgreSQL (Enterprise)
echo    - Scalable and reliable
echo    - Multi-AZ deployments
echo    - Advanced monitoring
echo    - Pay-as-you-use
echo.
echo 3. 🔵 Azure Database for PostgreSQL
echo    - Microsoft ecosystem integration
echo    - Built-in security
echo    - Intelligent performance
echo    - Global availability
echo.
echo 4. 🌟 Google Cloud SQL PostgreSQL
echo    - Google infrastructure
echo    - Automatic failover
echo    - Point-in-time recovery
echo    - Integration with GCP services
echo.
echo 5. 🚀 DigitalOcean Managed Database
echo    - Simple pricing
echo    - Developer-friendly
echo    - Automated backups
echo    - Easy scaling
echo.

echo 📋 Configuration Steps for Cloud Database:
echo.
echo 1. Create your cloud database instance
echo 2. Note down the connection details:
echo    - Host/Endpoint
echo    - Port (usually 5432)
echo    - Database name
echo    - Username
echo    - Password
echo    - SSL requirements
echo.
echo 3. Update your backend/.env file:
echo    DB_HOST=your-cloud-host
echo    DB_PORT=5432
echo    DB_NAME=your-database-name
echo    DB_USER=your-username
echo    DB_PASSWORD=your-password
echo    DB_SSL=true
echo.
echo 4. Deploy your application to cloud platforms:
echo    - Heroku
echo    - Vercel
echo    - AWS
echo    - DigitalOcean
echo.

echo 💡 Cost Comparison (Monthly estimates):
echo - Heroku Postgres: $0 (hobby) - $200+ (production)
echo - AWS RDS: $15 (micro) - $300+ (large)
echo - Azure Database: $20 (basic) - $400+ (premium)
echo - Google Cloud SQL: $25 (small) - $350+ (large)
echo - DigitalOcean: $15 (basic) - $200+ (large)
echo.

pause
