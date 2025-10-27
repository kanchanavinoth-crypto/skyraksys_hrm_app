const db = require('./models');

async function checkSpecificWeek() {
  try {
    console.log('🔍 Checking for week starting 2025-09-22...');
    
    const exact = await db.Timesheet.findAll({
      where: { weekStartDate: '2025-09-22' },
      attributes: ['id', 'weekStartDate', 'weekNumber', 'status', 'employeeId']
    });
    console.log('📅 Exact match for 2025-09-22:', exact.length);
    
    // Check similar dates
    const similar = await db.Timesheet.findAll({
      where: { 
        weekStartDate: {
          [db.Sequelize.Op.between]: ['2025-09-20', '2025-09-25']
        }
      },
      attributes: ['id', 'weekStartDate', 'weekNumber', 'status', 'employeeId']
    });
    console.log('📅 Similar dates (Sep 20-25):', similar.length);
    similar.forEach(ts => console.log('  -', ts.weekStartDate, 'Week', ts.weekNumber));
    
    // Check what the latest week actually is
    const latest = await db.Timesheet.findAll({
      attributes: ['weekStartDate', 'weekNumber', 'year'],
      order: [['weekStartDate', 'DESC']],
      limit: 5
    });
    console.log('📋 Latest weeks in database:');
    latest.forEach(ts => console.log('  -', ts.weekStartDate, 'Week', ts.weekNumber, ts.year));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkSpecificWeek();