@echo off
echo ================================================
echo  SkyRakSys HRM - Database Setup Script
echo ================================================
echo.

:: Check if PostgreSQL is installed
where psql >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: PostgreSQL is not installed or not in PATH
    echo Please install PostgreSQL and add it to your system PATH
    pause
    exit /b 1
)

:: Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js and add it to your system PATH
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed
echo.

:: Navigate to backend directory
if not exist "backend" (
    echo ERROR: Backend directory not found
    echo Please run this script from the project root directory
    pause
    exit /b 1
)

cd backend

:: Install dependencies
echo 📦 Installing Node.js dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully
echo.

:: Check if .env file exists
if not exist ".env" (
    echo ⚠️  .env file not found. Creating from template...
    echo.
    echo # Database Configuration > .env
    echo DB_HOST=localhost >> .env
    echo DB_PORT=5432 >> .env
    echo DB_NAME=skyraksys_hrm >> .env
    echo DB_USER=hrm_user >> .env
    echo DB_PASSWORD=hrm_password123 >> .env
    echo. >> .env
    echo # Application Configuration >> .env
    echo NODE_ENV=development >> .env
    echo PORT=5000 >> .env
    echo JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_secure_change_this_in_production >> .env
    echo JWT_EXPIRE=24h >> .env
    echo. >> .env
    echo # Security Configuration >> .env
    echo BCRYPT_ROUNDS=12 >> .env
    echo RATE_LIMIT_WINDOW_MS=900000 >> .env
    echo RATE_LIMIT_MAX_REQUESTS=100 >> .env
    
    echo ✅ .env file created with default values
    echo ⚠️  Please update the database credentials in .env file before proceeding
    echo.
)

:: Test database connection
echo 🔍 Testing database connection...
node -e "
const { Sequelize } = require('sequelize');
require('dotenv').config();

async function test() {
  const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false
  });
  
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    console.log('');
    console.log('Please ensure:');
    console.log('1. PostgreSQL is running');
    console.log('2. Database and user exist');
    console.log('3. Credentials in .env are correct');
    process.exit(1);
  }
}
test();
"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Database connection failed. Please:
    echo 1. Start PostgreSQL service
    echo 2. Create database and user as mentioned in database-setup.md
    echo 3. Update .env file with correct credentials
    echo.
    pause
    exit /b 1
)

echo.

:: Run migrations
echo 🏗️  Running database migrations...
call npx sequelize-cli db:migrate
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Migration failed
    pause
    exit /b 1
)

echo ✅ Database tables created successfully
echo.

:: Run seeders
echo 🌱 Seeding database with demo data...
call npx sequelize-cli db:seed:all
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Seeding failed
    pause
    exit /b 1
)

echo ✅ Demo data loaded successfully
echo.

:: Verify setup
echo 🔍 Verifying database setup...
node -e "
const { Sequelize } = require('sequelize');
require('dotenv').config();

async function verify() {
  const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false
  });
  
  try {
    const [employees] = await sequelize.query('SELECT COUNT(*) as count FROM employees');
    const [leaves] = await sequelize.query('SELECT COUNT(*) as count FROM leaves');
    const [timesheets] = await sequelize.query('SELECT COUNT(*) as count FROM timesheets');
    const [payslips] = await sequelize.query('SELECT COUNT(*) as count FROM payslips');
    
    console.log('📊 Database Statistics:');
    console.log('   Employees:', employees[0].count);
    console.log('   Leave Records:', leaves[0].count);
    console.log('   Timesheet Entries:', timesheets[0].count);
    console.log('   Payslip Records:', payslips[0].count);
    
    await sequelize.close();
  } catch (error) {
    console.log('❌ Verification failed:', error.message);
    process.exit(1);
  }
}
verify();
"

echo.
echo ================================================
echo ✅ Database setup completed successfully!
echo ================================================
echo.
echo Demo Login Credentials:
echo   CEO: rajesh.kumar@skyraksys.com / password123
echo   CTO: priya.sharma@skyraksys.com / password123
echo   HR: amit.patel@skyraksys.com / password123
echo.
echo Next Steps:
echo 1. Start the backend server: npm run dev
echo 2. Test API at: http://localhost:5000/api/health
echo 3. Start the frontend application
echo 4. Login with demo credentials
echo.
echo For detailed setup instructions, see: database-setup.md
echo.
pause
