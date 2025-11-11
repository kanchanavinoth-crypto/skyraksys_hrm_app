# SkyrakSys HRM Incremental Deployment Guide

## 1. Pre-Deployment Checklist
- Ensure you have backup of the production database (use `pg_dump` or your DB tool).
- Notify users of possible downtime (if needed).
- Confirm you have SSH/root access to the production server.
- Check that all local changes are committed and pushed to the remote repository.

## 2. Pull Latest Code
```bash
cd /opt/skyraksys-hrm
# Pull latest code from master
git pull origin master
```

## 3. Apply Database Migration & Fixes
- Run the provided fix scripts to ensure schema and migrations are up to date:
```bash
cd /opt/skyraksys-hrm/redhatprod/scripts
sudo bash ./fix-sequelize-meta.sh
sudo bash ./complete-deployment-fix.sh
```
- If you use Sequelize migrations, run:
```bash
cd /opt/skyraksys-hrm/backend
npx sequelize-cli db:migrate --env production
```

## 4. Restart Application Services
- Restart backend and frontend services using PM2:
```bash
pm2 reload hrm-backend
pm2 reload hrm-frontend
# Or, if using ecosystem config:
pm2 restart ecosystem.config.js --only hrm-backend
pm2 restart ecosystem.config.js --only hrm-frontend
```

## 5. Post-Deployment Validation
- Check PM2 logs for errors:
```bash
pm2 logs hrm-backend --lines 100
pm2 logs hrm-frontend --lines 100
```
- Test key API endpoints (leave request, timesheet, payslip, login) via UI or curl.
- Verify database schema:
  - Columns like `month`, `hoursWorked`, `totalHoursWorked` exist in `timesheets`.
  - `SequelizeMeta` table is present and up to date.
- Confirm leave requests and timesheet submissions work for users.

## 6. Rollback Steps (if needed)
- Restore database from backup.
- Revert codebase to previous commit:
```bash
git checkout <previous_commit_hash>
```
- Restart services as above.

## 7. Additional Notes
- Always test on staging before production.
- Document any manual changes made during deployment.
- For major schema changes, coordinate with the dev team for migration scripts.

---

**For questions or troubleshooting, refer to the project README or contact the deployment owner.**
