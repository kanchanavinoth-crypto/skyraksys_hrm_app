# Debug Utilities

This directory contains scripts for debugging and inspecting the database state during development.

## 📋 Purpose
These scripts help developers troubleshoot issues, verify data integrity, and understand system state without modifying data.

## 🔍 Script Categories

### Database Inspection (`check-*.js`)
Scripts that query and display database state:
- **check-database.js** - Overall database health and connection
- **check-employees.js** - List employees and their attributes
- **check-users.js** - List users and authentication status
- **check-timesheets.js** - Query timesheet records
- **check-leave-balance-tables.js** - Verify leave balance data
- **check-positions.js** - List positions and departments
- **check-salary-data.js** - Review salary structures

### Data Validation (`verify-*.js`, `validate-*.js`)
Scripts that check data integrity:
- **verify-indexes.js** - Confirm database indexes exist
- **validate-models.js** - Test Sequelize model definitions

### Investigation Tools (`debug-*.js`, `trace-*.js`, `investigate-*.js`)
Scripts for troubleshooting specific issues:
- **debug-auth.js** - Test authentication flows
- **trace-submission.js** - Track timesheet submission workflow
- **investigate-submission.js** - Deep dive into submission problems

### Search Tools (`search-*.js`, `find-*.js`, `get-*.js`)
Scripts to find specific records:
- **find-users.js** - Search for users by criteria
- **find-missing-tasks.js** - Identify orphaned tasks
- **search-week38.js** - Find records for specific time periods

## ⚠️ Usage Guidelines

### When to Use
- ✅ During development to understand data structure
- ✅ When debugging production issues (read-only queries)
- ✅ To verify data after migrations
- ✅ When troubleshooting user-reported bugs

### When NOT to Use
- ❌ In automated CI/CD pipelines
- ❌ On production databases without backup
- ❌ Scripts that modify data (use maintenance scripts instead)

## 🚀 Running Scripts

### Basic Usage
```bash
cd backend
node utils/debug/check-database.js
node utils/debug/verify-indexes.js
```

### With Environment Variables
```bash
# Use specific database
DATABASE_URL="postgresql://..." node utils/debug/check-users.js

# Enable verbose logging
DEBUG=* node utils/debug/trace-submission.js
```

## 📝 Best Practices

### Before Running
1. Ensure database credentials are configured (`.env` file)
2. Verify you're connected to the correct database (dev/staging/prod)
3. Read the script to understand what it does

### Script Standards
All debug scripts should:
- Be **read-only** (no INSERT/UPDATE/DELETE)
- Include clear console output with emojis/formatting
- Handle connection errors gracefully
- Close database connections when done
- Document their purpose at the top

### Example Script Structure
```javascript
/**
 * check-example.js
 * 
 * Purpose: Verify example data exists in database
 * Usage: node utils/debug/check-example.js
 * 
 * Output: Lists all example records with counts
 */

const db = require('../../models');

async function checkExamples() {
    try {
        const examples = await db.Example.findAll();
        console.log(`✅ Found ${examples.length} examples`);
        // ... display results
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await db.sequelize.close();
    }
}

checkExamples();
```

## 🗑️ Cleanup Policy

### Regular Maintenance
- **Monthly**: Review scripts and remove obsolete ones
- **After Bugs**: Archive scripts created for one-time investigations
- **Version Updates**: Test scripts still work with new models/schema

### Obsolete Script Criteria
Move to `archive/obsolete-scripts/` if:
- Created for a specific bug that's now fixed
- Tests old schema that no longer exists
- Duplicates functionality of newer scripts
- Hasn't been used in 6+ months

## 📚 Related Documentation
- [Maintenance Scripts](../maintenance/README.md) - Data modification scripts
- [Manual Tests](../../tests/manual/README.md) - API testing scripts
- [Migration Helpers](../migration-helpers/README.md) - Database migration utilities

---

**Last Updated**: October 28, 2025  
**Maintainer**: Tech Lead  
**Status**: Active
