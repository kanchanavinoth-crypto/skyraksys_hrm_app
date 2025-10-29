const db = require('./backend/models');
const { Op } = require('sequelize');

async function checkData() {
  try {
    console.log('🔍 Checking timesheet data...');
    
    // Count total timesheets
    const total = await db.Timesheet.count();
    console.log('📊 Total timesheets:', total);
    
    // Check for 2025-09-22 specifically  
    const week22 = await db.Timesheet.findAll({
      where: { weekStartDate: '2025-09-22' },
      attributes: ['id', 'weekStartDate', 'status', 'employeeId']
    });
    console.log('📅 Timesheets for 2025-09-22:', week22.length);
    
    // Check what weeks actually exist
    const uniqueWeeks = await db.Timesheet.findAll({
      attributes: [[db.sequelize.fn('DISTINCT', db.sequelize.col('weekStartDate')), 'weekStartDate']],
      order: [['weekStartDate', 'ASC']]
    });
    
    console.log('📋 Unique weeks in database:');
    uniqueWeeks.forEach(week => console.log('  -', week.weekStartDate));
    
    // Check for sample data (the first few)
    const samples = await db.Timesheet.findAll({
      limit: 5,
      attributes: ['id', 'weekStartDate', 'status', 'employeeId'],
      order: [['id', 'ASC']]
    });
    
    console.log('📋 Sample timesheets:');
    samples.forEach(ts => console.log(`  - ID: ${ts.id}, Week: ${ts.weekStartDate}, Status: ${ts.status}, Employee: ${ts.employeeId}`));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkData();