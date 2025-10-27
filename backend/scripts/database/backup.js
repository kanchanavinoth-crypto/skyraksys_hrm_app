const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const BACKUP_DIR = path.join(__dirname, '../../backups');

// Create backups directory if it doesn't exist
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const {
    DB_HOST = 'localhost',
    DB_PORT = 5432,
    DB_NAME,
    DB_USER,
    DB_PASSWORD
} = process.env;

// Generate backup filename with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.dump`);

// Set PGPASSWORD environment variable for passwordless operation
process.env.PGPASSWORD = DB_PASSWORD;

console.log('📦 Starting database backup...');
console.log(`Backup file: ${backupFile}`);

const pg_dump = spawn('pg_dump', [
    '-h', DB_HOST,
    '-p', DB_PORT,
    '-U', DB_USER,
    '-F', 'c', // Custom format
    '-b', // Include large objects
    '-v', // Verbose
    '-f', backupFile,
    DB_NAME
]);

pg_dump.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
});

pg_dump.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
});

pg_dump.on('close', (code) => {
    // Clear password from env
    delete process.env.PGPASSWORD;
    
    if (code === 0) {
        // Get file size
        const stats = fs.statSync(backupFile);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        
        console.log('✅ Backup completed successfully!');
        console.log(`📊 Backup size: ${fileSizeMB} MB`);
        
        // List recent backups
        const backups = fs.readdirSync(BACKUP_DIR)
            .filter(file => file.startsWith('backup-'))
            .sort((a, b) => fs.statSync(path.join(BACKUP_DIR, b)).mtime.getTime() - 
                           fs.statSync(path.join(BACKUP_DIR, a)).mtime.getTime())
            .slice(0, 5);
            
        console.log('\nRecent backups:');
        backups.forEach(backup => {
            const stat = fs.statSync(path.join(BACKUP_DIR, backup));
            const date = stat.mtime.toLocaleString();
            const size = (stat.size / (1024 * 1024)).toFixed(2);
            console.log(`- ${backup} (${size} MB) - ${date}`);
        });
    } else {
        console.error(`❌ Backup failed with code ${code}`);
        process.exit(1);
    }
});