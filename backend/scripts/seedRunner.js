#!/usr/bin/env node
/*
  One-off seeding runner for production.
  Usage examples (on the server):
    # from backend directory (loads ../.env automatically)
    node scripts/seedRunner.js

    # explicit .env path
    BACKEND_ENV_FILE=/opt/skyraksys-hrm/backend/.env node scripts/seedRunner.js

    # run via pm2 as a one-off (no autorestart):
    pm2 start /opt/skyraksys-hrm/backend/scripts/seedRunner.js --name seed-runner --no-autorestart --env production
    # check logs
    pm2 logs seed-runner
    # remove when done
    pm2 delete seed-runner

  Notes:
  - The script uses dotenv to load environment from BACKEND_ENV_FILE or ../.env.
  - Run as the same system user that runs your backend (e.g., hrmapp) so DB permissions and env match.
  - The demo seeding functions are in ../utils/demoSeed.js
*/

const path = require('path');
const fs = require('fs');

// Load dotenv if available
try {
  const dotenv = require('dotenv');
  const envPath = process.env.BACKEND_ENV_FILE || path.resolve(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`Loaded env from ${envPath}`);
  } else {
    console.log('No .env file found at', envPath, ' - assuming environment variables are already set.');
  }
} catch (e) {
  console.log('dotenv not installed or failed to load; continuing with process.env');
}

// Ensure we run from backend root path to resolve models correctly
process.chdir(path.resolve(__dirname, '..'));

const { seedAllDemoData } = require('../utils/demoSeed');

(async function run() {
  console.log('Starting demo data seeding...');
  try {
    await seedAllDemoData();
    console.log('✅ Seeding completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
})();
