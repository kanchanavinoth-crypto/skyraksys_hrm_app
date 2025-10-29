# 💻 Developer Guide

**Version**: 2.0.0  
**Last Updated**: October 27, 2025  
**Target Audience**: Developers, Contributors

---

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Development Environment Setup](#development-environment-setup)
3. [Project Structure](#project-structure)
4. [Coding Standards](#coding-standards)
5. [Git Workflow](#git-workflow)
6. [Development Guidelines](#development-guidelines)
7. [API Development](#api-development)
8. [Frontend Development](#frontend-development)
9. [Database Management](#database-management)
10. [Testing](#testing)
11. [Debugging](#debugging)
12. [Troubleshooting](#troubleshooting)

---

## 🚀 Getting Started

### Prerequisites

| Tool | Required Version | Purpose |
|------|------------------|---------|
| **Node.js** | 18.x or higher | Runtime environment |
| **npm** | 9.x or higher | Package manager |
| **PostgreSQL** | 15.x or higher | Database |
| **Git** | 2.x or higher | Version control |
| **VS Code** | Latest | Recommended IDE |

### Quick Start

```bash
# 1. Clone repository
git clone https://github.com/skyraksys/hrm.git
cd hrm

# 2. Install backend dependencies
cd backend
npm install

# 3. Install frontend dependencies
cd ../frontend
npm install

# 4. Setup database (Windows)
cd ..
setup-database.bat

# 5. Configure environment
cd backend
copy .env.production.template .env.production
# Edit .env.production with your database credentials

# 6. Run migrations and seeds
npm run dev  # This will sync database schema
cd ..
cd backend
npx sequelize-cli db:seed:all

# 7. Start backend (from root directory)
npm run start:backend

# 8. Start frontend (from root directory, new terminal)
npm run start:frontend

# Application will open at http://localhost:3000
```

### Default Login Credentials

After seeding:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@skyraksys.com | admin123 |
| **HR** | hr@skyraksys.com | hr123 |
| **Manager** | manager@skyraksys.com | manager123 |
| **Employee** | john.doe@skyraksys.com | employee123 |

---

## 🛠️ Development Environment Setup

### VS Code Setup

**Recommended Extensions**:
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "christian-kohler.path-intellisense",
    "eamodio.gitlens",
    "ms-playwright.playwright",
    "cweijan.vscode-postgresql-client2"
  ]
}
```

**Workspace Settings** (`.vscode/settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript"
  ],
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

**Launch Configuration** (`.vscode/launch.json`):
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/backend/server.js",
      "cwd": "${workspaceFolder}/backend",
      "envFile": "${workspaceFolder}/backend/.env.production"
    },
    {
      "name": "Debug Frontend",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/frontend/src"
    }
  ]
}
```

### Environment Configuration

**Backend** (`.env.production`):
```bash
# Server
NODE_ENV=development
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skyraksys_hrm
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=1h

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=300

# Logging
LOG_LEVEL=debug
```

**Frontend** (`.env`):
```bash
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development
```

### Database Setup (Detailed)

**Option 1: Automated Setup (Windows)**
```bash
setup-database.bat
```

**Option 2: Manual Setup**
```bash
# Start PostgreSQL
# Windows: Services -> PostgreSQL -> Start
# Linux: sudo systemctl start postgresql

# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE skyraksys_hrm;

# Create user (optional)
CREATE USER hrm_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE skyraksys_hrm TO hrm_user;

# Exit psql
\q

# Run backend to sync schema
cd backend
npm run dev

# Seed data
npx sequelize-cli db:seed:all
```

---

## 📁 Project Structure

### Backend Structure

```
backend/
├── config/
│   └── database.js           # Database configuration
├── controllers/              # Request handlers
│   ├── auth.controller.js
│   ├── employee.controller.js
│   ├── timesheet.controller.js
│   ├── leave.controller.js
│   └── payroll.controller.js
├── middleware/               # Express middleware
│   ├── auth.simple.js        # Authentication & authorization
│   ├── error-handler.js      # Global error handler
│   └── validators/           # Joi validation schemas
│       ├── employee.validator.js
│       ├── timesheet.validator.js
│       └── leave.validator.js
├── models/                   # Sequelize models
│   ├── index.js              # Model initialization
│   ├── user.model.js
│   ├── employee.model.js
│   ├── timesheet.model.js
│   └── leave-request.model.js
├── routes/                   # API routes
│   ├── auth.routes.js
│   ├── employee.routes.js
│   ├── timesheet.routes.js
│   └── leave.routes.js
├── seeders/                  # Database seeders
│   ├── 20240101000001-demo-users.js
│   ├── 20240101000002-demo-departments.js
│   └── 20240101000003-demo-employees.js
├── utils/                    # Utility functions
│   ├── logger.js
│   └── helpers.js
├── .env.production.template  # Environment template
├── package.json
└── server.js                 # Application entry point
```

### Frontend Structure

```
frontend/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/           # Reusable components
│   │   ├── common/           # Generic components
│   │   │   ├── Button.js
│   │   │   ├── Input.js
│   │   │   └── Table.js
│   │   ├── layout/           # Layout components
│   │   │   ├── Header.js
│   │   │   ├── Sidebar.js
│   │   │   └── Footer.js
│   │   └── forms/            # Form components
│   │       ├── EmployeeForm.js
│   │       └── TimesheetForm.js
│   ├── pages/                # Page components
│   │   ├── Dashboard.js
│   │   ├── Employees.js
│   │   ├── Timesheets.js
│   │   └── Leaves.js
│   ├── context/              # React Context
│   │   └── AuthContext.js
│   ├── services/             # API services
│   │   ├── api.js            # Axios configuration
│   │   ├── authService.js
│   │   ├── employeeService.js
│   │   └── timesheetService.js
│   ├── utils/                # Utilities
│   │   ├── constants.js
│   │   └── helpers.js
│   ├── App.js                # Main app component
│   ├── App.css
│   └── index.js              # Entry point
├── package.json
└── .env                      # Environment variables
```

---

## 📐 Coding Standards

### JavaScript Style Guide

**General Principles**:
- Use ES6+ syntax
- Prefer `const` over `let`, avoid `var`
- Use arrow functions for anonymous functions
- Use async/await over callbacks
- Use template literals for string interpolation

**Example**:
```javascript
// ✅ GOOD
const getEmployeeById = async (id) => {
  try {
    const employee = await Employee.findByPk(id);
    if (!employee) {
      throw new Error('Employee not found');
    }
    return employee;
  } catch (error) {
    throw error;
  }
};

// ❌ BAD
function getEmployeeById(id, callback) {
  Employee.findByPk(id).then(function(employee) {
    if (!employee) {
      callback('Employee not found');
    } else {
      callback(null, employee);
    }
  });
}
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| **Variables** | camelCase | `employeeData`, `totalHours` |
| **Constants** | UPPER_SNAKE_CASE | `MAX_LOGIN_ATTEMPTS`, `API_URL` |
| **Functions** | camelCase | `calculateSalary()`, `validateInput()` |
| **Classes** | PascalCase | `EmployeeController`, `AuthService` |
| **Files** | kebab-case | `employee-controller.js`, `auth-service.js` |
| **Database Tables** | snake_case | `employees`, `leave_requests` |
| **Database Columns** | snake_case | `first_name`, `hire_date` |

### Code Formatting

**Prettier Configuration** (`.prettierrc`):
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

**ESLint Configuration** (`.eslintrc.js`):
```javascript
module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  extends: ['eslint:recommended', 'prettier'],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    'no-console': 'warn',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'prefer-const': 'error',
    'no-var': 'error',
  },
};
```

### Comments & Documentation

**Function Documentation**:
```javascript
/**
 * Creates a new employee record
 * @param {Object} employeeData - Employee information
 * @param {string} employeeData.firstName - Employee's first name
 * @param {string} employeeData.email - Employee's email address
 * @param {string} employeeData.departmentId - Department UUID
 * @returns {Promise<Object>} Created employee object
 * @throws {ValidationError} If employee data is invalid
 * @throws {DuplicateError} If email already exists
 */
async function createEmployee(employeeData) {
  // Implementation
}
```

**Code Comments**:
```javascript
// ✅ GOOD - Explains WHY, not WHAT
// Calculate net salary after deductions for tax purposes
const netSalary = grossSalary - totalDeductions;

// ❌ BAD - States the obvious
// Subtract total deductions from gross salary
const netSalary = grossSalary - totalDeductions;
```

---

## 🔀 Git Workflow

### Branch Strategy

```
main (production)
  ├── develop (integration)
  │   ├── feature/employee-import
  │   ├── feature/timesheet-bulk-edit
  │   ├── bugfix/login-timeout
  │   └── hotfix/payroll-calculation
```

**Branch Naming**:
- `feature/` - New features
- `bugfix/` - Bug fixes
- `hotfix/` - Urgent production fixes
- `chore/` - Maintenance tasks
- `docs/` - Documentation updates

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance

**Examples**:
```bash
# Feature
feat(employees): add bulk import functionality

# Bug fix
fix(timesheets): correct total hours calculation for half-days

# Documentation
docs(api): update authentication examples in README

# Refactoring
refactor(auth): simplify JWT token generation logic
```

### Development Workflow

```bash
# 1. Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/my-new-feature

# 2. Make changes and commit
git add .
git commit -m "feat(module): add new functionality"

# 3. Push branch
git push origin feature/my-new-feature

# 4. Create Pull Request on GitHub
# - Target: develop
# - Add reviewers
# - Link related issues

# 5. After approval, merge to develop
# 6. Delete feature branch
git branch -d feature/my-new-feature
git push origin --delete feature/my-new-feature
```

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings or errors
```

---

## 🔨 Development Guidelines

### Backend Development

#### Controller Pattern

```javascript
// controllers/employee.controller.js
const { Employee, Department, Position } = require('../models');
const { ValidationError } = require('../utils/errors');

/**
 * Get all employees with pagination
 */
exports.getAllEmployees = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, department } = req.query;
    
    // Build query
    const where = {};
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }
    if (department) {
      where.departmentId = department;
    }

    // Execute query
    const { count, rows } = await Employee.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      include: [
        { model: Department, as: 'department' },
        { model: Position, as: 'position' }
      ],
      order: [['firstName', 'ASC']]
    });

    // Return response
    res.json({
      success: true,
      message: 'Employees retrieved successfully',
      data: {
        employees: rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new employee
 */
exports.createEmployee = async (req, res, next) => {
  try {
    // Data already validated by middleware
    const employeeData = req.validatedData;

    // Check for duplicates
    const existing = await Employee.findOne({
      where: {
        [Op.or]: [
          { employeeId: employeeData.employeeId },
          { email: employeeData.email }
        ]
      }
    });

    if (existing) {
      throw new ValidationError('Employee ID or email already exists');
    }

    // Create employee
    const employee = await Employee.create(employeeData);

    // Log audit
    await logAudit({
      userId: req.user.id,
      action: 'EMPLOYEE_CREATE',
      resourceType: 'employee',
      resourceId: employee.id,
      details: { employeeData },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: employee
    });
  } catch (error) {
    next(error);
  }
};
```

#### Error Handling

```javascript
// middleware/error-handler.js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400);
    this.errors = errors;
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

// Global error handler
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = 'Validation error';
    const errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
    return res.status(statusCode).json({
      success: false,
      message,
      errors
    });
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    message = 'Duplicate entry';
  }

  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    statusCode,
    url: req.url,
    method: req.method
  });

  res.status(statusCode).json({
    success: false,
    message,
    ...(err.errors && { errors: err.errors })
  });
};

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  errorHandler
};
```

### Frontend Development

#### Component Structure

```javascript
// components/employees/EmployeeList.js
import React, { useState, useEffect } from 'react';
import { employeeService } from '../../services/employeeService';
import Table from '../common/Table';
import Button from '../common/Button';

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    limit: 10
  });

  // Fetch employees
  useEffect(() => {
    fetchEmployees();
  }, [pagination.currentPage]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeeService.getAll({
        page: pagination.currentPage,
        limit: pagination.limit
      });
      
      setEmployees(response.data.employees);
      setPagination(prev => ({
        ...prev,
        totalPages: response.data.pagination.totalPages
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'employeeId', label: 'Employee ID' },
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'email', label: 'Email' },
    { key: 'department.name', label: 'Department' },
    { key: 'position.title', label: 'Position' },
  ];

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="employee-list">
      <div className="header">
        <h2>Employees</h2>
        <Button onClick={() => {/* navigate to create */}}>
          Add Employee
        </Button>
      </div>
      
      <Table 
        data={employees}
        columns={columns}
        onRowClick={(employee) => {/* navigate to details */}}
      />

      <div className="pagination">
        <Button 
          disabled={pagination.currentPage === 1}
          onClick={() => setPagination(prev => ({ 
            ...prev, 
            currentPage: prev.currentPage - 1 
          }))}
        >
          Previous
        </Button>
        <span>
          Page {pagination.currentPage} of {pagination.totalPages}
        </span>
        <Button 
          disabled={pagination.currentPage === pagination.totalPages}
          onClick={() => setPagination(prev => ({ 
            ...prev, 
            currentPage: prev.currentPage + 1 
          }))}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default EmployeeList;
```

#### API Service Pattern

```javascript
// services/employeeService.js
import api from './api';

export const employeeService = {
  /**
   * Get all employees
   */
  getAll: async (params = {}) => {
    const response = await api.get('/employees', { params });
    return response.data;
  },

  /**
   * Get single employee
   */
  getById: async (id) => {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },

  /**
   * Create employee
   */
  create: async (data) => {
    const response = await api.post('/employees', data);
    return response.data;
  },

  /**
   * Update employee
   */
  update: async (id, data) => {
    const response = await api.put(`/employees/${id}`, data);
    return response.data;
  },

  /**
   * Delete employee
   */
  delete: async (id) => {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  }
};
```

---

## 🗄️ Database Management

### Migrations

**Create Migration**:
```bash
npx sequelize-cli migration:generate --name add-esi-number-to-employees
```

**Migration File**:
```javascript
// migrations/20251027-add-esi-number-to-employees.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('employees', 'esi_number', {
      type: Sequelize.STRING(17),
      allowNull: true,
      comment: 'ESI Number (Employee State Insurance)'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('employees', 'esi_number');
  }
};
```

**Run Migrations**:
```bash
npx sequelize-cli db:migrate
```

**Rollback**:
```bash
npx sequelize-cli db:migrate:undo
```

### Seeders

**Create Seeder**:
```bash
npx sequelize-cli seed:generate --name demo-departments
```

**Seeder File**:
```javascript
// seeders/20240101-demo-departments.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('departments', [
      {
        id: '550e8400-e29b-41d4-a716-446655440010',
        name: 'Engineering',
        description: 'Software development team',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440011',
        name: 'Sales',
        description: 'Sales and business development',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('departments', null, {});
  }
};
```

**Run Seeders**:
```bash
npx sequelize-cli db:seed:all
```

---

## 🧪 Testing

### Unit Testing

```javascript
// tests/controllers/employee.controller.test.js
const { createEmployee } = require('../../controllers/employee.controller');
const { Employee } = require('../../models');

