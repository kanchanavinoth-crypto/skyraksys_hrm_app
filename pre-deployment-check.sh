#!/bin/bash

# Pre-Deployment Check Script
# Run this before every deployment to catch issues early

echo "🔍 Pre-Deployment Validation"
echo "============================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

echo -e "\n📦 1. Backend Validation"
echo "------------------------"
cd backend

# Check for syntax errors
echo "Checking for Node.js syntax errors..."
node -c server.js
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Backend syntax errors found!${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ Backend syntax OK${NC}"
fi

# Check dependencies
echo "Checking backend dependencies..."
npm list --depth=0 > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️ Backend dependency issues detected${NC}"
    echo "Run: npm install"
fi

cd ..

echo -e "\n🎨 2. Frontend Validation"
echo "-------------------------"
cd frontend

# Test production build
echo "Testing production build..."
npm run build > build_test.log 2>&1
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend build FAILED!${NC}"
    echo "Build errors:"
    tail -20 build_test.log
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ Frontend build successful${NC}"
    rm -f build_test.log
fi

# Check for common import issues
echo "Checking for import issues..."
if grep -r "import.*from.*@mui/material" src/ | grep -v "AlertTitle\|alpha" > /dev/null; then
    echo -e "${YELLOW}⚠️ Potential Material-UI import issues${NC}"
fi

# Audit check
echo "Running security audit..."
npm audit --audit-level moderate > audit.log 2>&1
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️ Security vulnerabilities found${NC}"
    echo "Run: npm audit fix"
else
    echo -e "${GREEN}✅ No critical vulnerabilities${NC}"
fi
rm -f audit.log

cd ..

echo -e "\n🗄️ 3. Database Migration Check"
echo "------------------------------"
# Check if migrations exist and are valid
if [ -d "backend/migrations" ]; then
    echo -e "${GREEN}✅ Migration directory exists${NC}"
    MIGRATION_COUNT=$(ls backend/migrations/*.js 2>/dev/null | wc -l)
    echo "Found $MIGRATION_COUNT migration files"
else
    echo -e "${YELLOW}⚠️ No migrations directory${NC}"
fi

echo -e "\n📋 4. Deployment Script Check"
echo "-----------------------------"
if [ -f "redhatprod/scripts/deploy-from-git.sh" ]; then
    echo -e "${GREEN}✅ Deployment script exists${NC}"
    # Check if script is executable
    if [ -x "redhatprod/scripts/deploy-from-git.sh" ]; then
        echo -e "${GREEN}✅ Deployment script is executable${NC}"
    else
        echo -e "${YELLOW}⚠️ Deployment script needs execute permissions${NC}"
        chmod +x redhatprod/scripts/deploy-from-git.sh
    fi
else
    echo -e "${RED}❌ Deployment script missing!${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo -e "\n📊 Summary"
echo "----------"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Ready for deployment.${NC}"
    echo -e "${GREEN}🚀 You can safely run: git push && deploy${NC}"
else
    echo -e "${RED}❌ $ERRORS error(s) found. Fix before deploying!${NC}"
    exit 1
fi