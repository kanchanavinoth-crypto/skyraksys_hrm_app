require('dotenv').config();
const db = require('./models');
const { Op } = require('sequelize');

const Timesheet = db.Timesheet;

async function analyzeAndCleanTimesheetData() {
  try {
    console.log('🔍 Analyzing timesheet data for issues...\n');
    
    // 1. Check for duplicate timesheets using Sequelize ORM
    console.log('📋 Checking for duplicate timesheets...');
    
    const allTimesheets = await Timesheet.findAll({
      where: { deletedAt: null },
      order: [['createdAt', 'ASC']]
    });
    
    const duplicateMap = {};
    const duplicates = [];
    
    allTimesheets.forEach(timesheet => {
      const key = `${timesheet.employeeId}-${timesheet.workDate}-${timesheet.projectId}-${timesheet.taskId}`;
      if (duplicateMap[key]) {
        duplicateMap[key].push(timesheet);
      } else {
        duplicateMap[key] = [timesheet];
      }
    });
    
    Object.values(duplicateMap).forEach(group => {
      if (group.length > 1) {
        duplicates.push(group);
      }
    });
    
    if (duplicates.length > 0) {
      console.log(`❌ Found ${duplicates.length} sets of duplicate timesheets:`);
      duplicates.forEach((dup, index) => {
        console.log(`   ${index + 1}. Employee: ${dup[0].employeeId}, Date: ${dup[0].workDate}, Count: ${dup.length}`);
        console.log(`      IDs: ${dup.map(t => t.id).join(', ')}`);
      });
    } else {
      console.log('✅ No duplicate timesheets found');
    }
    
    // 2. Check for invalid dates (just null check)
    console.log('\n📅 Checking for invalid dates...');
    const invalidDates = await Timesheet.findAll({
      where: {
        workDate: null
      }
    });
    
    if (invalidDates.length > 0) {
      console.log(`❌ Found ${invalidDates.length} timesheets with invalid work dates`);
    } else {
      console.log('✅ All work dates are valid');
    }
    
    // 3. Check submitted dates that are null for non-draft timesheets
    console.log('\n🗓️ Checking for missing submitted dates...');
    const missingSubmittedDates = await Timesheet.findAll({
      where: {
        status: ['Submitted', 'Approved', 'Rejected'],
        submittedAt: null
      }
    });
    
    if (missingSubmittedDates.length > 0) {
      console.log(`❌ Found ${missingSubmittedDates.length} non-draft timesheets with missing submitted dates`);
    } else {
      console.log('✅ All non-draft timesheets have submitted dates');
    }
    
    // 4. Check for timesheets with future dates
    console.log('\n🔮 Checking for future work dates...');
    const futureTimesheets = await Timesheet.findAll({
      where: {
        workDate: {
          [Op.gt]: new Date()
        }
      }
    });
    
    if (futureTimesheets.length > 0) {
      console.log(`⚠️ Found ${futureTimesheets.length} timesheets with future work dates`);
    } else {
      console.log('✅ No future work dates found');
    }
    
    // 5. Show current status distribution
    console.log('\n📊 Current timesheet status distribution:');
    const statusCounts = await Timesheet.findAll({
      attributes: [
        'status',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
      ],
      where: { deletedAt: null },
      group: ['status'],
      order: [[db.sequelize.fn('COUNT', db.sequelize.col('id')), 'DESC']]
    });
    
    statusCounts.forEach(item => {
      console.log(`   ${item.status}: ${item.dataValues.count} entries`);
    });
    
    // Now let's clean up the issues
    console.log('\n🧹 Starting cleanup process...\n');
    
    // Clean up duplicates (keep the most recent one)
    if (duplicates.length > 0) {
      console.log('🗑️ Removing duplicate timesheets...');
      for (const group of duplicates) {
        // Keep the last one (most recent), delete the rest
        const toDelete = group.slice(0, -1);
        
        for (const timesheet of toDelete) {
          await timesheet.update({ deletedAt: new Date() });
          console.log(`   ✅ Soft deleted duplicate timesheet: ${timesheet.id}`);
        }
      }
    }
    
    // Fix missing submitted dates for non-draft timesheets
    if (missingSubmittedDates.length > 0) {
      console.log('📅 Fixing missing submitted dates...');
      for (const timesheet of missingSubmittedDates) {
        await timesheet.update({
          submittedAt: timesheet.updatedAt || timesheet.createdAt
        });
        console.log(`   ✅ Fixed submitted date for timesheet: ${timesheet.id}`);
      }
    }
    
    console.log('\n🎉 Cleanup completed successfully!');
    
    // Show final status
    console.log('\n📈 Final timesheet status distribution:');
    const finalCounts = await Timesheet.findAll({
      attributes: [
        'status',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
      ],
      where: { deletedAt: null },
      group: ['status'],
      order: [[db.sequelize.fn('COUNT', db.sequelize.col('id')), 'DESC']]
    });
    
    finalCounts.forEach(item => {
      console.log(`   ${item.status}: ${item.dataValues.count} entries`);
    });
    
  } catch (error) {
    console.error('❌ Error analyzing timesheet data:', error);
  }
}

analyzeAndCleanTimesheetData();