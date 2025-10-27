# 🧪 Automated Test Suite Documentation

## 📋 Overview

This comprehensive automated test suite validates all aspects of the SkyRakSys HRM system, covering both backend APIs and frontend user interface functionality.

---

## 🚀 Quick Start

### **Windows Users**
```bash
# Run the test suite
run-automated-tests.bat
```

### **Linux/Mac Users**
```bash
# Make executable (first time only)
chmod +x run-automated-tests.sh

# Run the test suite
./run-automated-tests.sh
```

### **Direct Node.js Execution**
```bash
# Backend API tests only
cd backend
node tests/comprehensive-automated-test.js

# Frontend E2E tests only
cd backend
node tests/frontend-e2e-test.js
```

---

## 🧪 Test Categories

### **1. Backend API Tests** 🔧
**File**: `backend/tests/comprehensive-automated-test.js`

#### **Authentication Tests**
- ✅ Health check endpoint
- ✅ User registration (all roles)
- ✅ User login (admin, hr, manager, employee)
- ✅ JWT token refresh
- ✅ Role-based access control
- ✅ Invalid credential handling
- ✅ User logout

#### **CRUD Operation Tests**
- ✅ Employee management (Create, Read, Update, Delete)
- ✅ Timesheet management (Create, Read, Update)
- ✅ Leave request management (Create, Read)
- ✅ Payroll record management (Create, Read)

#### **Workflow Tests**
- ✅ **Timesheet resubmit workflow** (New feature)
  - Employee submits timesheet
  - Manager rejects timesheet
  - Employee resubmits with corrections
- ✅ Leave approval workflow
  - Employee requests leave
  - HR/Manager approves/rejects
- ✅ Payroll generation workflow
  - Dashboard access
  - Payroll generation process

#### **Performance Tests**
- ✅ API response time validation (<2s)
- ✅ Concurrent request handling (10 simultaneous)
- ✅ Data validation error handling

---

### **2. Frontend E2E Tests** 🌐
**File**: `backend/tests/frontend-e2e-test.js`

#### **User Interface Tests**
- ✅ Application loading and React rendering
- ✅ Login form functionality
- ✅ Navigation menu accessibility
- ✅ Responsive design (Desktop, Tablet, Mobile)
- ✅ Error page handling

#### **Module-Specific Tests**
- ✅ **Timesheet Management**
  - Page loading
  - Table/grid display
  - Add button functionality
  - **Resubmit button visibility** (New feature)
- ✅ **Leave Management**
  - Leave request interface
  - Leave application functionality
- ✅ **Payroll System**
  - Payroll dashboard
  - Payslip generation interface

#### **User Experience Tests**
- ✅ Form interactions
- ✅ Button responsiveness
- ✅ Content visibility across viewport sizes
- ✅ Error handling and user feedback

---

### **3. Integration Tests** 🔗
**Combined**: Both backend and frontend tests

#### **Full-Stack Validation**
- ✅ Frontend-backend connectivity
- ✅ API proxy configuration
- ✅ Authentication flow (UI → API)
- ✅ Data flow (Frontend ↔ Backend ↔ Database)
- ✅ Error propagation and handling

---

## 📊 Test Results & Reports

### **Generated Reports**
1. **`AUTOMATED_TEST_REPORT.md`** - Backend API test results
2. **`FRONTEND_E2E_TEST_REPORT.md`** - Frontend UI test results  
3. **`COMPLETE_TEST_SUITE_REPORT.md`** - Combined full-stack results

### **Screenshots** 📸
- **`test-screenshots/`** - UI screenshots for debugging
  - Application states
  - Error conditions
  - Responsive design views

### **Report Contents**
- ✅ Test execution summary
- ✅ Pass/fail statistics
- ✅ Detailed test results
- ✅ Error messages and debugging info
- ✅ Performance metrics
- ✅ Timestamps for all tests

---

## 🎯 Test Coverage

### **✅ Features Covered**

#### **Authentication & Security**
- User registration and login
- JWT token management and refresh
- Role-based access control (Admin, HR, Manager, Employee)
- Session management and logout

#### **Core HRM Modules**
- **Employee Management**: CRUD operations, hierarchy
- **Timesheet System**: Creation, submission, approval, **resubmit workflow**
- **Leave Management**: Requests, balance tracking, approval
- **Payroll System**: Generation, payslip creation, calculations

#### **User Interface**
- Modern responsive design
- Cross-platform compatibility
- Error handling and user feedback
- Navigation and user workflows

