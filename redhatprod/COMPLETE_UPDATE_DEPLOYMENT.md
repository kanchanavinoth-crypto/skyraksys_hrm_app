# 🚀 Complete HRM Update Deployment Guide

## Quick Deployment (One Command)

From your local development machine:

```bash
# Navigate to project root
cd /path/to/skyraksys_hrm1

# Make script executable
chmod +x skyraksys_hrm_app/redhatprod/scripts/deploy-complete-update.sh

# Deploy to production (replace with your server IP)
bash skyraksys_hrm_app/redhatprod/scripts/deploy-complete-update.sh 95.216.14.232
```

## What Gets Updated

### 🎯 **Frontend Changes**
- ✅ **Performance Dashboard**: Client metrics for all users
- ✅ **Manager Dashboard**: Quick Actions with badges
- ✅ **Minimalistic UI**: Streamlined timesheet interfaces
- ✅ **Role-based Controls**: Proper access restrictions
- ✅ **Navigation Updates**: New performance routes

### 🔧 **Backend Changes**
- ✅ **Performance Routes**: `/api/performance/*` endpoints
- ✅ **Server Metrics**: RHEL-specific system monitoring
- ✅ **Database Metrics**: PostgreSQL performance tracking
- ✅ **Timesheet Fixes**: Approval validation corrections
- ✅ **Auth Improvements**: Better role checking

### 🗄️ **Database Changes**
- ✅ **Schema Updates**: Any pending migrations
- ✅ **Performance Monitoring**: Database health tracking
- ✅ **Connection Pooling**: Enhanced pool monitoring

### 🖥️ **RHEL Production Features**
- ✅ **System Monitoring**: Automated performance collection
- ✅ **Alert System**: Resource usage notifications
- ✅ **Log Management**: 30-day retention with rotation
- ✅ **Health Checks**: Comprehensive service monitoring

## Deployment Process

The script automatically:

1. **📦 Packages** the latest code (excludes dev files)
2. **🔄 Transfers** files to your RHEL server
3. **⏸️ Stops** services safely
4. **💾 Backs up** current configuration
5. **📂 Extracts** new application code
6. **📥 Installs** dependencies (npm install)
7. **🔄 Migrates** database changes
8. **🏗️ Builds** frontend application
9. **🚀 Deploys** to nginx directory
10. **⚙️ Configures** performance monitoring
11. **▶️ Starts** all services
12. **🔍 Verifies** deployment health

## New Features Available After Deployment

### For Admin Users:
- **Performance Dashboard**: Detailed server metrics at `/performance`
- **Server Monitoring**: CPU, memory, database, network stats
- **RHEL Metrics**: OS version, load average, disk usage
- **Real-time Data**: Auto-refreshing every 5 seconds

### For Manager Users:
- **Quick Actions**: Direct access to approvals and reports
- **Badge Indicators**: Shows pending leave/timesheet counts
- **Minimalistic View**: Cleaner, faster interfaces

### For All Users:
- **Client Performance**: Browser metrics and load times
- **System Health**: Connection status and performance scores
- **Improved UI**: Faster, more responsive interface

## Post-Deployment Verification

After deployment completes, verify:

```bash
# Test API health
curl http://95.216.14.232:3001/api/health

# Test frontend
curl http://95.216.14.232/

# Check services on server
ssh root@95.216.14.232 "systemctl status skyraksys-hrm-backend nginx postgresql"
```

## Monitoring Commands (On Server)

```bash
# Quick performance overview
/opt/skyraksys-hrm/monitoring/performance-summary.sh

# View application logs
journalctl -u skyraksys-hrm-backend -f

# Check system performance
/opt/skyraksys-hrm/monitoring/test-performance-api.sh

# Monitor resource usage
htop
```

## Rollback (If Needed)

If issues arise, rollback using:

```bash
# On server - restore from backup
ssh root@95.216.14.232
cd /opt/skyraksys-hrm/backups
ls -la  # Find latest backup
# Restore from backup directory as needed
```

## Access After Deployment

- **Application**: http://95.216.14.232/
- **API Health**: http://95.216.14.242:3001/api/health
- **Performance Dashboard**: Login as admin → Performance tab
- **Manager Dashboard**: Login as manager → Quick Actions

## Troubleshooting

### If deployment fails:
1. Check SSH connectivity: `ssh root@95.216.14.232`
2. Verify server has space: `df -h`
3. Check service status: `systemctl status skyraksys-hrm-backend`

### If services don't start:
1. Check logs: `journalctl -u skyraksys-hrm-backend -n 50`
2. Verify database: `systemctl status postgresql`
3. Test configuration: `nginx -t`

### If frontend not loading:
1. Check nginx status: `systemctl status nginx`
2. Verify build files: `ls -la /var/www/html/hrm/`
3. Check nginx logs: `journalctl -u nginx -n 20`

## Support

This deployment includes all the latest features:
- Performance monitoring dashboards
- Manager dashboard improvements
- Timesheet system fixes
- Enhanced role-based access
- RHEL production optimizations

The system is now production-ready with comprehensive monitoring and improved user experience!