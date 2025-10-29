# Maintenance Scripts

This directory contains scripts for maintaining, fixing, and updating the database during development and production maintenance windows.

## ⚠️ WARNING
**These scripts MODIFY database data.** Always backup before running on production!

## 📋 Purpose
Maintenance scripts help with:
- Setting up initial data
- Fixing data inconsistencies
- Bulk updates and corrections
- Adding missing records
- Removing invalid data
- Performance optimizations

## 🔧 Script Categories

### Setup Scripts (`setup-*.js`)
Initialize system components:
- **setup-leave-system.js** - Configure leave types and balances
- **setup-manager-hierarchy.js** - Establish reporting relationships

### Data Creation (`create-*.js`)
Generate test or initial data:
- **create-sample-data.js** - Populate database with demo data
- **create-sample-timesheets.js** - Generate example timesheets
- **create-projects-tasks.js** - Setup projects and tasks
- **create-test-user.js** - Add test user accounts
- **create-performance-indexes.js** - Add database indexes

### Data Fixes (`fix-*.js`)
Correct data problems:
- **fix-constraint.js** - Resolve foreign key constraint issues
- **fix-file-uploads.js** - Repair file upload records
- **fix-history-query.js** - Fix timesheet history queries
- **fix-migration.js** - Resolve migration failures

### Data Addition (`add-*.js`)
Add missing or new data:
- **add-column.js** - Add database columns
- **add-salary-data.js** - Populate salary structures
- **add-esi-numbers.js** - Add ESI registration numbers
- **add-missing-salary.js** - Fill in missing compensation data
- **add-bulk-submit-endpoint.js** - Add API endpoints

### Data Cleanup (`cleanup-*.js`)
Remove or clean data:
- **cleanup-data-issues.js** - Fix data integrity problems
- **cleanup-timesheet-data.js** - Remove duplicate/invalid timesheets

### Data Removal (`remove-*.js`)
Delete specific records or constraints:
- **remove-blocking-constraints.js** - Drop problematic constraints
- **remove-unique-constraint.js** - Remove unique index

### Resets (`reset-*.js`)
Reset parts of the system:
- **reset-database.js** - Drop and recreate all tables (DANGEROUS!)
- **reset-passwords.js** - Reset user passwords to default

### Updates (`update-*.js`)
Modify existing records:
- **update-test-data.js** - Update test records with new values

## 🚀 Running Scripts

### Pre-flight Checklist
Before running ANY maintenance script:

1. ✅ **Backup database**
   ```bash
   pg_dump -U postgres skyraksys_hrm > backup_$(date +%Y%m%d).sql
   ```

2. ✅ **Verify environment**
   ```bash
   echo $NODE_ENV
   # Ensure you're targeting correct database
   ```

3. ✅ **Read the script**
   - Understand what it does
   - Check if it's idempotent (safe to run multiple times)
   - Note any prerequisites

4. ✅ **Test on dev/staging first**
   - Never run untested scripts on production

### Basic Usage
```bash
cd backend
node utils/maintenance/setup-leave-system.js
node utils/maintenance/create-sample-data.js
```

### With Dry-Run (if supported)
```bash
# Some scripts support dry-run mode
DRY_RUN=true node utils/maintenance/cleanup-data-issues.js
```

### Production Usage
```bash
# Stop application first
pm2 stop all

# Run maintenance script with logging
node utils/maintenance/fix-constraint.js 2>&1 | tee maintenance.log

# Verify results
node utils/debug/check-database.js

# Restart application
pm2 start all
```

## 📝 Best Practices

### Script Standards
All maintenance scripts should:
- ✅ Check for existing data before creating
- ✅ Use database transactions
- ✅ Log all changes
- ✅ Provide rollback instructions
- ✅ Include success/failure messages
- ✅ Be idempotent when possible

### Example Script Structure
```javascript
/**
 * fix-example.js
 * 
 * Purpose: Fix example data inconsistencies
 * Usage: node utils/maintenance/fix-example.js
 * 
 * Prerequisites:
 * - Database backup created
 * - Application stopped (if production)
 * 
 * Rollback: Restore from backup
 */

const db = require('../../models');

async function fixExamples() {
    const transaction = await db.sequelize.transaction();
    
    try {
        console.log('🔧 Starting example fix...');
        
        const result = await db.Example.update(
            { status: 'fixed' },
            { 
                where: { status: 'broken' },
                transaction 
            }
        );
        
        await transaction.commit();
        console.log(`✅ Fixed ${result[0]} examples`);
        
    } catch (error) {
        await transaction.rollback();
        console.error('❌ Fix failed:', error.message);
        console.log('Rollback: Restore from backup');
        process.exit(1);
    } finally {
        await db.sequelize.close();
    }
}

fixExamples();
```

## ⚠️ Safety Guidelines

### Development Environment
- ✅ Safe to experiment
- ✅ Can run without backups
- ✅ Can reset database completely

### Staging Environment
- ⚠️ Should mirror production
- ⚠️ Test exact production commands
- ⚠️ Backup before major changes

### Production Environment
- 🚨 **ALWAYS backup first**
- 🚨 **Test on staging first**
- 🚨 **Schedule maintenance window**
- 🚨 **Have rollback plan ready**
- 🚨 **Monitor after execution**

### High-Risk Operations
These require extra caution:
- `reset-database.js` - **DESTROYS ALL DATA**
- `remove-*-constraint.js` - Can break referential integrity
- `cleanup-*-data.js` - Permanently deletes records

## 🔄 Rollback Procedures

### If Script Fails Mid-Execution
1. Check if transaction was rolled back automatically
2. Restore from backup if needed
3. Investigate error logs
4. Fix script or data issue
5. Re-run if idempotent, or restore and retry

### Manual Rollback
```bash
# Restore from backup
psql -U postgres skyraksys_hrm < backup_20241028.sql

# Verify restoration
node utils/debug/check-database.js
```

## 📊 Change Log

### Tracking Changes
After running maintenance scripts in production:
1. Document in `docs/maintenance-log.md`
2. Note date, script, person, reason
3. Record any issues encountered
4. Document verification steps taken

### Example Entry
```markdown
## 2024-10-28 - Fix Leave Balance Constraint
**Script**: `fix-constraint.js`
**Executed By**: Admin
**Reason**: Foreign key constraint blocking leave approvals
**Result**: Success - 0 records affected, constraint fixed
**Verification**: Tested leave approval flow
```

## 🗑️ Cleanup Policy

### Archive Criteria
Move scripts to `archive/obsolete-scripts/` when:
- One-time fix completed and verified
- Script addressed temporary migration issue
- Functionality moved to proper migration or seeder
- No longer compatible with current schema

### Keep Active If
- Used for recurring maintenance (monthly reports, cleanup)
- Part of deployment procedure
- Useful for disaster recovery
- Referenced in documentation

## 📚 Related Documentation
- [Debug Scripts](../debug/README.md) - Read-only inspection tools
- [Migration Helpers](../migration-helpers/README.md) - Schema migration utilities
- [Manual Tests](../../tests/manual/README.md) - API testing scripts
- [Deployment Guide](../../docs/deployment/) - Production procedures

---

**Last Updated**: October 28, 2025  
**Maintainer**: Tech Lead  
**Status**: Active  
**Warning Level**: 🚨 HIGH - All scripts modify data
