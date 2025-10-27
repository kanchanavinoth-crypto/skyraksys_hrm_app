# 🚀 SkyrakSys HRM - Complete Developer Guide

## 🎯 **Getting Started Without Any Knowledge Transfer**

This guide provides everything a developer needs to understand, work with, and extend the SkyrakSys HRM system without requiring any prior knowledge or handover sessions.

---

## 📋 **Table of Contents**

1. [System Overview](#system-overview)
2. [Quick Setup](#quick-setup)
3. [Architecture Deep Dive](#architecture-deep-dive)
4. [API Reference](#api-reference)
5. [Database Schema](#database-schema)
6. [Frontend Architecture](#frontend-architecture)
7. [Authentication & Security](#authentication--security)
8. [Development Workflow](#development-workflow)
9. [Testing](#testing)
10. [Deployment](#deployment)
11. [Troubleshooting](#troubleshooting)

---

## 🔍 **System Overview**

### **What is SkyrakSys HRM?**
A comprehensive Human Resource Management System with:
- Employee lifecycle management
- Leave and attendance tracking  
- Timesheet and project management
- Payroll processing
- Role-based access control
- Comprehensive reporting

### **Technology Stack**
```
Frontend:  React.js 18+ | Material-UI | Axios | React Router
Backend:   Node.js | Express.js | Sequelize ORM
Database:  PostgreSQL
Auth:      JWT (JSON Web Tokens)
Deployment: PM2 | Nginx | Docker
Documentation: Swagger/OpenAPI 3.0
```

### **System Architecture**
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React App     │────▶│   Express API   │────▶│   PostgreSQL    │
│   Port 3000     │     │   Port 8080     │     │   Port 5432     │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ • Components    │     │ • Routes        │     │ • Users         │
│ • Services      │     │ • Controllers   │     │ • Employees     │
│ • Context API   │     │ • Middleware    │     │ • Leaves        │
│ • State Mgmt    │     │ • Models        │     │ • Timesheets    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                    ┌─────────────────┐
                    │   Nginx Proxy   │
                    │   Port 80/443   │
                    └─────────────────┘
```

---

## ⚡ **Quick Setup**

### **Prerequisites**
```bash
# Required software
Node.js 18+     # Runtime environment
PostgreSQL 12+  # Database
Git             # Version control
VS Code         # Recommended editor
```

### **Installation Steps**
```bash
# 1. Clone the repository
git clone https://github.com/Otyvino/skyt_hrm.git
cd skyt_hrm

# 2. Backend setup
cd backend
npm install
cp .env.example .env

# 3. Configure environment variables
nano .env  # Edit database credentials

# 4. Database setup
npm run db:migrate
npm run db:seed

# 5. Start backend
npm start
# Backend runs on http://localhost:8080

# 6. Frontend setup (new terminal)
cd ../frontend
npm install
npm start
# Frontend runs on http://localhost:3000

# 7. Access the application
# Web App: http://localhost:3000
# API Docs: http://localhost:8080/api-docs
# Health Check: http://localhost:8080/api/health
```

### **Default Credentials**
```
Admin:    admin@company.com     / Kx9mP7qR2nF8sA5t
HR:       hr@company.com        / Lw3nQ6xY8mD4vB7h  
Employee: employee@company.com  / Mv4pS9wE2nR6kA8j
```

---

## 🏗️ **Architecture Deep Dive**

### **Backend Architecture**
```
backend/
├── 📁 config/           # Database & app configuration
├── 📁 controllers/      # Business logic handlers
├── 📁 middleware/       # Auth, validation, logging
├── 📁 models/           # Sequelize database models
├── 📁 routes/           # API endpoint definitions
├── 📁 services/         # Business services
├── 📁 utils/            # Helper functions
├── 📄 server.js         # Application entry point
└── 📄 package.json      # Dependencies & scripts
```

### **Frontend Architecture**
```
frontend/src/
├── 📁 components/       # React components
│   ├── 📁 features/     # Feature-specific components
│   ├── 📁 layout/       # Layout components
│   ├── 📁 common/       # Reusable components
│   └── 📁 admin/        # Admin-specific components
├── 📁 contexts/         # React Context providers
├── 📁 services/         # API communication
├── 📁 utils/            # Helper functions
├── 📄 App.js            # Main application component
└── 📄 index.js          # React entry point
```

### **Data Flow**
```
User Action → Component → Service → API → Controller → Model → Database
     ↓                                                              │
UI Update ← Component ← Context ← Response ← JSON ← Query Result ←─┘
```

---

## 🌐 **API Reference**

### **Interactive Documentation**
- **Swagger UI**: `http://localhost:8080/api-docs`
- **API Schema**: `http://localhost:8080/api-docs.json`
- **Health Check**: `http://localhost:8080/api/health`

### **Authentication**
```javascript
// Login request
POST /api/auth/login
{
  "email": "admin@company.com",
  "password": "Kx9mP7qR2nF8sA5t"
}

// Response
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { /* user data */ },
    "employee": { /* employee data */ }
  }
}

// Use token in subsequent requests
Authorization: Bearer <token>
```

### **Core Endpoints**
```javascript
// Employee Management
GET    /api/employees              # List employees
POST   /api/employees              # Create employee
GET    /api/employees/:id          # Get employee details
PUT    /api/employees/:id          # Update employee
DELETE /api/employees/:id          # Delete employee

// Leave Management  
GET    /api/leaves                 # List leave requests
POST   /api/leaves                 # Create leave request
PATCH  /api/leaves/:id/approve     # Approve leave
PATCH  /api/leaves/:id/reject      # Reject leave

// Timesheet Management
GET    /api/timesheets             # List timesheets
POST   /api/timesheets             # Create timesheet entry
POST   /api/timesheets/weekly      # Submit weekly timesheet

// Payroll Management
GET    /api/payroll/payslips       # List payslips
POST   /api/payroll/payslips       # Generate payslip

// Project Management
GET    /api/projects               # List projects
POST   /api/projects               # Create project
GET    /api/projects/:id/tasks     # Get project tasks
```

### **Response Format**
```javascript
// Success Response
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ },
  "error": null
}

// Error Response
{
  "success": false,
  "message": "Error description",
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "details": "Detailed error information"
  }
}
```

---

## 🗄️ **Database Schema**

### **Core Tables**
```sql
-- Users table (authentication)
users (
  id           SERIAL PRIMARY KEY,
  firstName    VARCHAR(50) NOT NULL,
  lastName     VARCHAR(50) NOT NULL, 
  email        VARCHAR(100) UNIQUE NOT NULL,
  password     VARCHAR(255) NOT NULL,
  role         ENUM('admin','hr','employee') NOT NULL,
  isActive     BOOLEAN DEFAULT true,
  createdAt    TIMESTAMP,
  updatedAt    TIMESTAMP
);

-- Employees table (HR data)
employees (
  id           SERIAL PRIMARY KEY,
  userId       INTEGER REFERENCES users(id),
  employeeId   VARCHAR(20) UNIQUE NOT NULL,
  firstName    VARCHAR(50) NOT NULL,
  lastName     VARCHAR(50) NOT NULL,
  email        VARCHAR(100) NOT NULL,
  phone        VARCHAR(20),
  departmentId INTEGER REFERENCES departments(id),
  positionId   INTEGER REFERENCES positions(id),
  managerId    INTEGER REFERENCES employees(id),
  hireDate     DATE NOT NULL,
  salary       DECIMAL(10,2),
  status       ENUM('Active','Inactive','Terminated'),
  createdAt    TIMESTAMP,
  updatedAt    TIMESTAMP
);

-- Leaves table
leaves (
  id           SERIAL PRIMARY KEY,
  employeeId   INTEGER REFERENCES employees(id),
  leaveTypeId  INTEGER REFERENCES leave_types(id),
  startDate    DATE NOT NULL,
  endDate      DATE NOT NULL,
  totalDays    INTEGER NOT NULL,
  reason       TEXT,
  status       ENUM('pending','approved','rejected'),
  approverId   INTEGER REFERENCES employees(id),
  comments     TEXT,
  createdAt    TIMESTAMP,
  updatedAt    TIMESTAMP
);

-- Timesheets table
timesheets (
  id           SERIAL PRIMARY KEY,
  employeeId   INTEGER REFERENCES employees(id),
  date         DATE NOT NULL,
  hoursWorked  DECIMAL(4,2) NOT NULL,
  projectId    INTEGER REFERENCES projects(id),
  taskId       INTEGER REFERENCES tasks(id),
  description  TEXT,
  status       ENUM('draft','submitted','approved'),
  createdAt    TIMESTAMP,
  updatedAt    TIMESTAMP
);
```

### **Relationships**
```
users 1:1 employees
employees 1:N employees (manager hierarchy)
employees 1:N leaves
employees 1:N timesheets
departments 1:N employees
positions 1:N employees
projects 1:N tasks
projects 1:N timesheets
```

### **Database Operations**
```bash
# Migration commands
npm run db:migrate          # Run migrations
npm run db:migrate:undo     # Rollback last migration
npm run db:seed             # Seed demo data
npm run db:reset           # Reset entire database

# Maintenance commands
npm run db:backup          # Create database backup
npm run db:restore         # Restore from backup
npm run db:status          # Check migration status
```

---

## ⚛️ **Frontend Architecture**

### **Component Structure**
```javascript
// Feature-based organization
components/
├── features/
│   ├── employees/
│   │   ├── EmployeeList.js      # List view
│   │   ├── EmployeeForm.js      # Create/Edit form
│   │   ├── EmployeeProfile.js   # Detail view
│   │   └── EmployeeCard.js      # Card component
│   ├── dashboard/
│   │   ├── AdminDashboard.js    # Admin overview
│   │   ├── ManagerDashboard.js  # Manager view
│   │   └── EmployeeDashboard.js # Employee view
│   └── timesheets/
│       ├── TimesheetList.js     # Timesheet listing
│       ├── WeeklyTimesheet.js   # Weekly entry
│       └── TimesheetApproval.js # Approval interface
├── layout/
│   ├── Layout.js               # Main layout wrapper
│   ├── Header.js               # Navigation header
│   ├── Sidebar.js              # Side navigation
│   └── Footer.js               # Page footer
└── common/
    ├── LoadingSpinner.js       # Loading indicator
    ├── ErrorBoundary.js        # Error handling
    └── ProtectedRoute.js       # Route protection
```

### **State Management**
```javascript
// Context-based state management
contexts/
├── AuthContext.js              # Authentication state
├── EmployeeContext.js          # Employee data state
├── NotificationContext.js      # Notifications state
└── ThemeContext.js             # UI theme state

// Usage example
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, login, logout, isAuthenticated } = useAuth();
  
  const handleLogin = async (credentials) => {
    try {
      await login(credentials);
      // Navigate to dashboard
    } catch (error) {
      // Handle error
    }
  };
}
```

### **API Services**
```javascript
// Service layer for API communication
services/
├── AuthService.js              # Authentication APIs
├── EmployeeService.js          # Employee APIs
├── LeaveService.js             # Leave APIs
├── TimesheetService.js         # Timesheet APIs
└── PayrollService.js           # Payroll APIs

// Usage example
import EmployeeService from '../services/EmployeeService';

const employees = await EmployeeService.getAll({
  page: 1,
  limit: 10,
  department: 'Engineering'
});
```

### **Routing Structure**
```javascript
// App.js - Main routing configuration
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
    <Route index element={<Dashboard />} />
    <Route path="employees" element={<EmployeeList />} />
    <Route path="employees/:id" element={<EmployeeProfile />} />
    <Route path="leaves" element={<LeaveList />} />
    <Route path="timesheets" element={<TimesheetList />} />
    <Route path="payroll" element={<PayrollList />} />
    <Route path="reports" element={<Reports />} />
  </Route>
</Routes>
```

---

## 🔐 **Authentication & Security**

### **JWT Authentication Flow**
```javascript
// 1. User login
POST /api/auth/login
{
  "email": "user@company.com",
  "password": "password"
}

// 2. Server response with JWT
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { "id": 1, "role": "employee" }
  }
}

// 3. Client stores token and includes in requests
localStorage.setItem('token', token);
Authorization: Bearer <token>

// 4. Server validates token on protected routes
middleware/auth.js validates JWT and sets req.user
```

### **Role-Based Access Control**
```javascript
// User roles and permissions
const ROLES = {
  admin: {
    permissions: ['*'], // Full access
    description: 'System administrator'
  },
  hr: {
    permissions: [
      'employees.*',
      'leaves.approve',
      'payroll.*',
      'reports.*'
    ],
    description: 'HR manager'
  },
  employee: {
    permissions: [
      'employees.read.own',
      'leaves.create.own',
      'timesheets.*'
    ],
    description: 'Regular employee'
  }
};

// Permission checking middleware
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!hasPermission(req.user, permission)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    next();
  };
};
```

### **Security Features**
```javascript
// Password hashing (bcrypt)
const bcrypt = require('bcryptjs');
const saltRounds = 12;
const hashedPassword = await bcrypt.hash(password, saltRounds);

// JWT token generation
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

// Input validation (Joi)
const Joi = require('joi');
const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

// Rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

---

## 🔄 **Development Workflow**

### **Project Setup**
```bash
# 1. Environment setup
cp backend/.env.example backend/.env
# Edit database credentials and secrets

# 2. Database initialization
cd backend
npm run db:migrate
npm run db:seed

# 3. Start development servers
npm run dev              # Backend with nodemon
cd ../frontend && npm start  # Frontend with hot reload
```

### **Git Workflow**
```bash
# 1. Create feature branch
git checkout -b feature/employee-management-improvements

# 2. Make changes and commit
git add .
git commit -m "feat: add employee bulk update functionality"

# 3. Push and create pull request
git push origin feature/employee-management-improvements
# Create PR on GitHub

# 4. Code review and merge
# Review → Approve → Merge to main
```

### **Code Standards**
```javascript
// ESLint configuration
{
  "extends": ["eslint:recommended", "react-app"],
  "rules": {
    "no-console": "warn",
    "no-unused-vars": "error",
    "prefer-const": "error",
    "no-var": "error"
  }
}

// Prettier configuration
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### **Commit Message Convention**
```
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting changes
refactor: code refactoring
test: test additions
chore: maintenance tasks

Examples:
feat: add employee bulk import functionality
fix: resolve timesheet calculation bug
docs: update API documentation for leave endpoints
```

---

## 🧪 **Testing**

### **Backend Testing**
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=employee

# Watch mode for development
npm run test:watch
```

### **Test Structure**
```javascript
// tests/employee.test.js
const request = require('supertest');
const app = require('../server');

describe('Employee API', () => {
  let authToken;
  
  beforeAll(async () => {
    // Setup test data
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@company.com',
        password: 'Kx9mP7qR2nF8sA5t'
      });
    authToken = response.body.data.token;
  });
  
  test('GET /api/employees should return employee list', async () => {
    const response = await request(app)
      .get('/api/employees')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
      
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.employees)).toBe(true);
  });
  
  test('POST /api/employees should create new employee', async () => {
    const newEmployee = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@test.com',
      department: 'Engineering',
      position: 'Developer'
    };
    
    const response = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${authToken}`)
      .send(newEmployee)
      .expect(201);
      
    expect(response.body.success).toBe(true);
    expect(response.body.data.firstName).toBe('John');
  });
});
```

### **Frontend Testing**
```javascript
// src/components/__tests__/EmployeeList.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import EmployeeList from '../EmployeeList';
import { AuthContext } from '../../contexts/AuthContext';

const mockAuthContext = {
  user: { role: 'admin' },
  isAuthenticated: true
};

test('renders employee list', () => {
  render(
    <AuthContext.Provider value={mockAuthContext}>
      <EmployeeList />
    </AuthContext.Provider>
  );
  
  expect(screen.getByText('Employee List')).toBeInTheDocument();
});

test('filters employees by department', () => {
  render(
    <AuthContext.Provider value={mockAuthContext}>
      <EmployeeList />
    </AuthContext.Provider>
  );
  
  const departmentFilter = screen.getByLabelText('Department');
  fireEvent.change(departmentFilter, { target: { value: 'Engineering' } });
  
  // Assert filtered results
});
```

---

## 🚀 **Deployment**

### **Production Environment Setup**
```bash
# 1. Use Red Hat deployment package
cd redhat/
sudo ./scripts/install-complete.sh

# 2. Or manual deployment
# Install Node.js, PostgreSQL, Nginx, PM2
# Configure database and environment variables
# Build frontend and start services
```

### **Environment Variables**
```bash
# Backend (.env)
NODE_ENV=production
PORT=8080

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skyraksys_hrm
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRY=24h

# Frontend (.env)
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_BASE_URL=http://localhost:3000
```

### **PM2 Configuration**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'skyraksys-hrm',
    script: './backend/server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 8080
    },
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    time: true
  }]
};
```

### **Nginx Configuration**
```nginx
# /etc/nginx/sites-available/skyraksys-hrm
server {
    listen 80;
    server_name your-domain.com;
    
    # Frontend static files
    location / {
        root /opt/skyraksys_hrm/frontend/build;
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy
    location /api {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🔧 **Troubleshooting**

### **Common Issues**

#### **Database Connection Issues**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test database connection
psql -h localhost -U your_user -d skyraksys_hrm

# Check connection from Node.js
npm run db:test-connection
```

#### **Authentication Issues**
```javascript
// Check JWT token validity
const jwt = require('jsonwebtoken');
try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('Token valid:', decoded);
} catch (error) {
  console.log('Token invalid:', error.message);
}

// Clear browser storage if needed
localStorage.clear();
sessionStorage.clear();
```

#### **API Issues**
```bash
# Check API health
curl http://localhost:8080/api/health

# Test specific endpoint
curl -H "Authorization: Bearer <token>" \
     http://localhost:8080/api/employees

# Check server logs
npm run logs  # or tail -f logs/combined.log
```

#### **Frontend Build Issues**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for version conflicts
npm outdated

# Build with verbose output
npm run build -- --verbose
```

### **Debug Mode**
```bash
# Backend debugging
DEBUG=* npm run dev

# Frontend debugging
REACT_APP_DEBUG=true npm start

# Database query logging
DB_LOGGING=true npm run dev
```

### **Performance Monitoring**
```bash
# PM2 monitoring
pm2 monit

# System resources
htop

# Database performance
# Check slow queries in PostgreSQL logs
```

---

## 📚 **Additional Resources**

### **Documentation Links**
- **API Documentation**: `http://localhost:8080/api-docs`
- **Database Schema**: `docs/development/DATABASE.md`
- **Deployment Guide**: `redhat/README.md`
- **Security Guide**: `docs/development/SECURITY.md`

### **Useful Commands**
```bash
# Development
npm run dev          # Start backend in development mode
npm start           # Start frontend
npm test            # Run tests
npm run lint        # Check code style

# Database
npm run db:migrate  # Run migrations
npm run db:seed     # Seed data
npm run db:reset    # Reset database

# Production
npm run build       # Build frontend
npm run prod        # Start in production mode
pm2 start ecosystem.config.js
```

### **VS Code Extensions**
```json
{
  "recommendations": [
    "ms-vscode.vscode-json",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint"
  ]
}
```

---

## 🎉 **You're Ready!**

With this comprehensive guide, you should be able to:

✅ **Understand the system** architecture and components  
✅ **Set up development** environment quickly  
✅ **Navigate the codebase** confidently  
✅ **Make changes** and add new features  
✅ **Debug issues** effectively  
✅ **Deploy to production** successfully  

### **Next Steps**
1. **Set up your environment** using the quick setup guide
2. **Explore the API** using Swagger documentation
3. **Run the tests** to understand expected behavior
4. **Start with small changes** to get familiar with the codebase
5. **Refer to this guide** whenever you need clarification

**Happy coding! 🚀**

---

*For additional help, check the troubleshooting section or create an issue in the repository.*
