# Deployment Issues & Solutions

## Issue #1: Database Migration Hanging

**Problem:** Sequelize migration gets stuck without completing
```bash
npx sequelize-cli db:migrate
# Hangs here...
```

**Root Cause:** Database connection or migration conflicts

**Solutions:**

### Option A: Fix Database Connection
```bash
# Check if PostgreSQL is running
systemctl status postgresql

# If not running, start it
systemctl start postgresql

# Test database connection
sudo -u postgres psql -c '\l'
```

### Option B: Reset Migration State
```bash
cd backend
# Check current migration status
npx sequelize-cli db:migrate:status

# If stuck, manually mark migrations as done
# (Only if you're sure the tables exist)
npx sequelize-cli db:migrate --to 0
npx sequelize-cli db:migrate
```

### Option C: Skip Problematic Migration
```bash
# Create a fresh migration status
npx sequelize-cli db:migrate:status
# Manually fix any problematic migrations
```

## Issue #2: Backend Service Management

**Problem:** Backend service not detected by deployment script

**Solution:** Use PM2 or manual process management
```bash
# Option 1: Use PM2
npm install -g pm2
cd backend
pm2 start server.js --name "hrm-backend"
pm2 startup
pm2 save

# Option 2: Manual process
cd backend
nohup node server.js > ../logs/backend.log 2>&1 &
```

## Issue #3: npm Security Vulnerabilities

**Problem:** 11 vulnerabilities detected

**Solution:** Fix vulnerabilities
```bash
cd backend
npm audit fix --force
# or for production
npm ci --omit=dev
```

## Quick Fix Deployment Script

Run this to bypass the hanging migration:

```bash
#!/bin/bash
echo "🔧 Quick Fix Deployment"

# 1. Ensure PostgreSQL is running
systemctl start postgresql

# 2. Go to backend directory
cd backend

# 3. Fix npm vulnerabilities
npm audit fix --force

# 4. Check migration status
echo "Checking migration status..."
npx sequelize-cli db:migrate:status

# 5. Try migrations with timeout
timeout 60 npx sequelize-cli db:migrate || echo "Migration skipped due to timeout"

# 6. Start backend manually
pm2 start server.js --name "hrm-backend" || nohup node server.js > ../logs/backend.log 2>&1 &

# 7. Build frontend
cd ../frontend
npm run build

echo "✅ Quick fix deployment completed"
```

## Long-term Solution

1. **Set up proper PostgreSQL configuration**
2. **Use PM2 for process management** 
3. **Create systemd service files**
4. **Implement proper migration rollback strategy**