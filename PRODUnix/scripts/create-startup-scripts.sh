#!/bin/bash

# ============================================
# Startup Scripts Creation (Unix/Linux)
# ============================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

echo ""
log $CYAN "[Startup Scripts] Creating application startup scripts..."

# Create package.json with production scripts
log $YELLOW "Creating root package.json..."
cat > package.json << 'EOF'
{
  "name": "skyraksys-hrm-production",
  "version": "2.0.0",
  "description": "SkyRakSys HRM Production Environment",
  "scripts": {
    "start": "npm run start:production",
    "start:production": "concurrently \"npm run start:backend\" \"npm run serve:frontend\"",
    "start:backend": "cd backend && npm start",
    "serve:frontend": "npx serve -s frontend/build -l 3000",
    "start:pm2": "pm2 start ecosystem.config.js",
    "stop": "pm2 stop ecosystem.config.js",
    "restart": "pm2 restart ecosystem.config.js",
    "reload": "pm2 reload ecosystem.config.js",
    "delete": "pm2 delete ecosystem.config.js",
    "logs": "pm2 logs",
    "logs:backend": "pm2 logs skyraksys-hrm-backend",
    "monit": "pm2 monit",
    "status": "pm2 status",
    "build": "cd frontend && npm run build",
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "cd backend && npm run dev",
    "dev:frontend": "cd frontend && npm start",
    "migrate": "cd backend && npm run migrate",
    "seed": "cd backend && npm run seed",
    "test": "npm run test:backend",
    "test:backend": "cd backend && npm test",
    "backup": "node scripts/backup-database.js",
    "health": "node scripts/health-check.js",
    "setup": "node scripts/setup-production.js"
  },
  "dependencies": {
    "concurrently": "^8.2.2",
    "pm2": "^5.3.0",
    "serve": "^14.2.1"
  },
  "engines": {
    "node": ">=16.0.0",
    "npm": ">=8.0.0"
  }
}
EOF

# Create PM2 ecosystem configuration
log $YELLOW "Creating PM2 configuration..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'skyraksys-hrm-backend',
      script: 'server.js',
      cwd: './backend',
      instances: 'max',
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 8080
      },
      error_file: './logs/backend/error.log',
      out_file: './logs/backend/out.log',
      log_file: './logs/backend/combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 5000,
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 8000
    },
    {
      name: 'skyraksys-hrm-frontend',
      script: 'npx',
      args: 'serve -s build -l 3000',
      cwd: './frontend',
      instances: 2,
      exec_mode: 'cluster',
      watch: false,
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/frontend/error.log',
      out_file: './logs/frontend/out.log',
      log_file: './logs/frontend/combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
EOF

# Create start script
log $YELLOW "Creating start script..."
cat > start.sh << 'EOF'
#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}Starting SkyRakSys HRM Production...${NC}"
echo ""

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}Installing PM2...${NC}"
    npm install -g pm2
fi

# Start with PM2
echo -e "${YELLOW}Starting application with PM2...${NC}"
pm2 start ecosystem.config.js

echo ""
echo -e "${GREEN}✅ Application started successfully!${NC}"
echo ""

echo -e "${YELLOW}Available commands:${NC}"
echo "  ./logs.sh       - View logs"
echo "  ./status.sh     - Check status"
echo "  ./stop.sh       - Stop application"
echo "  ./restart.sh    - Restart application"
echo "  pm2 monit       - Monitor processes"
echo ""

echo -e "${CYAN}Web Interface: http://localhost:3000${NC}"
echo -e "${CYAN}API Endpoint: http://localhost:8080${NC}"
echo ""
EOF

# Create stop script
log $YELLOW "Creating stop script..."
cat > stop.sh << 'EOF'
#!/bin/bash

GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}Stopping SkyRakSys HRM Production...${NC}"
pm2 stop ecosystem.config.js
echo -e "${GREEN}✅ Application stopped successfully!${NC}"
EOF

# Create restart script
log $YELLOW "Creating restart script..."
cat > restart.sh << 'EOF'
#!/bin/bash

GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}Restarting SkyRakSys HRM Production...${NC}"
pm2 restart ecosystem.config.js
echo -e "${GREEN}✅ Application restarted successfully!${NC}"
EOF

# Create status script
log $YELLOW "Creating status script..."
cat > status.sh << 'EOF'
#!/bin/bash

CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${CYAN}SkyRakSys HRM Production Status:${NC}"
echo "================================"
pm2 status
echo ""

echo -e "${YELLOW}Application URLs:${NC}"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8080"
echo "  Health:   http://localhost:8080/health"
echo ""

# Check if services are responding
echo -e "${YELLOW}Service Health:${NC}"

# Check backend
if curl -s http://localhost:8080/health > /dev/null 2>&1; then
    echo -e "  Backend:  ${GREEN}✅ Healthy${NC}"
else
    echo -e "  Backend:  ${RED}❌ Not responding${NC}"
fi

# Check frontend
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "  Frontend: ${GREEN}✅ Healthy${NC}"
else
    echo -e "  Frontend: ${RED}❌ Not responding${NC}"
fi

echo ""
EOF

# Create logs script
log $YELLOW "Creating logs script..."
cat > logs.sh << 'EOF'
#!/bin/bash

CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${CYAN}SkyRakSys HRM Production Logs:${NC}"
echo "=============================="
echo ""

echo -e "${YELLOW}Choose log view:${NC}"
echo "1. All logs"
echo "2. Backend only"
echo "3. Frontend only"
echo "4. Error logs only"
echo "5. Live monitoring"
echo "6. Tail recent logs"
echo ""

read -p "Enter choice (1-6): " choice
echo ""

case $choice in
    1)
        pm2 logs
        ;;
    2)
        pm2 logs skyraksys-hrm-backend
        ;;
    3)
        pm2 logs skyraksys-hrm-frontend
        ;;
    4)
        pm2 logs --err
        ;;
    5)
        pm2 monit
        ;;
    6)
        pm2 logs --lines 50
        ;;
    *)
        echo "Invalid choice"
        ;;
esac
EOF

# Create development start script
log $YELLOW "Creating development script..."
cat > start-dev.sh << 'EOF'
#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}Starting SkyRakSys HRM in Development Mode...${NC}"
echo ""

# Install dependencies if needed
if [[ ! -d "node_modules" ]]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

if [[ ! -d "backend/node_modules" ]]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    cd backend
    npm install
    cd ..
fi

if [[ ! -d "frontend/node_modules" ]]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    cd frontend
    npm install
    cd ..
fi

# Start development servers
echo -e "${YELLOW}Starting development servers...${NC}"
npm run dev
EOF

# Create backup script
log $YELLOW "Creating backup script..."
cat > backup.sh << 'EOF'
#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}Creating SkyRakSys HRM Backup...${NC}"
echo "==============================="
echo ""

timestamp=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p backups/$timestamp

# Backup database
echo -e "${YELLOW}Backing up database...${NC}"
if command -v pg_dump &> /dev/null; then
    # Read database config from .env
    if [[ -f backend/.env ]]; then
        DB_HOST=$(grep DB_HOST backend/.env | cut -d '=' -f2)
        DB_USER=$(grep DB_USER backend/.env | cut -d '=' -f2)
        DB_NAME=$(grep DB_NAME backend/.env | cut -d '=' -f2)
        
        pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > backups/$timestamp/database.sql
        
        if [[ $? -eq 0 ]]; then
            gzip backups/$timestamp/database.sql
            echo -e "${GREEN}✅ Database backup completed${NC}"
        else
            echo -e "${RED}❌ Database backup failed${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Backend .env file not found${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  pg_dump not found, skipping database backup${NC}"
fi

# Backup uploads
echo -e "${YELLOW}Backing up uploads...${NC}"
if [[ -d "uploads" ]]; then
    cp -r uploads backups/$timestamp/
    echo -e "${GREEN}✅ Uploads backup completed${NC}"
else
    echo -e "${YELLOW}⚠️  Uploads directory not found${NC}"
fi

# Backup configuration
echo -e "${YELLOW}Backing up configuration...${NC}"
if [[ -f "backend/.env" ]]; then
    cp backend/.env backups/$timestamp/env_backup.txt
fi
if [[ -f "ecosystem.config.js" ]]; then
    cp ecosystem.config.js backups/$timestamp/
fi

echo ""
echo -e "${GREEN}✅ Backup completed: backups/$timestamp/${NC}"
echo ""

echo -e "${YELLOW}Backup contents:${NC}"
echo "  - database.sql.gz  (Database backup)"
echo "  - uploads/         (Uploaded files)"
echo "  - env_backup.txt   (Environment config)"
echo "  - ecosystem.config.js (PM2 config)"
echo ""

