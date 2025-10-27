const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const BACKUP_DIR = path.join(__dirname, '../../backups');

if (!fs.existsSync(BACKUP_DIR)) {
    console.error('❌ No backups directory found');
    process.exit(1);
}

// Get latest backup file if none specified
const backupFile = process.argv[2] || getLatestBackup();

if (!backupFile) {
    console.error('❌ No backup file found');
    process.exit(1);
}

const {
    DB_HOST = 'localhost',
    DB_PORT = 5432,
    DB_NAME,
    DB_USER,
    DB_PASSWORD
} = process.env;

// Set PGPASSWORD environment variable for passwordless operation
process.env.PGPASSWORD = DB_PASSWORD;

const pg_restore = spawn('pg_restore', [
    '-h', DB_HOST,
    '-p', DB_PORT,
    '-U', DB_USER,
    '-d', DB_NAME,
    '-v', // Verbose
    '-c', // Clean (drop) database objects before recreating
    '-F', 'c', // Custom format
    backupFile
]);

pg_restore.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
});

pg_restore.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
});

pg_restore.on('close', (code) => {
    if (code === 0) {
        console.log('✅ Database restore completed successfully');
    } else {
        console.error(`❌ Database restore failed with code ${code}`);
    }
    // Clear password from env
    delete process.env.PGPASSWORD;
});

function getLatestBackup() {
    const files = fs.readdirSync(BACKUP_DIR)
        .filter(file => file.startsWith('backup-'))
        .map(file => ({
            name: file,
            path: path.join(BACKUP_DIR, file),
            time: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time);

    return files.length > 0 ? files[0].path : null;
}