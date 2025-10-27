const fs = require('fs');
const path = require('path');

console.log('🧹 Cleaning up HRM workspace...\n');

// Files to keep in root directory
const keepInRoot = [
  'package.json',
  'package-lock.json', 
  '.env.production.template',
  'docker-compose.yml',
  'ecosystem.config.js',
  'README.md',
  'QUICKSTART.md',
  'database.sqlite',
  // Important status/guide files
  'ACTIVE_STATUS_FILTERING_COMPLETE.md',
  'PAYROLL_API_ENDPOINT_FIXED.md',
  'FINAL_SUCCESS_REPORT.md',
  'COMPREHENSIVE_SYSTEM_REVIEW.md'
];

// Directories to keep
const keepDirectories = [
  'frontend',
  'backend', 
  'node_modules',
  'uploads',
  '.vscode'
];

// Create archive directories
const archiveDir = './archive';
const testFilesDir = './archive/test-files';
const reportsDir = './archive/reports';
const tempScriptsDir = './archive/temp-scripts';

function createArchiveDirs() {
  if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir);
  if (!fs.existsSync(testFilesDir)) fs.mkdirSync(testFilesDir);
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir);
  if (!fs.existsSync(tempScriptsDir)) fs.mkdirSync(tempScriptsDir);
}

function moveToArchive(filename) {
  const source = path.join('.', filename);
  let destination;
  
  // Categorize files
  if (filename.includes('test') || filename.includes('debug') || filename.includes('check-') || 
      filename.includes('quick-') || filename.includes('simple-') || filename.includes('validate-') ||
      filename.includes('verify-') || filename.includes('inspect-') || filename.includes('monitor-')) {
    destination = path.join(testFilesDir, filename);
  } else if (filename.includes('report') || filename.includes('summary') || filename.includes('status') ||
             filename.includes('documentation') || filename.includes('validation') || filename.endsWith('.md')) {
    destination = path.join(reportsDir, filename);
  } else if (filename.endsWith('.js') || filename.endsWith('.bat') || filename.endsWith('.sh')) {
    destination = path.join(tempScriptsDir, filename);
  } else {
    destination = path.join(archiveDir, filename);
  }
  
  try {
    if (fs.existsSync(source)) {
      fs.renameSync(source, destination);
      console.log(`📦 Moved: ${filename} → ${destination}`);
    }
  } catch (error) {
    console.log(`⚠️  Could not move ${filename}: ${error.message}`);
  }
}

function cleanupWorkspace() {
  createArchiveDirs();
  
  // Get all files in root directory
  const files = fs.readdirSync('.').filter(file => {
    const stat = fs.statSync(file);
    return stat.isFile();
  });
  
  let movedCount = 0;
  
  files.forEach(file => {
    // Skip files we want to keep in root
    if (!keepInRoot.includes(file)) {
      moveToArchive(file);
      movedCount++;
    } else {
      console.log(`✅ Keeping: ${file}`);
    }
  });
  
  console.log(`\n📊 Cleanup Summary:`);
  console.log(`   Files moved to archive: ${movedCount}`);
  console.log(`   Files kept in root: ${keepInRoot.length}`);
  console.log(`   Directories preserved: ${keepDirectories.length}`);
  
  console.log(`\n🎯 Archive Structure Created:`);
  console.log(`   📁 archive/test-files/ - Test and debug scripts`);
  console.log(`   📁 archive/reports/ - Documentation and reports`);
  console.log(`   📁 archive/temp-scripts/ - Temporary utility scripts`);
  console.log(`   📁 archive/ - Other miscellaneous files`);
}

// Run cleanup
cleanupWorkspace();

console.log(`\n✨ Workspace cleanup complete!`);
console.log(`\n🎯 Next steps:`);
console.log(`   1. Check that backend and frontend still work`);
console.log(`   2. Review the archive folders`);
console.log(`   3. Delete archive if everything looks good`);