# Clean old backups (keep 30 days)
find backups -type d -name "2*" -mtime +30 -exec rm -rf {} \; 2>/dev/null
echo -e "${YELLOW}Old backups cleaned up (keeping 30 days)${NC}"
EOF

# Create health check script
log $YELLOW "Creating health check script..."
cat > health-check.sh << 'EOF'
#!/bin/bash

CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${CYAN}SkyRakSys HRM Health Check${NC}"
echo "=========================="
echo ""

# Check backend
echo -n "Backend API: "
if curl -s -f http://localhost:8080/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Healthy${NC}"
else
    echo -e "${RED}❌ Unhealthy${NC}"
fi

# Check frontend
echo -n "Frontend: "
if curl -s -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Healthy${NC}"
else
    echo -e "${RED}❌ Unhealthy${NC}"
fi

# Check database
echo -n "Database: "
if cd backend && node -e "const {sequelize} = require('./models'); sequelize.authenticate().then(() => process.exit(0)).catch(() => process.exit(1));" 2>/dev/null; then
    echo -e "${GREEN}✅ Connected${NC}"
    cd ..
else
    echo -e "${RED}❌ Connection failed${NC}"
    cd .. 2>/dev/null
fi

# Check PM2 processes
echo ""
echo -e "${CYAN}Process Status:${NC}"
pm2 status

echo ""
echo -e "${CYAN}System Resources:${NC}"
echo "Memory: $(free -h | awk '/^Mem:/ {print $3 "/" $2}')"
echo "Disk: $(df -h . | awk 'NR==2 {print $3 "/" $2 " (" $5 " used)"}')"
echo "Load: $(uptime | awk -F'load average:' '{print $2}')"
EOF

# Create update script
log $YELLOW "Creating update script..."
cat > update.sh << 'EOF'
#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}Updating SkyRakSys HRM Production...${NC}"
echo "===================================="
echo ""

# Create backup before update
echo -e "${YELLOW}Creating backup before update...${NC}"
./backup.sh

# Stop application
echo -e "${YELLOW}Stopping application...${NC}"
pm2 stop ecosystem.config.js

# Update source code (if git repository)
if [[ -d ".git" ]]; then
    echo -e "${YELLOW}Updating source code...${NC}"
    git pull origin main
    
    if [[ $? -ne 0 ]]; then
        echo -e "${RED}❌ Git pull failed${NC}"
        echo -e "${YELLOW}Starting application with previous version...${NC}"
        pm2 start ecosystem.config.js
        exit 1
    fi
fi

# Update backend dependencies
echo -e "${YELLOW}Updating backend dependencies...${NC}"
cd backend
npm install --production
cd ..

# Update frontend and rebuild
echo -e "${YELLOW}Updating frontend dependencies...${NC}"
cd frontend
npm install
npm run build
cd ..

# Restart application
echo -e "${YELLOW}Starting application...${NC}"
pm2 start ecosystem.config.js

echo ""
echo -e "${GREEN}✅ Update completed successfully!${NC}"
echo ""

# Run health check
echo -e "${YELLOW}Running health check...${NC}"
sleep 5
./health-check.sh
EOF

# Make all scripts executable
chmod +x *.sh

log $GREEN "✅ Startup scripts created:"
log $GREEN "  - package.json         (NPM scripts)"
log $GREEN "  - ecosystem.config.js  (PM2 configuration)"
log $GREEN "  - start.sh            (Start production)"
log $GREEN "  - stop.sh             (Stop application)"
log $GREEN "  - restart.sh          (Restart application)"
log $GREEN "  - status.sh           (Check status)"
log $GREEN "  - logs.sh             (View logs)"
log $GREEN "  - start-dev.sh        (Development mode)"
log $GREEN "  - backup.sh           (Create backup)"
log $GREEN "  - health-check.sh     (System health)"
log $GREEN "  - update.sh           (Update application)"
echo ""

log $YELLOW "Quick commands:"
log $YELLOW "  ./start.sh            - Start production server"
log $YELLOW "  ./stop.sh             - Stop server"
log $YELLOW "  ./status.sh           - Check status"
log $YELLOW "  ./logs.sh             - View logs"
log $YELLOW "  ./backup.sh           - Create backup"
log $YELLOW "  ./health-check.sh     - Health check"
echo ""
