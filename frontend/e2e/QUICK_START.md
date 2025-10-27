# 🚀 Quick Start - E2E Testing

## ⚡ Fast Setup (5 minutes)

### 1. Install Dependencies

```bash
cd frontend/e2e
npm install
npx playwright install chromium
```

### 2. Configure Environment

```bash
# Copy example environment file
copy .env.example .env

# Edit .env file with your credentials
notepad .env
```

### 3. Start Application

**Terminal 1 - Backend:**
```bash
cd backend
node server.js
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### 4. Run Tests

```bash
cd frontend/e2e

# Run all tests
npm test

# Run in UI mode (recommended for first time)
npm run test:ui

# Run only smoke tests
npm run test:smoke
```

---

## 🎯 Common Test Commands

### Run Specific Tests

```bash
# Authentication tests
npm run test:auth

# Employee tests
npm run test:employee

# Timesheet tests
npm run test:timesheet

# Dashboard tests
npm run test:dashboard
```

### Run with Different Browsers

```bash
# Chrome
npm run test:chrome

# Firefox
npm run test:firefox

# WebKit (Safari)
npm run test:webkit

# Mobile
npm run test:mobile

# All browsers
npm run test:all
```

### Debug Tests

```bash
# Debug mode with browser visible
npm run test:debug

# Headed mode (see browser)
npm run test:headed

# Slow motion (500ms delay between actions)
npm run test:slow
```

### View Reports

```bash
# View last test report
npm run report

# Or manually open
npx playwright show-report
```

---

## 📋 Test Structure

```
tests/
├── auth/           → Login, logout, authentication
├── dashboard/      → Dashboard functionality
├── employee/       → Employee CRUD operations
├── timesheet/      → Timesheet management
├── leave/          → Leave management
└── payroll/        → Payroll operations
```

---

## ✅ Test Coverage

### Completed ✅
- **Authentication** (10 tests)
  - Login with different roles
  - Logout
  - Error handling
  
- **Employee Management** (10 tests)
  - Add, edit, delete employees
  - Search and filter
  - Form validation
  
- **Timesheet** (15 tests)
  - Create and submit timesheets
  - Manager approvals
  - Validation rules

- **Dashboard** (12 tests)
  - Navigation
  - Statistics
  - User profile

### Total: **47 tests** across 4 modules

---

## 🐛 Troubleshooting

### Tests Failing?

```bash
# Clear everything and reinstall
cd frontend/e2e
rmdir /s /q node_modules
rmdir /s /q playwright/.auth
del package-lock.json
npm install
npx playwright install
```

### Application Not Starting?

```bash
# Check if ports are in use
netstat -ano | findstr :3000
netstat -ano | findstr :5000

# Kill process if needed
taskkill /PID <PID> /F
```

### Authentication Issues?

```bash
# Delete auth cache
cd frontend/e2e
rmdir /s /q playwright\.auth

# Tests will regenerate auth on next run
npm test
```

---

## 📊 Current Status

- ✅ Framework: Playwright
- ✅ Configuration: Complete
- ✅ Page Objects: 5 created
- ✅ Test Suites: 4 modules
- ✅ Total Tests: 47
- ✅ Documentation: Complete
- ✅ CI/CD: GitHub Actions configured

---

## 🎓 Learning Resources

- **Documentation**: See `frontend/e2e/README.md`
- **Examples**: Check `tests/` directory
- **Playwright Docs**: https://playwright.dev
- **Best Practices**: See README.md

---

## 📞 Need Help?

1. Check `frontend/e2e/README.md` for detailed docs
2. Review test examples in `tests/` folder
3. Check Playwright documentation
4. Ask team for assistance

---

## 🎉 You're Ready!

Start with:
```bash
cd frontend/e2e
npm run test:ui
```

This opens the Playwright UI where you can:
- ✅ See all tests
- ✅ Run tests individually
- ✅ Watch tests in browser
- ✅ Debug failures
- ✅ View reports

**Happy Testing! 🚀**
