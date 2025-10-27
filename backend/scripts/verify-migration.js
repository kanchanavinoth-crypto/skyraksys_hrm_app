const { sequelize } = require('../models');

async function verifyMigration() {
  try {
    console.log('🔍 Verifying leave_requests table schema...\n');

    const [results] = await sequelize.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'leave_requests'
      AND column_name IN ('isCancellation', 'originalLeaveRequestId', 'cancellationNote', 'cancelledAt')
      ORDER BY column_name;
    `);

    if (results.length === 4) {
      console.log('✅ All 4 columns found in database:\n');
      results.forEach(col => {
        console.log(`📌 ${col.column_name}`);
        console.log(`   Type: ${col.data_type}`);
        console.log(`   Nullable: ${col.is_nullable}`);
        console.log(`   Default: ${col.column_default || 'NULL'}`);
        console.log('');
      });
      
      console.log('✅ Migration verified successfully!');
      console.log('🎉 Leave cancellation feature is ready to use!\n');
    } else {
      console.log(`❌ Expected 4 columns but found ${results.length}`);
      console.log('Missing columns:', results.map(r => r.column_name));
    }

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }
}

verifyMigration();
