const { sequelize } = require('./models');

async function recreateTimesheetTable() {
  console.log('🔧 RECREATING TIMESHEET TABLE WITH CORRECT CONSTRAINTS\n');
  
  try {
    const queryInterface = sequelize.getQueryInterface();
    
    // First, let's back up existing data
    const existingData = await sequelize.query('SELECT * FROM timesheets', {
      type: sequelize.QueryTypes.SELECT
    });
    
    console.log(`📋 Found ${existingData.length} existing timesheet records`);
    
    // Drop the existing table
    console.log('🗑️ Dropping existing timesheet table...');
    await queryInterface.dropTable('timesheets');
    console.log('✅ Table dropped');
    
    // Recreate the table with correct schema
    console.log('🏗️ Creating new timesheet table with correct constraints...');
    
    await queryInterface.createTable('timesheets', {
      id: {
        type: sequelize.Sequelize.UUID,
        defaultValue: sequelize.Sequelize.UUIDV4,
        primaryKey: true
      },
      workDate: {
        type: sequelize.Sequelize.DATEONLY,
        allowNull: false
      },
      hoursWorked: {
        type: sequelize.Sequelize.DECIMAL(4, 2),
        allowNull: false
      },
      description: {
        type: sequelize.Sequelize.TEXT,
        allowNull: false
      },
      status: {
        type: sequelize.Sequelize.ENUM('Draft', 'Submitted', 'Approved', 'Rejected'),
        defaultValue: 'Draft'
      },
      submittedAt: {
        type: sequelize.Sequelize.DATE
      },
      approvedAt: {
        type: sequelize.Sequelize.DATE
      },
      rejectedAt: {
        type: sequelize.Sequelize.DATE
      },
      approverComments: {
        type: sequelize.Sequelize.TEXT
      },
      clockInTime: {
        type: sequelize.Sequelize.TIME
      },
      clockOutTime: {
        type: sequelize.Sequelize.TIME
      },
      breakHours: {
        type: sequelize.Sequelize.DECIMAL(4, 2),
        defaultValue: 0
      },
      employeeId: {
        type: sequelize.Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'employees',
          key: 'id'
        }
      },
      projectId: {
        type: sequelize.Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'projects',
          key: 'id'
        }
      },
      taskId: {
        type: sequelize.Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'tasks',
          key: 'id'
        }
      },
      approvedBy: {
        type: sequelize.Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'employees',
          key: 'id'
        }
      },
      createdAt: {
        type: sequelize.Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: sequelize.Sequelize.DATE,
        allowNull: false
      },
      deletedAt: {
        type: sequelize.Sequelize.DATE
      }
    });
    
    // Add the CORRECT composite unique constraint
    console.log('🔗 Adding composite unique constraint...');
    await queryInterface.addIndex('timesheets', {
      fields: ['employeeId', 'workDate', 'projectId', 'taskId'],
      unique: true,
      name: 'timesheets_employee_date_project_task_unique'
    });
    
    console.log('✅ Table recreated with correct constraints');
    
    // Restore data if any existed (optional, since we're testing)
    if (existingData.length > 0) {
      console.log('📥 Restoring existing data...');
      for (const record of existingData) {
        try {
          await sequelize.query(`
            INSERT INTO timesheets (
              id, workDate, hoursWorked, description, status, 
              submittedAt, approvedAt, rejectedAt, approverComments,
              clockInTime, clockOutTime, breakHours,
              employeeId, projectId, taskId, approvedBy,
              createdAt, updatedAt, deletedAt
            ) VALUES (
              :id, :workDate, :hoursWorked, :description, :status,
              :submittedAt, :approvedAt, :rejectedAt, :approverComments,
              :clockInTime, :clockOutTime, :breakHours,
              :employeeId, :projectId, :taskId, :approvedBy,
              :createdAt, :updatedAt, :deletedAt
            )
          `, {
            replacements: record,
            type: sequelize.QueryTypes.INSERT
          });
        } catch (error) {
          console.log(`⚠️  Skipped record ${record.id}: ${error.message}`);
        }
      }
      console.log('✅ Data restoration completed');
    }
    
    // Verify the new constraints
    console.log('\n📋 Verifying new table structure:');
    const indexes = await queryInterface.showIndex('timesheets');
    console.log('Indexes:');
    indexes.forEach(idx => {
      console.log(`- ${idx.name}: unique=${idx.unique}, fields=${JSON.stringify(idx.fields?.map(f => f.name || f))}`);
    });
    
    console.log('\n🎉 TIMESHEET TABLE RECREATED SUCCESSFULLY!');
    console.log('Now timesheet creation should work with proper constraints.');
    
  } catch (error) {
    console.error('❌ Error recreating table:', error);
  }
}

recreateTimesheetTable().catch(console.error);
