# Database Management Utilities

This directory contains utilities for managing the SkyRakSys HRM database.

## Available Commands

### Backup & Restore
- `npm run db:backup` - Create a database backup
- `npm run db:restore` - Restore from latest backup
- `npm run db:restore [filename]` - Restore from specific backup file

### Maintenance
- `npm run db:maintenance` - Run database maintenance tasks
- `npm run db:optimize` - Optimize database performance
- `npm run db:check` - Run all database health checks

### Development
- `npm run seed:minimal` - Load minimal dataset for development
- `npm run seed:full` - Load complete dataset
- `npm run seed:test` - Load test dataset
- `npm run db:diagram` - Generate database diagram

### Monitoring
- `npm run db:status` - Check migration status
- `npm run db:test-connection` - Test database connectivity

## Environment Setup

Make sure your `.env` file contains these database configurations:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skyraksys_hrm
DB_USER=your_username
DB_PASSWORD=your_password
```

## Backup Directory Structure

Backups are stored in `backend/backups/` with the following naming convention:
```
backup-YYYY-MM-DD-HH-mm-ss.dump
```

## Common Issues

1. **Backup/Restore fails**
   - Ensure PostgreSQL client tools (pg_dump, pg_restore) are installed
   - Check database credentials in .env
   - Verify PostgreSQL service is running

2. **Seeding fails**
   - Run `npm run db:check` to validate database state
   - Check if migrations are up to date with `npm run db:status`
   - Clear database with `npm run db:reset` if needed