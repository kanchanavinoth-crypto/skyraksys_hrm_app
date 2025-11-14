#!/bin/bash

# RHEL Production Deployment Guide
# This script shows the correct paths and execution order for RHEL deployment

echo "🚀 RHEL Production Deployment Guide"
echo "==================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_step() {
    echo -e "${GREEN}📋 $1${NC}"
}

print_path() {
    echo -e "${YELLOW}📁 $1${NC}"
}

echo -e "${BLUE}🎯 RHEL Production Server Setup${NC}"
echo "=============================="
echo ""

print_step "1. SSH to RHEL Production Server"
print_path "ssh root@95.216.14.232"
echo ""

print_step "2. Navigate to Deployment Directory"
print_path "cd /opt/skyraksys-hrm/skyraksys_hrm_app"
echo ""

print_step "3. Verify File Locations"
echo "Check these files exist:"
print_path "ls -la ultimate-deploy.sh"
print_path "ls -la fix-frontend-build.sh" 
print_path "ls -la redhatprod/scripts/deploy-from-git.sh"
print_path "ls -la redhatprod/scripts/setup-postgresql.sh"
echo ""

print_step "4. Make Scripts Executable"
print_path "chmod +x ultimate-deploy.sh"
print_path "chmod +x fix-frontend-build.sh"
print_path "chmod +x redhatprod/scripts/*.sh"
echo ""

print_step "5. Set Up PostgreSQL (First Time Only)"
print_path "sudo ./redhatprod/scripts/setup-postgresql.sh"
echo ""

print_step "6. Create skyraksys User (If Not Exists)"
print_path "useradd -r -s /bin/bash -d /opt/skyraksys-hrm -m skyraksys"
print_path "chown -R skyraksys:skyraksys /opt/skyraksys-hrm/"
echo ""

print_step "7. Run Ultimate Deployment"
print_path "./ultimate-deploy.sh"
echo ""

print_step "8. Monitor Deployment Progress"
echo "The script will show colored output:"
echo "  ✅ Green = Success"
echo "  ❌ Red = Error"  
echo "  ⚠️ Yellow = Warning"
echo "  ℹ️ Blue = Information"
echo ""

print_step "9. Verify Deployment Success"
print_path "curl http://localhost:3001/api/health"
print_path "systemctl status skyraksys-hrm-backend"
print_path "./redhatprod/scripts/manage-postgresql.sh health"
echo ""

echo -e "${GREEN}🎉 Complete RHEL Deployment Path${NC}"
echo "==============================="
echo ""
echo "Full command sequence:"
echo ""
echo "ssh root@95.216.14.232"
echo "cd /opt/skyraksys-hrm/skyraksys_hrm_app"
echo "chmod +x ultimate-deploy.sh"
echo "./ultimate-deploy.sh"
echo ""
echo -e "${GREEN}✨ That's it! One command deployment! 🚀${NC}"