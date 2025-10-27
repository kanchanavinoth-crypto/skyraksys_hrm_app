#!/bin/bash

# SkyrakSys HRM - System Maintenance and Monitoring Script
# Version: 2.0.0
# For Red Hat Enterprise Linux

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
APP_NAME="skyraksys_hrm"
APP_USER="hrm"
APP_DIR="/opt/${APP_NAME}"
LOG_DIR="/var/log/${APP_NAME}"
BACKUP_DIR="/opt/backups/${APP_NAME}"

print_header() {
    echo -e "${BLUE}
╔══════════════════════════════════════════════════════════════╗
║              SkyrakSys HRM Maintenance Tool                  ║
║                Red Hat Linux Edition                        ║
╚══════════════════════════════════════════════════════════════╝
${NC}"
}

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check system status
check_system_status() {
    print_status "Checking system status..."
    
    echo -e "\n${BLUE}System Information:${NC}"
    echo "• Hostname: $(hostname)"
    echo "• OS: $(cat /etc/redhat-release)"
    echo "• Kernel: $(uname -r)"
    echo "• Uptime: $(uptime | cut -d',' -f1)"
    echo "• Load Average: $(uptime | awk -F'load average:' '{print $2}')"
    
    echo -e "\n${BLUE}Memory Usage:${NC}"
    free -h
    
    echo -e "\n${BLUE}Disk Usage:${NC}"
    df -h | grep -E '/$|/opt|/var'
    
    echo -e "\n${BLUE}Network Status:${NC}"
    ss -tulpn | grep -E ':80|:443|:8080|:5432'
}

# Function to check service status
check_services() {
    print_status "Checking service status..."
    
    echo -e "\n${BLUE}Service Status:${NC}"
    
    services=("postgresql-15" "nginx" "skyraksys-hrm")
    for service in "${services[@]}"; do
        if systemctl is-active --quiet "$service"; then
            echo -e "• $service: ${GREEN}RUNNING${NC}"
        else
            echo -e "• $service: ${RED}STOPPED${NC}"
        fi
    done
    
    echo -e "\n${BLUE}PM2 Processes:${NC}"
    sudo -u "$APP_USER" pm2 status 2>/dev/null || echo "PM2 not running or accessible"
}

# Function to check application health
check_application() {
    print_status "Checking application health..."
    
    echo -e "\n${BLUE}Application Health Check:${NC}"
    
    # Test API endpoint
    if curl -s http://localhost:8080/api/health > /dev/null; then
        echo -e "• Backend API: ${GREEN}HEALTHY${NC}"
    else
        echo -e "• Backend API: ${RED}UNHEALTHY${NC}"
    fi
    
    # Test database connection
    if sudo -u postgres psql -d skyraksys_hrm -c "SELECT 1;" > /dev/null 2>&1; then
        echo -e "• Database: ${GREEN}CONNECTED${NC}"
    else
        echo -e "• Database: ${RED}CONNECTION FAILED${NC}"
    fi
    
    # Test Nginx
    if curl -s http://localhost/nginx-health > /dev/null; then
        echo -e "• Nginx: ${GREEN}RESPONDING${NC}"
    else
        echo -e "• Nginx: ${RED}NOT RESPONDING${NC}"
    fi
    
    # Check SSL certificate (if configured)
    if [[ -f "/etc/letsencrypt/live/$(hostname)/fullchain.pem" ]]; then
        CERT_EXPIRE=$(openssl x509 -enddate -noout -in "/etc/letsencrypt/live/$(hostname)/fullchain.pem" | cut -d= -f2)
        echo -e "• SSL Certificate: ${GREEN}VALID${NC} (Expires: $CERT_EXPIRE)"
    else
        echo -e "• SSL Certificate: ${YELLOW}NOT CONFIGURED${NC}"
    fi
}

# Function to view logs
view_logs() {
    local log_type="${1:-all}"
    
    print_status "Viewing logs ($log_type)..."
    
    case $log_type in
        "app"|"application")
            print_status "Application logs (last 50 lines):"
            tail -n 50 "$LOG_DIR/combined.log" 2>/dev/null || echo "Application log not found"
            ;;
        "error")
            print_status "Error logs (last 50 lines):"
            tail -n 50 "$LOG_DIR/error.log" 2>/dev/null || echo "Error log not found"
            ;;
        "nginx")
            print_status "Nginx access logs (last 20 lines):"
            tail -n 20 /var/log/nginx/skyraksys_hrm_access.log 2>/dev/null || tail -n 20 /var/log/nginx/access.log
            print_status "Nginx error logs (last 20 lines):"
            tail -n 20 /var/log/nginx/skyraksys_hrm_error.log 2>/dev/null || tail -n 20 /var/log/nginx/error.log
            ;;
        "postgres")
            print_status "PostgreSQL logs (last 20 lines):"
            tail -n 20 /var/lib/pgsql/15/data/log/postgresql-*.log 2>/dev/null || echo "PostgreSQL log not found"
            ;;
        "all"|*)
            print_status "All logs (last 20 lines each):"
            echo -e "\n${BLUE}Application Logs:${NC}"
            tail -n 20 "$LOG_DIR/combined.log" 2>/dev/null || echo "Application log not found"
            
            echo -e "\n${BLUE}Nginx Logs:${NC}"
            tail -n 20 /var/log/nginx/access.log 2>/dev/null || echo "Nginx log not found"
            
            echo -e "\n${BLUE}System Logs:${NC}"
            journalctl -u skyraksys-hrm --no-pager -n 10 2>/dev/null || echo "System log not found"
            ;;
    esac
}

