require('dotenv').config();
const db = require('./models');

async function cleanupTimesheetData() {
  try {
    console.log('🧹 Starting timesheet data cleanup...\n');
    
    // Check all timesheets
    const allTimesheets = await db.Timesheet.findAll({
      where: { deletedAt: null },
      order: [['createdAt', 'ASC']]
    });
    
    console.log(`📊 Found ${allTimesheets.length} active timesheets\n`);
    
    // Group by unique key
    const grouped = {};
    allTimesheets.forEach(timesheet => {
      const key = `${timesheet.employeeId}-${timesheet.workDate}-${timesheet.projectId}-${timesheet.taskId}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(timesheet);
    });
    
    // Find and remove duplicates
    let duplicatesRemoved = 0;
    let fixedSubmittedDates = 0;
    
    for (const [key, timesheets] of Object.entries(grouped)) {
      if (timesheets.length > 1) {
        console.log(`🔍 Found ${timesheets.length} duplicate timesheets for key: ${key}`);
        
        // Keep the most recent one, delete others
        const sorted = timesheets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const toKeep = sorted[0];
        const toDelete = sorted.slice(1);
        
        for (const duplicate of toDelete) {
          await duplicate.update({ deletedAt: new Date() });
          console.log(`   ❌ Deleted duplicate: ${duplicate.id}`);
          duplicatesRemoved++;
        }
        
        console.log(`   ✅ Kept most recent: ${toKeep.id}`);
      }
      
      // Fix missing submitted dates for the remaining timesheet
      const remaining = timesheets[0];
      if ((remaining.status === 'Submitted' || remaining.status === 'Approved' || remaining.status === 'Rejected') && !remaining.submittedAt) {
        await remaining.update({
          submittedAt: remaining.updatedAt || remaining.createdAt
        });
        console.log(`   📅 Fixed submitted date for: ${remaining.id}`);
        fixedSubmittedDates++;
      }
    }
    
    console.log(`\n🎉 Cleanup completed:`);
    console.log(`   - Removed ${duplicatesRemoved} duplicate timesheets`);
    console.log(`   - Fixed ${fixedSubmittedDates} missing submitted dates`);
    
    // Show final status
    const finalTimesheets = await db.Timesheet.findAll({
      where: { deletedAt: null }
    });
    
    console.log(`\n📈 Final count: ${finalTimesheets.length} active timesheets`);
    
    // Show status distribution
    const statusCounts = {};
    finalTimesheets.forEach(ts => {
      statusCounts[ts.status] = (statusCounts[ts.status] || 0) + 1;
    });
    
    console.log('\n📊 Status distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
    
  } catch (error) {
    console.error('❌ Error cleaning up timesheet data:', error);
  }
}

cleanupTimesheetData();