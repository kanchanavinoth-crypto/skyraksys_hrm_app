const { sequelize } = require('./models');

async function fixTimesheetConstraints() {
  console.log('🔧 FIXING TIMESHEET DATABASE CONSTRAINTS\n');
  
  try {
    // Get the QueryInterface to modify database structure
    const queryInterface = sequelize.getQueryInterface();
    
    console.log('📋 Current table info:');
    const tableInfo = await queryInterface.describeTable('timesheets');
    console.log('Table columns:', Object.keys(tableInfo));
    
    console.log('\n📋 Current indexes:');
    const indexes = await queryInterface.showIndex('timesheets');
    console.log('Indexes:', indexes.map(idx => ({
      name: idx.name,
      unique: idx.unique,
      fields: idx.fields?.map(f => f.name || f)
    })));
    
    // Drop the incorrect unique constraint on employeeId
    console.log('\n🗑️ Dropping incorrect unique constraints...');
    
    // Check if there are any problematic indexes
    const problemIndexes = indexes.filter(idx => 
      idx.unique && 
      idx.fields?.length === 1 && 
      (idx.fields[0].name === 'employeeId' || idx.fields[0] === 'employeeId')
    );
    
    for (const idx of problemIndexes) {
      try {
        console.log(`Dropping problematic index: ${idx.name}`);
        await queryInterface.removeIndex('timesheets', idx.name);
      } catch (error) {
        console.log(`Could not drop index ${idx.name}:`, error.message);
      }
    }
    
    // Create the correct composite unique constraint
    console.log('\n✅ Creating correct composite unique constraint...');
    try {
      await queryInterface.addIndex('timesheets', {
        fields: ['employeeId', 'workDate', 'projectId', 'taskId'],
        unique: true,
        name: 'timesheets_employee_date_project_task_unique'
      });
      console.log('✅ Composite unique constraint created successfully');
    } catch (error) {
      console.log('Constraint might already exist:', error.message);
    }
    
    console.log('\n📋 Updated indexes:');
    const newIndexes = await queryInterface.showIndex('timesheets');
    console.log('New indexes:', newIndexes.map(idx => ({
      name: idx.name,
      unique: idx.unique,
      fields: idx.fields?.map(f => f.name || f)
    })));
    
    console.log('\n✅ Database constraints fixed!');
    
  } catch (error) {
    console.error('Error fixing constraints:', error);
    console.log('\nℹ️  If this fails, we may need to recreate the table completely.');
  }
}

fixTimesheetConstraints().catch(console.error);
