require('dotenv').config();
const sequelize = require('./config/database');
const db = require('./models');

const Timesheet = db.Timesheet;

async function submitTestTimesheets() {
  try {
    console.log('🔄 Submitting test timesheets for approval...');
    
    // Get all draft timesheets
    const draftTimesheets = await Timesheet.findAll({
      where: { status: 'Draft' },
      limit: 5 // Submit first 5 for testing
    });
    
    console.log(`📋 Found ${draftTimesheets.length} draft timesheets`);
    
    for (let i = 0; i < draftTimesheets.length; i++) {
      const timesheet = draftTimesheets[i];
      let newStatus = 'Submitted';
      
      // Vary the status for testing
      if (i === 0) newStatus = 'Submitted';
      if (i === 1) newStatus = 'Approved';
      if (i === 2) newStatus = 'Rejected';
      if (i === 3) newStatus = 'Submitted';
      if (i === 4) newStatus = 'Approved';
      
      await timesheet.update({
        status: newStatus,
        submittedAt: new Date(),
        ...(newStatus === 'Approved' && { approvedAt: new Date() }),
        ...(newStatus === 'Rejected' && { rejectedAt: new Date(), approverComments: 'Please provide more detailed task description' })
      });
      
      console.log(`✅ Updated timesheet ${timesheet.id} to status: ${newStatus}`);
    }
    
    console.log('🎉 Test timesheets submitted successfully!');
    console.log('\nStatus Summary:');
    
    const statusCounts = await Timesheet.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status']
    });
    
    statusCounts.forEach(item => {
      console.log(`   ${item.status}: ${item.dataValues.count} entries`);
    });
    
  } catch (error) {
    console.error('❌ Error submitting test timesheets:', error);
  } finally {
    await sequelize.close();
  }
}

submitTestTimesheets();