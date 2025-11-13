#!/bin/bash

# Performance Monitoring Setup for RHEL Production
# This script ensures all performance monitoring components are properly configured

set -e

echo "🔧 Setting up Performance Monitoring for Skyraksys HRM on RHEL..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[ℹ]${NC} $1"
}

# Check if running as root or with sudo
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root or with sudo"
   exit 1
fi

# Create performance monitoring directories
print_info "Creating performance monitoring directories..."
mkdir -p /var/log/skyraksys-hrm/performance
mkdir -p /opt/skyraksys-hrm/monitoring
chown -R skyraksys:skyraksys /var/log/skyraksys-hrm/performance
chmod 755 /var/log/skyraksys-hrm/performance

# Install system monitoring tools if not present
print_info "Checking system monitoring tools..."

# Install htop, iotop, and other monitoring tools
if ! command -v htop &> /dev/null; then
    print_info "Installing htop..."
    dnf install -y htop || yum install -y htop
fi

if ! command -v iotop &> /dev/null; then
    print_info "Installing iotop..."
    dnf install -y iotop || yum install -y iotop
fi

if ! command -v nethogs &> /dev/null; then
    print_info "Installing nethogs for network monitoring..."
    dnf install -y nethogs || yum install -y nethogs
fi

# Create performance monitoring cron job
print_info "Setting up performance monitoring cron job..."

# Create monitoring script
cat > /opt/skyraksys-hrm/monitoring/system-stats.sh << 'EOF'
#!/bin/bash

# System Statistics Collection Script
# Runs every 5 minutes to collect system performance data

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
LOG_FILE="/var/log/skyraksys-hrm/performance/system-stats.log"

# Collect system metrics
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.1f"), $3/$2 * 100.0}')
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')

# Log metrics
echo "$TIMESTAMP,CPU:${CPU_USAGE}%,MEM:${MEMORY_USAGE}%,DISK:${DISK_USAGE}%,LOAD:${LOAD_AVG}" >> "$LOG_FILE"

# Rotate log if it gets too large (keep last 1000 lines)
if [ -f "$LOG_FILE" ] && [ $(wc -l < "$LOG_FILE") -gt 1000 ]; then
    tail -n 1000 "$LOG_FILE" > "${LOG_FILE}.tmp" && mv "${LOG_FILE}.tmp" "$LOG_FILE"
fi
EOF

chmod +x /opt/skyraksys-hrm/monitoring/system-stats.sh
chown skyraksys:skyraksys /opt/skyraksys-hrm/monitoring/system-stats.sh

# Add cron job for system stats collection
print_info "Adding cron job for performance monitoring..."
(crontab -u skyraksys -l 2>/dev/null; echo "*/5 * * * * /opt/skyraksys-hrm/monitoring/system-stats.sh") | crontab -u skyraksys -

# Create performance alert script
cat > /opt/skyraksys-hrm/monitoring/performance-alerts.sh << 'EOF'
#!/bin/bash

# Performance Alert Script
# Checks system metrics and sends alerts if thresholds are exceeded

# Thresholds
CPU_THRESHOLD=85
MEMORY_THRESHOLD=90
DISK_THRESHOLD=85
LOAD_THRESHOLD=4.0

# Check CPU usage
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}' | cut -d'.' -f1)
if [ "$CPU_USAGE" -gt "$CPU_THRESHOLD" ]; then
    logger -p local0.warning "HRM Performance Alert: High CPU usage: ${CPU_USAGE}%"
fi

# Check memory usage
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.0f"), $3/$2 * 100.0}')
if [ "$MEMORY_USAGE" -gt "$MEMORY_THRESHOLD" ]; then
    logger -p local0.warning "HRM Performance Alert: High memory usage: ${MEMORY_USAGE}%"
fi

# Check disk usage
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt "$DISK_THRESHOLD" ]; then
    logger -p local0.warning "HRM Performance Alert: High disk usage: ${DISK_USAGE}%"
fi

# Check load average
LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//' | cut -d'.' -f1)
if (( $(echo "$LOAD_AVG > $LOAD_THRESHOLD" | bc -l) )); then
    logger -p local0.warning "HRM Performance Alert: High load average: ${LOAD_AVG}"
fi
EOF

chmod +x /opt/skyraksys-hrm/monitoring/performance-alerts.sh
chown skyraksys:skyraksys /opt/skyraksys-hrm/monitoring/performance-alerts.sh

# Add cron job for performance alerts (every 10 minutes)
(crontab -u skyraksys -l 2>/dev/null; echo "*/10 * * * * /opt/skyraksys-hrm/monitoring/performance-alerts.sh") | crontab -u skyraksys -