# Function to backup database
backup_database() {
    print_status "Creating database backup..."
    
    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/skyraksys_hrm_$(date +%Y%m%d_%H%M%S).sql"
    
    if sudo -u postgres pg_dump skyraksys_hrm > "$BACKUP_FILE"; then
        gzip "$BACKUP_FILE"
        print_status "Database backup created: ${BACKUP_FILE}.gz"
        
        # Clean old backups (keep last 7 days)
        find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete
        print_status "Old backups cleaned (kept last 7 days)"
    else
        print_error "Database backup failed"
        return 1
    fi
}

# Function to restart services
restart_services() {
    local service="${1:-all}"
    
    print_status "Restarting services ($service)..."
    
    case $service in
        "app"|"application")
            systemctl restart skyraksys-hrm
            sudo -u "$APP_USER" pm2 restart all
            print_status "Application restarted"
            ;;
        "nginx")
            nginx -t && systemctl restart nginx
            print_status "Nginx restarted"
            ;;
        "postgres")
            systemctl restart postgresql-15
            print_status "PostgreSQL restarted"
            ;;
        "all"|*)
            systemctl restart postgresql-15
            sleep 2
            systemctl restart skyraksys-hrm
            sleep 2
            systemctl restart nginx
            print_status "All services restarted"
            ;;
    esac
}

# Function to update application
update_application() {
    print_status "Updating SkyrakSys HRM application..."
    
    # Backup current version
    BACKUP_APP_DIR="/opt/backups/${APP_NAME}_app_$(date +%Y%m%d_%H%M%S)"
    cp -r "$APP_DIR" "$BACKUP_APP_DIR"
    print_status "Current version backed up to: $BACKUP_APP_DIR"
    
    # Stop application
    systemctl stop skyraksys-hrm
    sudo -u "$APP_USER" pm2 stop all
    
    # Update from git
    cd "$APP_DIR"
    sudo -u "$APP_USER" git fetch origin
    sudo -u "$APP_USER" git pull origin main
    
    # Update dependencies
    cd "$APP_DIR/backend"
    sudo -u "$APP_USER" npm ci --production
    
    cd "$APP_DIR/frontend"
    sudo -u "$APP_USER" npm ci
    sudo -u "$APP_USER" npm run build
    
    # Run migrations
    cd "$APP_DIR/backend"
    sudo -u "$APP_USER" npm run migrate
    
    # Restart services
    systemctl start skyraksys-hrm
    sudo -u "$APP_USER" pm2 restart all
    
    print_status "Application updated successfully"
}

# Function to optimize database
optimize_database() {
    print_status "Optimizing database..."
    
    sudo -u postgres psql -d skyraksys_hrm << EOF
VACUUM ANALYZE;
REINDEX DATABASE skyraksys_hrm;
\q
EOF
    
    print_status "Database optimization completed"
}

# Function to check disk space
check_disk_space() {
    print_status "Checking disk space..."
    
    echo -e "\n${BLUE}Disk Usage by Directory:${NC}"
    du -sh "$APP_DIR" "$LOG_DIR" /var/log/nginx /var/lib/pgsql 2>/dev/null
    
    echo -e "\n${BLUE}Large Files (>100MB):${NC}"
    find /opt /var/log -type f -size +100M -exec ls -lh {} \; 2>/dev/null | head -10
    
    echo -e "\n${BLUE}Log File Sizes:${NC}"
    find /var/log -name "*.log" -exec ls -lh {} \; 2>/dev/null | head -10
}

# Function to show help
show_help() {
    echo -e "${BLUE}SkyrakSys HRM Maintenance Tool${NC}"
    echo -e "\nUsage: $0 [COMMAND]"
    echo -e "\nCommands:"
    echo "  status          Show system and service status"
    echo "  health          Check application health"
    echo "  logs [TYPE]     View logs (app|error|nginx|postgres|all)"
    echo "  backup          Create database backup"
    echo "  restart [TYPE]  Restart services (app|nginx|postgres|all)"
    echo "  update          Update application from git"
    echo "  optimize        Optimize database"
    echo "  disk            Check disk space usage"
    echo "  monitor         Continuous monitoring mode"
    echo "  help            Show this help message"
    echo -e "\nExamples:"
    echo "  $0 status"
    echo "  $0 logs nginx"
    echo "  $0 restart app"
    echo "  $0 backup"
}

# Function for continuous monitoring
continuous_monitor() {
    print_status "Starting continuous monitoring (Press Ctrl+C to stop)..."
    
    while true; do
        clear
        print_header
        check_system_status
        check_services
        check_application
        
        echo -e "\n${BLUE}Refreshing in 30 seconds...${NC}"
        sleep 30
    done
}

# Main function
main() {
    local command="${1:-help}"
    
    case $command in
        "status")
            print_header
            check_system_status
            check_services
            ;;
        "health")
            print_header
            check_application
            ;;
        "logs")
            print_header
            view_logs "$2"
            ;;
        "backup")
            print_header
            backup_database
            ;;
        "restart")
            print_header
            restart_services "$2"
            ;;
        "update")
            print_header
            update_application
            ;;
        "optimize")
            print_header
            optimize_database
            ;;
        "disk")
            print_header
            check_disk_space
            ;;
        "monitor")
            continuous_monitor
            ;;
        "help"|*)
            print_header
            show_help
            ;;
    esac
}

# Check if running as root for certain operations
if [[ "$1" =~ ^(restart|update|backup)$ ]] && [[ $EUID -ne 0 ]]; then
    print_error "This command requires root privileges (use sudo)"
    exit 1
fi

# Run main function
main "$@"