#### **System Performance**
- API response times
- Concurrent user handling
- Data validation
- Error recovery

---

## 🔧 Configuration

### **Test Configuration** (`CONFIG` object in test files)
```javascript
const CONFIG = {
  baseURL: 'http://localhost:8080/api',        // Backend API
  frontendURL: 'http://localhost:3000',        // Frontend app
  timeout: 10000,                              // Request timeout
  screenshotDir: './test-screenshots',         // Screenshot location
  reportFile: './AUTOMATED_TEST_REPORT.md'    // Report file
};
```

### **Test Users** (Created automatically)
```javascript
const TEST_USERS = {
  admin: { email: 'admin@skyraksys.com', role: 'admin' },
  hr: { email: 'hr@skyraksys.com', role: 'hr' },
  manager: { email: 'manager@skyraksys.com', role: 'manager' },
  employee: { email: 'employee@skyraksys.com', role: 'employee' }
};
```

---

## 🚦 Prerequisites

### **System Requirements**
- **Node.js** >= 16.0.0
- **npm** >= 8.0.0
- **Chrome/Chromium** (for E2E tests)

### **Running Servers**
- **Backend**: `http://localhost:8080` (API server)
- **Frontend**: `http://localhost:3000` (React development server)

### **Dependencies** (Auto-installed)
- `axios` - HTTP client for API testing
- `colors` - Console output formatting
- `puppeteer` - Browser automation for E2E tests

---

## 🎮 Usage Examples

### **Quick Health Check**
```bash
# Check if both servers are running
run-automated-tests.bat
# Select option 4
```

### **Backend Only Testing**
```bash
# Test all backend APIs
run-automated-tests.bat
# Select option 1
```

### **Frontend UI Testing**
```bash
# Test user interface and workflows
run-automated-tests.bat
# Select option 2
```

### **Complete Integration Test**
```bash
# Test everything - full system validation
run-automated-tests.bat
# Select option 6
```

---

## 🔍 Troubleshooting

### **Common Issues**

#### **"Servers not available"**
- Ensure backend is running: `cd backend && npm start`
- Ensure frontend is running: `cd frontend && npm start`
- Check ports 3000 and 8080 are not blocked

#### **"Browser launch failed"**
- Install Chrome/Chromium browser
- For Linux: Install browser dependencies
- Set `headless: true` in config for CI/CD

#### **"Test dependencies missing"**
- Run: `npm install --save-dev axios colors puppeteer`
- Check Node.js version >= 16.0.0

#### **"Screenshots not saving"**
- Check write permissions
- Verify `test-screenshots` directory creation
- Check disk space

### **Debug Mode**
```javascript
// Enable debug logging
const CONFIG = {
  ...existing config,
  headless: false,    // Show browser window
  slowMo: 500,       // Slow down actions
  timeout: 60000     // Increase timeout
};
```

---

## 📈 Continuous Integration

### **CI/CD Integration**
```yaml
# Example GitHub Actions
- name: Run Tests
  run: |
    cd backend
    npm install
    npm install --save-dev axios colors puppeteer
    node tests/comprehensive-automated-test.js
```

### **Headless Mode**
```javascript
// For CI/CD environments
const CONFIG = {
  headless: true,
  slowMo: 0,
  timeout: 30000
};
```

---

## 🏆 Success Criteria

### **Backend Tests**
- **Pass Rate**: ≥ 90%
- **Response Time**: < 2 seconds
- **Error Handling**: All edge cases covered

### **Frontend Tests**
- **Pass Rate**: ≥ 85%
- **UI Rendering**: All components visible
- **User Workflows**: Complete user journeys working

### **Integration Tests**
- **Connectivity**: Frontend ↔ Backend working
- **Data Flow**: End-to-end data consistency
- **Authentication**: Full login → workflow → logout

---

## 🎯 Key Features Tested

### **✅ New Timesheet Resubmit Workflow**
1. **Backend**: `PUT /timesheets/:id/resubmit` endpoint
2. **Frontend**: Resubmit button for rejected timesheets
3. **Workflow**: Rejected → Draft status transition
4. **Validation**: Proper error handling and notifications

### **✅ Complete HRM Functionality**
- All CRUD operations across modules
- Role-based access and permissions
- Complex workflows and approvals
- Modern responsive UI with excellent UX

---

**This test suite ensures your SkyRakSys HRM system is production-ready with comprehensive coverage of all functionality!** 🚀
