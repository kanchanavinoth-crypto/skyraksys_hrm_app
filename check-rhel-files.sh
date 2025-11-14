#!/bin/bash

# RHEL Server File Check Script
# Run this on your RHEL server to see what files exist

echo "🔍 RHEL Server File Check"
echo "========================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_check() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅ Found: $1${NC}"
    else
        echo -e "${RED}❌ Missing: $1${NC}"
    fi
}

print_dir_check() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅ Directory exists: $1${NC}"
        echo -e "${BLUE}   Contents: $(ls -1 $1 2>/dev/null | wc -l) files${NC}"
    else
        echo -e "${RED}❌ Directory missing: $1${NC}"
    fi
}

echo -e "${BLUE}Current working directory: $(pwd)${NC}"
echo ""

echo -e "${BLUE}📋 Checking Deployment Scripts:${NC}"
print_check "ultimate-deploy.sh"
print_check "fix-frontend-build.sh" 
print_check "rhel-deployment-guide.sh"

echo ""
echo -e "${BLUE}📁 Checking RedHat Production Directory:${NC}"
print_dir_check "redhatprod"
print_dir_check "redhatprod/scripts"
print_dir_check "redhatprod/systemd"

echo ""
echo -e "${BLUE}🗄️ Checking PostgreSQL Scripts:${NC}"
print_check "redhatprod/scripts/setup-postgresql.sh"
print_check "redhatprod/scripts/manage-postgresql.sh"
print_check "redhatprod/scripts/deploy-from-git.sh"

echo ""
echo -e "${BLUE}🔧 Checking Service Files:${NC}"
print_check "redhatprod/systemd/postgresql-skyraksys.service"

echo ""
echo -e "${BLUE}📦 Checking Application Directories:${NC}"
print_dir_check "backend"
print_dir_check "frontend"
print_dir_check "backend/migrations"

echo ""
echo -e "${BLUE}🔑 Checking Git Repository:${NC}"
if [ -d ".git" ]; then
    echo -e "${GREEN}✅ Git repository found${NC}"
    echo -e "${BLUE}   Current branch: $(git branch --show-current 2>/dev/null || echo 'unknown')${NC}"
    echo -e "${BLUE}   Last commit: $(git log -1 --pretty=format:'%h %s' 2>/dev/null || echo 'unknown')${NC}"
else
    echo -e "${RED}❌ Not a Git repository${NC}"
fi

echo ""
echo -e "${BLUE}📊 Summary:${NC}"
echo "=========="

MISSING_FILES=0

# Count missing critical files
[ ! -f "ultimate-deploy.sh" ] && ((MISSING_FILES++))
[ ! -f "fix-frontend-build.sh" ] && ((MISSING_FILES++))
[ ! -f "redhatprod/scripts/setup-postgresql.sh" ] && ((MISSING_FILES++))
[ ! -f "redhatprod/scripts/deploy-from-git.sh" ] && ((MISSING_FILES++))

if [ $MISSING_FILES -eq 0 ]; then
    echo -e "${GREEN}🎉 All deployment files are present!${NC}"
    echo -e "${GREEN}Ready to deploy with: ./ultimate-deploy.sh${NC}"
else
    echo -e "${YELLOW}⚠️  $MISSING_FILES critical files are missing${NC}"
    echo -e "${YELLOW}You need to upload/pull the latest files first${NC}"
    echo ""
    echo -e "${BLUE}To fix this:${NC}"
    echo "1. git pull origin master"
    echo "2. Or upload missing files via scp"
fi

echo ""
echo -e "${GREEN}✨ File check completed!${NC}"