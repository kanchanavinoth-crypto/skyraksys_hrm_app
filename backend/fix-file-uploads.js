const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('skyraksys_hrm', 'hrm_admin', 'hrm_secure_2024', {
  host: 'localhost',
  port: 5433,
  dialect: 'postgres',
  logging: false
});

async function fixFileUploadsTable() {
  try {
    console.log('🔧 Fixing file_uploads table enum issue...\n');
    
    // Drop the problematic table and recreate it properly
    console.log('1. Dropping and recreating file_uploads table...');
    
    await sequelize.query('DROP TABLE IF EXISTS file_uploads CASCADE');
    
    // Create the enum types first
    await sequelize.query(`
      DO 'BEGIN 
        CREATE TYPE "public"."enum_file_uploads_purpose" AS ENUM(''PROFILE_PHOTO'', ''DOCUMENT'', ''RESUME'', ''ID_PROOF'', ''ADDRESS_PROOF'', ''OTHER''); 
      EXCEPTION WHEN duplicate_object THEN null; END'
    `);
    
    await sequelize.query(`
      DO 'BEGIN 
        CREATE TYPE "public"."enum_file_uploads_scanStatus" AS ENUM(''PENDING'', ''CLEAN'', ''INFECTED'', ''ERROR''); 
      EXCEPTION WHEN duplicate_object THEN null; END'
    `);
    
    // Create the table with proper structure
    await sequelize.query(`
      CREATE TABLE "file_uploads" (
        "id" SERIAL PRIMARY KEY,
        "fileName" VARCHAR(255) NOT NULL,
        "storedFileName" VARCHAR(255) NOT NULL,
        "filePath" VARCHAR(500) NOT NULL,
        "fileType" VARCHAR(100) NOT NULL,
        "fileSize" INTEGER NOT NULL,
        "uploadedBy" INTEGER NOT NULL,
        "employeeId" VARCHAR(20),
        "purpose" "public"."enum_file_uploads_purpose" NOT NULL,
        "scanStatus" "public"."enum_file_uploads_scanStatus" NOT NULL DEFAULT 'PENDING',
        "scanDetails" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "expiresAt" TIMESTAMP WITH TIME ZONE,
        "downloadCount" INTEGER NOT NULL DEFAULT 0,
        "lastAccessedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `);
    
    // Add comments
    await sequelize.query(`
      COMMENT ON COLUMN "file_uploads"."fileName" IS 'Original filename';
      COMMENT ON COLUMN "file_uploads"."storedFileName" IS 'Filename as stored on server';
      COMMENT ON COLUMN "file_uploads"."filePath" IS 'Path where file is stored';
      COMMENT ON COLUMN "file_uploads"."fileType" IS 'MIME type of the file';
      COMMENT ON COLUMN "file_uploads"."fileSize" IS 'File size in bytes';
      COMMENT ON COLUMN "file_uploads"."uploadedBy" IS 'ID of user who uploaded the file';
      COMMENT ON COLUMN "file_uploads"."employeeId" IS 'Employee ID if file relates to employee';
      COMMENT ON COLUMN "file_uploads"."purpose" IS 'Purpose of the file upload';
      COMMENT ON COLUMN "file_uploads"."scanStatus" IS 'Virus scan status';
      COMMENT ON COLUMN "file_uploads"."scanDetails" IS 'Details from virus scan';
      COMMENT ON COLUMN "file_uploads"."isActive" IS 'Whether file is currently active';
      COMMENT ON COLUMN "file_uploads"."expiresAt" IS 'When file access expires (for temporary files)';
      COMMENT ON COLUMN "file_uploads"."downloadCount" IS 'Number of times file has been downloaded';
      COMMENT ON COLUMN "file_uploads"."lastAccessedAt" IS 'When file was last accessed';
    `);
    
    console.log('✅ file_uploads table recreated successfully');
    
    await sequelize.close();
    console.log('\n🎉 File uploads table fix completed!');
    console.log('💡 You can now restart the server - the database initialization should work.');
    
  } catch (error) {
    console.error('❌ Error during file_uploads fix:', error.message);
    console.error('   Full error:', error);
    process.exit(1);
  }
}

fixFileUploadsTable();