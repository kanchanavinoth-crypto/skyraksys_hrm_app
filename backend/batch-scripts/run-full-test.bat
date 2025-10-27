@echo off
echo ========================================
echo  HRM System - Complete Test Suite
echo ========================================
echo.

cd /d "d:\skyraksys_hrm\backend"

echo 1. Syncing database schema...
node -e "const db = require('./models'); db.sequelize.sync({ alter: true }).then(() => console.log('✓ Database synced')).catch(e => console.log('✗ Sync error:', e.message))"

echo.
echo 2. Setting up fresh test data...
node -e "
const { sequelize } = require('./models');
async function cleanSetup() {
  try {
    // Clean all tables except leave types
    const models = sequelize.models;
    await models.RefreshToken.destroy({ where: {} });
    await models.LeaveBalance.destroy({ where: {} });
    await models.Employee.destroy({ where: {}, force: true });
    await models.User.destroy({ where: {}, force: true });
    console.log('✓ Cleaned existing data');
    
    // Now run the full setup
    require('./setup-test-data').setupComprehensiveTestData();
  } catch (error) {
    console.log('Setup error:', error.message);
  }
}
cleanSetup();
"

echo.
echo 3. Running comprehensive tests...
timeout /t 3 > nul
node comprehensive-test.js

echo.
echo ========================================
echo  Test Suite Complete
echo ========================================
pause
