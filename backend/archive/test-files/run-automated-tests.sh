#!/bin/bash

# SkyRakSys HRM - Comprehensive Test Suite (Linux/Mac)
# Automated testing script for all system components

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

echo -e "\n==============================================="
echo -e "   SkyRakSys HRM - Comprehensive Test Suite"
echo -e "===============================================\n"

echo -e "${CYAN}🚀 Starting Comprehensive Test Suite...${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

# Check if backend directory exists
if [ ! -d "backend" ]; then
    echo -e "${RED}❌ Backend directory not found. Please run from project root.${NC}"
    exit 1
fi

# Navigate to backend directory
cd backend

# Install dependencies if needed
echo -e "${YELLOW}📦 Checking dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install backend dependencies${NC}"
        exit 1
    fi
fi

# Install test dependencies
echo -e "${YELLOW}📦 Installing test dependencies...${NC}"
npm install --save-dev axios colors puppeteer

echo -e "\n${BLUE}🔍 Available Test Suites:${NC}"
echo -e "${WHITE}[1] Backend API Tests (Authentication, CRUD, Workflows)${NC}"
echo -e "${WHITE}[2] Frontend E2E Tests (UI, Navigation, User Flows)${NC}"
echo -e "${WHITE}[3] Full Integration Tests (Backend + Frontend)${NC}"
echo -e "${WHITE}[4] Quick Health Check${NC}"
echo -e "${WHITE}[5] Performance Tests${NC}"
echo -e "${WHITE}[6] Run All Tests${NC}"

read -p "$(echo -e ${CYAN}Select test suite [1-6]: ${NC})" choice

case $choice in
    1)
        echo -e "\n${MAGENTA}🔧 Running Backend API Tests...${NC}"
        echo -e "${YELLOW}⚠️  Please ensure backend server is running on port 8080${NC}"
        read -p "Press Enter to continue..."
        node tests/comprehensive-automated-test.js
        ;;
    2)
        echo -e "\n${MAGENTA}🌐 Running Frontend E2E Tests...${NC}"
        echo -e "${YELLOW}⚠️  Please ensure both frontend (3000) and backend (8080) servers are running${NC}"
        read -p "Press Enter to continue..."
        node tests/frontend-e2e-test.js
        ;;
    3)
        echo -e "\n${MAGENTA}🔗 Running Full Integration Tests...${NC}"
        echo -e "${YELLOW}⚠️  Please ensure both servers are running${NC}"
        read -p "Press Enter to continue..."
        echo -e "${CYAN}Testing backend APIs...${NC}"
        node tests/comprehensive-automated-test.js
        echo -e "\n${CYAN}Testing frontend UI...${NC}"
        node tests/frontend-e2e-test.js
        ;;
    4)
        echo -e "\n${MAGENTA}🏥 Running Quick Health Check...${NC}"
        echo -e "${CYAN}Checking backend health...${NC}"
        curl -s http://localhost:8080/api/health || echo -e "${RED}❌ Backend not responding${NC}"
        echo -e "\n${CYAN}Checking frontend availability...${NC}"
        curl -s http://localhost:3000 > /dev/null && echo -e "${GREEN}✅ Frontend responding${NC}" || echo -e "${RED}❌ Frontend not responding${NC}"
        ;;
    5)
        echo -e "\n${MAGENTA}⚡ Running Performance Tests...${NC}"
        echo -e "${YELLOW}⚠️  Please ensure backend server is running${NC}"
        read -p "Press Enter to continue..."
        node -e "
        const { PerformanceTests } = require('./tests/comprehensive-automated-test.js');
        async function run() {
          const perfTests = new PerformanceTests({admin: 'dummy-token'});
          await perfTests.runAll();
        }
        run().catch(console.error);
        "
        ;;
    6)
        echo -e "\n${MAGENTA}🎯 Running Complete Test Suite...${NC}"
        echo -e "\n${YELLOW}⚠️  This will run ALL tests. Please ensure:"
        echo -e "     - Backend server is running on port 8080"
        echo -e "     - Frontend server is running on port 3000"
        echo -e "     - No other applications are using these ports${NC}"
        read -p "Press Enter to continue..."

        echo -e "${CYAN}Step 1/3: Backend API Tests${NC}"
        node tests/comprehensive-automated-test.js
        
        echo -e "\n${CYAN}Step 2/3: Frontend E2E Tests${NC}"
        node tests/frontend-e2e-test.js
        
        echo -e "\n${CYAN}Step 3/3: Generating Combined Report${NC}"
        node -e "
        const fs = require('fs');
        const path = require('path');

        // Read individual reports
        let combinedReport = '# 🏆 SkyRakSys HRM - Complete Test Suite Report\n\n';
        combinedReport += '**Generated**: ' + new Date().toISOString() + '\n\n';

        try {
          const backendReport = fs.readFileSync('./AUTOMATED_TEST_REPORT.md', 'utf8');
          combinedReport += '## 🔧 Backend Test Results\n\n' + backendReport + '\n\n';
        } catch (e) {
          combinedReport += '## 🔧 Backend Test Results\n\n❌ Backend test report not found\n\n';
        }

        try {
          const frontendReport = fs.readFileSync('./FRONTEND_E2E_TEST_REPORT.md', 'utf8');
          combinedReport += '## 🌐 Frontend Test Results\n\n' + frontendReport + '\n\n';
        } catch (e) {
          combinedReport += '## 🌐 Frontend Test Results\n\n❌ Frontend test report not found\n\n';
        }

        combinedReport += '---\n\n## 🎯 Overall Assessment\n\n';
        combinedReport += 'This comprehensive test suite validates:\n';
        combinedReport += '- ✅ Backend API functionality\n';
        combinedReport += '- ✅ Frontend user interface\n';
        combinedReport += '- ✅ Full-stack integration\n';
        combinedReport += '- ✅ User workflows\n';
        combinedReport += '- ✅ Performance metrics\n\n';

        fs.writeFileSync('./COMPLETE_TEST_SUITE_REPORT.md', combinedReport);
        console.log('📝 Combined report saved: COMPLETE_TEST_SUITE_REPORT.md');
        "
        ;;
    *)
        echo -e "${RED}❌ Invalid choice. Please select 1-6.${NC}"
        exit 1
        ;;
esac

echo -e "\n${GREEN}🏁 Test execution completed!${NC}"
echo -e "\n${CYAN}📝 Check the following files for detailed results:${NC}"

if [ -f "AUTOMATED_TEST_REPORT.md" ]; then
    echo -e "${WHITE}   - AUTOMATED_TEST_REPORT.md (Backend tests)${NC}"
fi

if [ -f "FRONTEND_E2E_TEST_REPORT.md" ]; then
    echo -e "${WHITE}   - FRONTEND_E2E_TEST_REPORT.md (Frontend tests)${NC}"
fi

if [ -f "COMPLETE_TEST_SUITE_REPORT.md" ]; then
    echo -e "${WHITE}   - COMPLETE_TEST_SUITE_REPORT.md (Combined report)${NC}"
fi

if [ -d "test-screenshots" ]; then
    echo -e "${WHITE}   - test-screenshots/ (UI screenshots)${NC}"
fi

echo -e "\n${YELLOW}💡 Tips:${NC}"
echo -e "${WHITE}   - Review failed tests in the reports${NC}"
echo -e "${WHITE}   - Screenshots help debug UI issues${NC}"
echo -e "${WHITE}   - Run individual test suites for faster iterations${NC}"
echo
