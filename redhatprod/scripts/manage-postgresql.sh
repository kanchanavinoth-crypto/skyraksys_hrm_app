#!/bin/bash

# PostgreSQL Service Management Script for RHEL
# Manages PostgreSQL service with custom configuration

echo "🗄️ PostgreSQL Service Manager"
echo "============================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Service configuration
SERVICE_NAME="postgresql"
CUSTOM_SERVICE="postgresql-skyraksys"
SYSTEMD_DIR="/etc/systemd/system"

case "$1" in
    install)
        print_info "Installing custom PostgreSQL service unit..."
        
        # Copy custom service file
        if [ -f "redhatprod/systemd/postgresql-skyraksys.service" ]; then
            cp redhatprod/systemd/postgresql-skyraksys.service $SYSTEMD_DIR/
            chmod 644 $SYSTEMD_DIR/postgresql-skyraksys.service
            
            # Reload systemd
            systemctl daemon-reload
            print_status $? "Custom PostgreSQL service installed"
            
            # Enable the service
            systemctl enable postgresql-skyraksys
            print_status $? "Service enabled for startup"
        else
            print_status 1 "Service file not found"
            exit 1
        fi
        ;;
        
    start)
        print_info "Starting PostgreSQL service..."
        systemctl start $SERVICE_NAME
        print_status $? "PostgreSQL service started"
        
        # Check if custom service exists and start it too
        if [ -f "$SYSTEMD_DIR/postgresql-skyraksys.service" ]; then
            systemctl start postgresql-skyraksys
            print_status $? "Custom PostgreSQL service started"
        fi
        ;;
        
    stop)
        print_info "Stopping PostgreSQL service..."
        systemctl stop $SERVICE_NAME
        print_status $? "PostgreSQL service stopped"
        
        if [ -f "$SYSTEMD_DIR/postgresql-skyraksys.service" ]; then
            systemctl stop postgresql-skyraksys
            print_status $? "Custom PostgreSQL service stopped"
        fi
        ;;
        
    restart)
        print_info "Restarting PostgreSQL service..."
        systemctl restart $SERVICE_NAME
        print_status $? "PostgreSQL service restarted"
        
        if [ -f "$SYSTEMD_DIR/postgresql-skyraksys.service" ]; then
            systemctl restart postgresql-skyraksys
            print_status $? "Custom PostgreSQL service restarted"
        fi
        ;;
        
    status)
        echo ""
        print_info "PostgreSQL Service Status:"
        echo "========================="
        
        # Main PostgreSQL service
        echo -e "${BLUE}Main PostgreSQL Service:${NC}"
        systemctl status $SERVICE_NAME --no-pager -l
        
        echo ""
        
        # Custom service (if exists)
        if [ -f "$SYSTEMD_DIR/postgresql-skyraksys.service" ]; then
            echo -e "${BLUE}Custom PostgreSQL Service:${NC}"
            systemctl status postgresql-skyraksys --no-pager -l
        fi
        
        echo ""
        print_info "Database Connection Test:"
        if sudo -u postgres psql -c '\l' > /dev/null 2>&1; then
            print_status 0 "Database connection successful"
        else
            print_status 1 "Database connection failed"
        fi
        ;;
        
    logs)
        print_info "PostgreSQL Service Logs:"
        echo "========================"
        journalctl -u $SERVICE_NAME -f --no-pager
        ;;
        
    backup)
        print_info "Creating database backup..."
        if [ -f "/opt/skyraksys-hrm/scripts/backup-database.sh" ]; then
            /opt/skyraksys-hrm/scripts/backup-database.sh
            print_status $? "Database backup completed"
        else
            print_status 1 "Backup script not found"
        fi
        ;;
        
    health)
        print_info "PostgreSQL Health Check:"
        echo "========================"
        
        # Service status
        if systemctl is-active --quiet $SERVICE_NAME; then
            print_status 0 "PostgreSQL service is running"
        else
            print_status 1 "PostgreSQL service is not running"
        fi
        
        # Database connectivity
        if sudo -u postgres psql -c 'SELECT version();' > /dev/null 2>&1; then
            print_status 0 "Database connectivity OK"
        else
            print_status 1 "Database connectivity failed"
        fi
        
        # Check HRM database
        if sudo -u postgres psql -d skyraksys_hrm -c 'SELECT 1;' > /dev/null 2>&1; then
            print_status 0 "HRM database accessible"
        else
            print_status 1 "HRM database not accessible"
        fi
        
        # Connection count
        CONNECTIONS=$(sudo -u postgres psql -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null | xargs)
        if [ -n "$CONNECTIONS" ]; then
            echo -e "${BLUE}Active connections: $CONNECTIONS${NC}"
        fi
        
        # Database size
        DB_SIZE=$(sudo -u postgres psql -d skyraksys_hrm -t -c "SELECT pg_size_pretty(pg_database_size('skyraksys_hrm'));" 2>/dev/null | xargs)
        if [ -n "$DB_SIZE" ]; then
            echo -e "${BLUE}Database size: $DB_SIZE${NC}"
        fi
        ;;
        
    *)
        echo "Usage: $0 {install|start|stop|restart|status|logs|backup|health}"
        echo ""
        echo "Commands:"
        echo "  install  - Install custom PostgreSQL service unit"
        echo "  start    - Start PostgreSQL service"
        echo "  stop     - Stop PostgreSQL service"
        echo "  restart  - Restart PostgreSQL service"
        echo "  status   - Show service status"
        echo "  logs     - Show service logs"
        echo "  backup   - Create database backup"
        echo "  health   - Perform health check"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✨ PostgreSQL service management completed!${NC}"