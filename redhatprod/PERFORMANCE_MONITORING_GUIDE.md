# Performance Monitoring in RHEL Production Environment

## 🚀 Overview

The Skyraksys HRM Performance Dashboard provides comprehensive monitoring for both **client-side performance** (for all users) and **server-side performance** (for admins only) in your RHEL 9.6 production environment.

## 📊 Server Metrics (Admin Only)

When you access the Performance Dashboard as an admin user, you'll see detailed server metrics including:

### System Information
- **Hostname**: Your RHEL server hostname
- **OS Version**: Red Hat Enterprise Linux 9.6 (detected automatically)
- **Architecture**: x86_64 (or your server's architecture)
- **Node.js Version**: Currently running version
- **Environment**: Production/Development status
- **Uptime**: Server uptime in human-readable format

### CPU Metrics
- **Core Count**: Number of CPU cores available
- **CPU Model**: Processor model information
- **Load Average**: 1min, 5min, 15min load averages
- **Load Status**: Interpreted as low/moderate/high based on core count
- **CPU Usage**: User and system CPU time

### Memory Metrics
- **System Memory**: Total/Free/Used memory in MB
- **Memory Usage %**: Percentage of system memory used
- **Process Memory**: Node.js process memory breakdown (RSS, Heap Total, Heap Used, External)
- **Visual Progress Bars**: Color-coded based on usage levels
  - Green: < 60% usage
  - Yellow: 60-80% usage
  - Red: > 80% usage

### Database Metrics
- **Connection Status**: PostgreSQL connectivity test
- **Response Time**: Database query response time in milliseconds
- **Database Version**: PostgreSQL version information
- **Connection Pool**: Active/Idle/Waiting connections
- **Table Count**: Number of tables in the database
- **Health Check**: Real-time database authentication test

### Network & Process Information
- **Network Interfaces**: Available network interfaces (excluding loopback)
- **Process ID**: Current Node.js process ID
- **Process Uptime**: How long the backend has been running
- **Interface Details**: IPv4 addresses per interface

## 🖥️ Client Metrics (All Users)

Regular users see client-side performance metrics:

### Performance Score
- **Overall Score**: Calculated based on page load times, memory usage, and responsiveness
- **Color Coding**: Green (80+), Yellow (60-79), Red (<60)

### Page Performance
- **Page Load Time**: Total page load duration
- **DNS Lookup**: Domain name resolution time
- **TCP Connection**: Connection establishment time
- **Server Response**: Backend response time
- **DOM Ready**: Time until DOM is interactive
- **First Contentful Paint**: Time to first visual content

### Client System Info
- **Platform**: Operating system (Windows, macOS, Linux)
- **Language**: Browser language setting
- **Screen Resolution**: Monitor resolution
- **Viewport Size**: Browser window size
- **Connection Status**: Online/Offline status
- **Connection Type**: Network connection type and speed (if available)

### Memory Usage (Browser)
- **JS Memory Used**: JavaScript heap usage in MB
- **Memory Limit**: Browser memory limit
- **Usage Percentage**: Visual indicator of memory consumption

## 🔧 RHEL Production Setup

To enable full performance monitoring in your RHEL environment:

1. **Run the Setup Script** (as root):
   ```bash
   cd /opt/skyraksys-hrm/redhatprod/scripts
   sudo bash setup-performance-monitoring.sh
   ```

2. **What This Sets Up**:
   - System metrics collection every 5 minutes
   - Performance alerts for high CPU/Memory/Disk usage
   - Log rotation for performance data (30 days retention)
   - Rsyslog configuration for centralized alerting
   - Monitoring tools (htop, iotop, nethogs)

3. **Monitoring Commands**:
   ```bash
   # View current system performance summary
   /opt/skyraksys-hrm/monitoring/performance-summary.sh
   
   # Test performance API endpoints
   /opt/skyraksys-hrm/monitoring/test-performance-api.sh
   
   # View real-time system stats
   tail -f /var/log/skyraksys-hrm/performance/system-stats.log
   
   # View performance alerts
   tail -f /var/log/skyraksys-hrm/performance/alerts.log
   ```

## 🚨 Alert Thresholds

The system automatically monitors and alerts on:

- **CPU Usage**: > 85%
- **Memory Usage**: > 90%
- **Disk Usage**: > 85%
- **Load Average**: > 4.0
- **Database Response**: > 2000ms

Alerts are logged to both syslog and performance log files.

## 📱 Accessing the Dashboard

1. **Login as Admin**: Use an admin account to see server metrics
2. **Navigate**: Go to `/performance` or click "Performance" in the manager dashboard
3. **Tabs**: Switch between "Client Performance" and "Server Performance" tabs
4. **Auto-Refresh**: Toggle automatic refresh every 5 seconds
5. **Real-Time**: All metrics update in real-time

## 🔍 Troubleshooting

### If Server Metrics Don't Load:
1. Check backend logs: `journalctl -u skyraksys-hrm-backend -f`
2. Verify admin permissions in database
3. Test API endpoint: `curl http://localhost:3001/api/performance/health-metrics`

### If Client Metrics Are Missing:
1. Check browser console for JavaScript errors
2. Verify Performance API is supported (modern browsers)
3. Check network connectivity to backend

### Performance Issues:
1. Run: `/opt/skyraksys-hrm/monitoring/performance-summary.sh`
2. Check system logs: `journalctl -f | grep "HRM Performance"`
3. Monitor resource usage: `htop` or `top`

## 📈 Benefits for RHEL Production

- **Proactive Monitoring**: Identify issues before they affect users
- **Resource Planning**: Track usage trends for capacity planning  
- **Performance Optimization**: Real-time insights into bottlenecks
- **Health Monitoring**: Comprehensive system and application health
- **Alert System**: Automated notifications for critical issues
- **Historical Data**: Log rotation preserves 30 days of metrics

The performance dashboard integrates seamlessly with your existing RHEL monitoring infrastructure and provides both technical administrators and end-users with the insights they need.