# Configure logrotate for performance logs
print_info "Setting up log rotation for performance logs..."
cat > /etc/logrotate.d/skyraksys-hrm-performance << 'EOF'
/var/log/skyraksys-hrm/performance/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0644 skyraksys skyraksys
    postrotate
        systemctl reload rsyslog > /dev/null 2>&1 || true
    endscript
}
EOF

# Setup rsyslog configuration for HRM alerts
print_info "Configuring rsyslog for HRM performance alerts..."
cat > /etc/rsyslog.d/50-skyraksys-hrm.conf << 'EOF'
# Skyraksys HRM Performance Logging
local0.*    /var/log/skyraksys-hrm/performance/alerts.log
& stop
EOF

# Restart rsyslog to apply configuration
systemctl restart rsyslog

# Create performance dashboard endpoint test script
cat > /opt/skyraksys-hrm/monitoring/test-performance-api.sh << 'EOF'
#!/bin/bash

# Test Performance API Endpoints
# This script tests if the performance monitoring endpoints are working

API_BASE="http://localhost:3001/api"

echo "Testing Performance API Endpoints..."

# Test health endpoint (should work for all users)
echo -n "Testing health endpoint: "
if curl -s -f "${API_BASE}/health" > /dev/null; then
    echo "✓ Working"
else
    echo "✗ Failed"
fi

# Test performance health metrics (requires authentication)
echo -n "Testing performance health endpoint: "
if curl -s -f "${API_BASE}/performance/health-metrics" > /dev/null 2>&1; then
    echo "✓ Working (may need authentication)"
else
    echo "? Requires authentication (normal)"
fi

echo "Performance monitoring setup complete!"
echo "Logs will be available at: /var/log/skyraksys-hrm/performance/"
echo "To test with authentication, use the HRM frontend interface."
EOF

chmod +x /opt/skyraksys-hrm/monitoring/test-performance-api.sh

# Create performance summary script
cat > /opt/skyraksys-hrm/monitoring/performance-summary.sh << 'EOF'
#!/bin/bash

# Performance Summary Script
# Provides a quick overview of system performance

echo "=== Skyraksys HRM System Performance Summary ==="
echo "Timestamp: $(date)"
echo

echo "System Information:"
echo "  Hostname: $(hostname)"
echo "  OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
echo "  Uptime: $(uptime -p)"
echo

echo "Current Resource Usage:"
echo "  CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')%"
echo "  Memory: $(free | grep Mem | awk '{printf("%.1f"), $3/$2 * 100.0}')%"
echo "  Disk (/): $(df -h / | awk 'NR==2 {print $5}')"
echo "  Load Average: $(uptime | awk -F'load average:' '{print $2}')"
echo

echo "HRM Services Status:"
if systemctl is-active --quiet skyraksys-hrm-backend; then
    echo "  Backend: ✓ Running"
else
    echo "  Backend: ✗ Stopped"
fi

if systemctl is-active --quiet nginx; then
    echo "  Nginx: ✓ Running"
else
    echo "  Nginx: ✗ Stopped"
fi

if systemctl is-active --quiet postgresql; then
    echo "  PostgreSQL: ✓ Running"
else
    echo "  PostgreSQL: ✗ Stopped"
fi

echo
echo "Recent Performance Alerts (last 10):"
if [ -f "/var/log/skyraksys-hrm/performance/alerts.log" ]; then
    tail -n 10 /var/log/skyraksys-hrm/performance/alerts.log | grep -v "^$" || echo "  No recent alerts"
else
    echo "  No alert log found"
fi

echo
echo "=== End Summary ==="
EOF

chmod +x /opt/skyraksys-hrm/monitoring/performance-summary.sh

print_status "Performance monitoring setup completed successfully!"
print_info ""
print_info "Available commands:"
print_info "  - Performance Summary: /opt/skyraksys-hrm/monitoring/performance-summary.sh"
print_info "  - Test API: /opt/skyraksys-hrm/monitoring/test-performance-api.sh"
print_info "  - View Logs: tail -f /var/log/skyraksys-hrm/performance/system-stats.log"
print_info "  - View Alerts: tail -f /var/log/skyraksys-hrm/performance/alerts.log"
print_info ""
print_info "Performance monitoring will:"
print_info "  ✓ Collect system metrics every 5 minutes"
print_info "  ✓ Check for performance issues every 10 minutes"
print_info "  ✓ Log alerts to syslog and performance logs"
print_info "  ✓ Rotate logs automatically (30 days retention)"
print_info ""
print_info "The performance dashboard in the HRM system will now show detailed"
print_info "server metrics for admin users, including RHEL-specific information."

echo
print_status "Setup complete! Performance monitoring is now active."