jest.mock('../../models');

describe('Employee Controller', () => {
  describe('createEmployee', () => {
    it('should create employee successfully', async () => {
      const mockEmployee = {
        id: 'uuid',
        employeeId: 'SKYT001',
        firstName: 'John',
        lastName: 'Doe'
      };

      Employee.create.mockResolvedValue(mockEmployee);

      const req = {
        validatedData: mockEmployee,
        user: { id: 'admin-uuid' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await createEmployee(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Employee created successfully',
        data: mockEmployee
      });
    });
  });
});
```

**Run Tests**:
```bash
cd backend
npm test
```

---

## 🐛 Debugging

### VS Code Debugging

1. Set breakpoints in code
2. Press F5 or use Debug panel
3. Select "Debug Backend" configuration
4. Step through code with F10 (step over) or F11 (step into)

### Console Logging

```javascript
// Use different log levels
logger.debug('Detailed debug info');
logger.info('General information');
logger.warn('Warning message');
logger.error('Error occurred', { error });
```

---

## 🔧 Troubleshooting

### Common Issues

**Issue**: Database connection error
```
Solution: Check PostgreSQL service, verify credentials in .env
```

**Issue**: Port 5000 already in use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Change port in .env
PORT=5001
```

**Issue**: JWT token expired
```
Solution: Re-login to get new token, or increase JWT_EXPIRES_IN
```

---

**Next**: [User Guide](./06-USER_GUIDE.md)
