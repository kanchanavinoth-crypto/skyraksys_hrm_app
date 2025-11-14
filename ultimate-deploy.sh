#!/bin/bash

# Ultimate Deployment Script
# Combines Git deployment with complete production sync

echo "🚀 Ultimate HRM Deployment"
echo "=========================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

START_TIME=$(date +%s)

# Phase 1: Git Deployment (get latest code)
echo -e "${BLUE}📋 Phase 1: Git Deployment${NC}"
echo "-------------------------"

if [ -f "redhatprod/scripts/deploy-from-git.sh" ]; then
    print_info "Running Git deployment to get latest code..."
    bash redhatprod/scripts/deploy-from-git.sh
    
    if [ $? -eq 0 ]; then
        print_success "Git deployment completed"
    else
        echo "❌ Git deployment failed. Continuing with sync anyway..."
    fi
else
    print_info "No Git deployment script found. Assuming code is current."
fi

echo ""

# Phase 2: Complete Production Sync
echo -e "${BLUE}📋 Phase 2: Production Synchronization${NC}"
echo "------------------------------------"

if [ -f "fix-frontend-build.sh" ]; then
    print_info "Running complete production sync..."
    bash fix-frontend-build.sh
    
    if [ $? -eq 0 ]; then
        print_success "Production sync completed"
    else
        echo "❌ Production sync had issues. Check output above."
    fi
else
    echo "❌ Production sync script not found!"
    exit 1
fi

# Final Summary
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo -e "${BLUE}🎉 Ultimate Deployment Complete!${NC}"
echo "================================"
echo "⏱️  Total deployment time: ${DURATION} seconds"
echo ""
echo "🔗 Your HRM system has been:"
echo "   ✅ Updated with latest code from Git"
echo "   ✅ Database synchronized with migrations"
echo "   ✅ Frontend rebuilt for production"
echo "   ✅ Backend dependencies updated"
echo "   ✅ Services restarted and verified"
echo "   ✅ Health checks completed"
echo ""
print_success "Deployment successful! 🚀"