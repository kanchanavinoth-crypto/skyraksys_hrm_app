const { sequelize } = require('../models');
const chalk = require('chalk'); // Optional: for colored output

async function setupDatabase() {
  try {
    console.log(chalk.cyan('🔧 Setting up SKYRAKSYS HRM Database...\n'));

    // Test connection
    console.log(chalk.yellow('1️⃣ Testing database connection...'));
    await sequelize.authenticate();
    console.log(chalk.green('✅ Database connection successful\n'));

    // Sync all models (creates tables if they don't exist)
    console.log(chalk.yellow('2️⃣ Syncing database models...'));
    console.log(chalk.gray('   This will create all missing tables\n'));
    
    await sequelize.sync({ alter: true }); // Use alter to update existing tables
    console.log(chalk.green('✅ Database models synced\n'));

    // Verify tables
    console.log(chalk.yellow('3️⃣ Verifying tables...\n'));
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log(chalk.cyan('📋 Tables found:'));
    const tableList = results.map(row => row.table_name);
    tableList.forEach(table => {
      const icon = table === 'leave_requests' ? '✅' : '📌';
      console.log(`   ${icon} ${table}`);
    });

    // Check leave_requests specifically
    const [leaveRequestsCheck] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'leave_requests'
      );
    `);

    console.log('');
    if (leaveRequestsCheck[0].exists) {
      console.log(chalk.green('✅ leave_requests table exists!'));
      
      // Show columns
      const [columns] = await sequelize.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'leave_requests'
        ORDER BY ordinal_position;
      `);
      
      console.log(chalk.cyan('\n📊 leave_requests table structure:'));
      columns.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? chalk.gray('(nullable)') : chalk.yellow('(required)');
        console.log(`   - ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${nullable}`);
      });

      // Check for cancellation columns
      const cancellationColumns = ['isCancellation', 'originalLeaveRequestId', 'cancellationNote', 'cancelledAt'];
      const existingCols = columns.map(c => c.column_name);
      const missingCols = cancellationColumns.filter(col => !existingCols.includes(col));

      if (missingCols.length > 0) {
        console.log(chalk.yellow('\n⚠️ Missing cancellation columns:'));
        missingCols.forEach(col => console.log(`   - ${col}`));
        console.log(chalk.yellow('\nℹ️ Run migration to add these columns:'));
        console.log(chalk.gray('   npx sequelize-cli db:migrate'));
      } else {
        console.log(chalk.green('\n✅ All cancellation columns are present!'));
      }
    } else {
      console.log(chalk.red('❌ leave_requests table NOT found!'));
      console.log(chalk.yellow('\nThis should have been created by sync. Check:'));
      console.log(chalk.gray('1. Model file exists: models/leaverequest.model.js'));
      console.log(chalk.gray('2. Model is properly exported in models/index.js'));
      console.log(chalk.gray('3. No syntax errors in model definition'));
    }

    console.log(chalk.cyan('\n📊 Database Summary:'));
    console.log(chalk.gray(`   Total tables: ${tableList.length}`));
    console.log(chalk.gray(`   Database: ${sequelize.config.database}`));
    console.log(chalk.gray(`   Host: ${sequelize.config.host}`));
    
    console.log(chalk.green('\n✅ Database setup complete!\n'));
    console.log(chalk.yellow('Next steps:'));
    console.log(chalk.gray('1. Run migrations: npx sequelize-cli db:migrate'));
    console.log(chalk.gray('2. Start backend: node server.js'));
    console.log(chalk.gray('3. Test frontend: http://localhost:3000\n'));

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error(chalk.red('\n❌ Database setup failed:'), error.message);
    console.error(chalk.gray('\nFull error:'), error);
    
    console.log(chalk.yellow('\n💡 Troubleshooting:'));
    console.log(chalk.gray('1. Check PostgreSQL is running'));
    console.log(chalk.gray('2. Verify config/config.json credentials'));
    console.log(chalk.gray('3. Ensure database exists: skyraksys_hrm_db'));
    console.log(chalk.gray('4. Check model files for syntax errors'));
    
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log(chalk.yellow('\n\n⚠️ Shutting down gracefully...'));
  await sequelize.close();
  process.exit(0);
});

setupDatabase();
