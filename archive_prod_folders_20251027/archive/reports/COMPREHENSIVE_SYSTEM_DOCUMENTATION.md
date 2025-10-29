# SkyRakSys HRM System - Comprehensive Low-Level Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [API Documentation](#api-documentation)
5. [Frontend Architecture](#frontend-architecture)
6. [Security Implementation](#security-implementation)
7. [File Structure](#file-structure)
8. [Component Analysis](#component-analysis)
9. [Service Layer](#service-layer)
10. [State Management](#state-management)

## 1. System Overview

### 1.1 Technology Stack
- **Backend**: Node.js, Express.js, Sequelize ORM
- **Database**: SQLite (development), PostgreSQL (production)
- **Frontend**: React.js 18.3.1, Material-UI 5.15.0
- **Authentication**: JWT tokens, bcryptjs
- **File Upload**: Multer middleware
- **Security**: Helmet, CORS, Rate limiting
- **Testing**: Jest, Supertest, Puppeteer

### 1.2 Core Modules
1. **User Management** - Authentication, authorization, user profiles
2. **Employee Management** - Employee records, personal details, statutory information
3. **Leave Management** - Leave requests, approvals, balance tracking
4. **Timesheet Management** - Time tracking, project allocation, approval workflow
5. **Payroll Management** - Salary structures, payslip generation, tax calculations
6. **Dashboard & Reporting** - Analytics, performance metrics, reports

## 2. Architecture

### 2.1 Backend Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Database      │
│   (React)       │◄───┤   (Express.js)  │◄───┤   (PG)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        │              ┌─────────────────┐              │
        └──────────────┤   Services      │──────────────┘
                       │   (Business)    │
                       └─────────────────┘
```

### 2.2 Directory Structure
```
skyraksys_hrm/
├── backend/
│   ├── config/         # Database configuration
│   ├── controllers/    # Business logic controllers
│   ├── middleware/     # Authentication, validation, security
│   ├── models/         # Sequelize models (Database schema)
│   ├── routes/         # API endpoint definitions
│   ├── services/       # Business logic services
│   ├── utils/          # Utility functions
│   ├── uploads/        # File upload storage
│   └── server.js       # Main application entry point
├── frontend/
│   ├── public/         # Static assets
│   └── src/
│       ├── components/ # React components
│       ├── contexts/   # React context providers
│       ├── services/   # API communication services
│       ├── hooks/      # Custom React hooks
│       └── utils/      # Utility functions
└── database.sqlite     # SQLite database file
```

## 3. Database Schema

### 3.1 Core Tables

#### 3.1.1 Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firstName VARCHAR(50) NOT NULL,
  lastName VARCHAR(50) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'hr', 'manager', 'employee') DEFAULT 'employee',
  isActive BOOLEAN DEFAULT true,
  lastLoginAt TIMESTAMP,
  passwordChangedAt TIMESTAMP,
  emailVerifiedAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP
);
```

**Fields Analysis:**
- `id`: UUID primary key for security
- `role`: Enum-based role system (admin > hr > manager > employee)
- `isActive`: Soft deletion flag
- `paranoid`: Sequelize soft delete with deletedAt timestamp

#### 3.1.2 Employees Table
```sql
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employeeId VARCHAR(255) UNIQUE NOT NULL,
  firstName VARCHAR(50) NOT NULL,
  lastName VARCHAR(50) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(15),
  hireDate DATE NOT NULL,
  status ENUM('Active', 'Inactive', 'On Leave', 'Terminated') DEFAULT 'Active',
  
  -- Statutory Details (India-specific)
  aadhaarNumber VARCHAR(12),
  panNumber VARCHAR(10),
  uanNumber VARCHAR(255),
  pfNumber VARCHAR(255),
  esiNumber VARCHAR(255),
  
  -- Bank Details
  bankName VARCHAR(255),
  bankAccountNumber VARCHAR(255),
  ifscCode VARCHAR(11),
  bankBranch VARCHAR(255),
  accountHolderName VARCHAR(255),
  
  -- Personal Details
  address TEXT,
  city VARCHAR(255),
  state VARCHAR(255),
  pinCode VARCHAR(6),
  emergencyContactName VARCHAR(255),
  emergencyContactPhone VARCHAR(255),
  emergencyContactRelation VARCHAR(255),
  dateOfBirth DATE,
  gender ENUM('Male', 'Female', 'Other'),
  photoUrl VARCHAR(255),
  maritalStatus ENUM('Single', 'Married', 'Divorced', 'Widowed'),
  nationality VARCHAR(255) DEFAULT 'Indian',
  
  -- Work Details
  workLocation VARCHAR(255),
  employmentType ENUM('Full-time', 'Part-time', 'Contract', 'Intern') DEFAULT 'Full-time',
  joiningDate DATE,
  confirmationDate DATE,
  resignationDate DATE,
  lastWorkingDate DATE,
  probationPeriod INTEGER DEFAULT 6,
  noticePeriod INTEGER DEFAULT 30,
  
  -- Foreign Keys
  userId UUID REFERENCES users(id),
  departmentId UUID REFERENCES departments(id),
  positionId UUID REFERENCES positions(id),
  managerId UUID REFERENCES employees(id),
  
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP
);
```

**Indian Compliance Fields:**
- `aadhaarNumber`: Unique identity number (12 digits)
- `panNumber`: Tax identification (10 characters)
- `uanNumber`: Provident Fund UAN
- `pfNumber`: PF account number
- `esiNumber`: Employee State Insurance number

#### 3.1.3 Leave Requests Table
```sql
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employeeId UUID NOT NULL REFERENCES employees(id),
  leaveTypeId UUID NOT NULL REFERENCES leave_types(id),
  startDate DATE NOT NULL,
  endDate DATE NOT NULL,
  totalDays INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status ENUM('Pending', 'Approved', 'Rejected', 'Cancelled') DEFAULT 'Pending',
  approvedBy UUID REFERENCES employees(id),
  approvedAt TIMESTAMP,
  rejectedAt TIMESTAMP,
  approverComments TEXT,
  isHalfDay BOOLEAN DEFAULT false,
  halfDayType ENUM('First Half', 'Second Half'),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP
);
```

#### 3.1.4 Payroll Table
```sql
CREATE TABLE payrolls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employeeId UUID NOT NULL REFERENCES employees(id),
  payPeriodStart DATE NOT NULL,
  payPeriodEnd DATE NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  grossSalary DECIMAL(10,2) NOT NULL,
  totalDeductions DECIMAL(10,2) DEFAULT 0,
  netSalary DECIMAL(10,2) NOT NULL,
  workingDays INTEGER DEFAULT 0,
  actualWorkingDays INTEGER DEFAULT 0,
  leaveDays DECIMAL(5,2) DEFAULT 0,
  overtimeHours DECIMAL(5,2) DEFAULT 0,
  overtimePay DECIMAL(10,2) DEFAULT 0,
  status ENUM('Draft', 'Processed', 'Paid', 'Cancelled') DEFAULT 'Draft',
  processedBy UUID REFERENCES employees(id),
  processedAt TIMESTAMP,
  paidAt TIMESTAMP,
  paymentReference VARCHAR(255),
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP,
  UNIQUE(employeeId, month, year)
);
```

#### 3.1.5 Timesheets Table
```sql
CREATE TABLE timesheets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employeeId UUID NOT NULL REFERENCES employees(id),
  projectId UUID REFERENCES projects(id),
  taskId UUID REFERENCES tasks(id),
  workDate DATE NOT NULL,
  hoursWorked DECIMAL(4,2) NOT NULL CHECK (hoursWorked >= 0 AND hoursWorked <= 24),
  description TEXT NOT NULL,
  status ENUM('Draft', 'Submitted', 'Approved', 'Rejected') DEFAULT 'Draft',
  approvedBy UUID REFERENCES employees(id),
  submittedAt TIMESTAMP,
  approvedAt TIMESTAMP,
  rejectedAt TIMESTAMP,
  approverComments TEXT,
  clockInTime TIME,
  clockOutTime TIME,
  breakHours DECIMAL(4,2) DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP,
  UNIQUE(employeeId, workDate, projectId, taskId)
);
```

### 3.2 Relationships and Associations

#### 3.2.1 User-Employee Relationship
```javascript
// One-to-One: User has one Employee profile
User.hasOne(Employee, { foreignKey: 'userId', as: 'employee' });
Employee.belongsTo(User, { foreignKey: 'userId', as: 'user' });
```

#### 3.2.2 Employee Hierarchy
```javascript
// Self-referencing: Employee can have a manager (also an Employee)
Employee.belongsTo(Employee, { foreignKey: 'managerId', as: 'manager' });
Employee.hasMany(Employee, { foreignKey: 'managerId', as: 'subordinates' });
```

#### 3.2.3 Leave Management Relationships
```javascript
Employee.hasMany(LeaveRequest, { foreignKey: 'employeeId', as: 'leaveRequests' });
Employee.hasMany(LeaveBalance, { foreignKey: 'employeeId', as: 'leaveBalances' });
LeaveRequest.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
LeaveRequest.belongsTo(Employee, { foreignKey: 'approvedBy', as: 'approver' });
```

### 3.3 Indexes and Performance
```sql
-- Performance indexes
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_department ON employees(departmentId);
CREATE INDEX idx_leave_requests_employee_status ON leave_requests(employeeId, status);
CREATE INDEX idx_timesheets_employee_date ON timesheets(employeeId, workDate);
CREATE INDEX idx_payrolls_employee_period ON payrolls(employeeId, month, year);
```

## 4. API Documentation

### 4.1 Authentication Endpoints

#### 4.1.1 POST /api/auth/login
**Purpose**: User authentication
**Access**: Public
**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "employee",
      "employeeId": "uuid"
    }
  }
}
```

#### 4.1.2 GET /api/auth/profile
**Purpose**: Get current user profile
**Access**: Authenticated users
**Headers**: `Authorization: Bearer <token>`
**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "employee",
    "isActive": true,
    "lastLoginAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### 4.2 Employee Management Endpoints

#### 4.2.1 GET /api/employees
**Purpose**: List employees with filtering and pagination
**Access**: Authenticated users (role-based filtering)
**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Records per page (default: 10, max: 100)
- `search`: Search term for name/email
- `department`: Filter by department ID
- `status`: Filter by employee status
- `sortBy`: Sort field (default: firstName)
- `sortOrder`: ASC/DESC (default: ASC)

**Role-based Access**:
- **Admin/HR**: Can view all employees
- **Manager**: Can view subordinates and own record
- **Employee**: Can view only own record

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "employeeId": "EMP001",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "status": "Active",
      "department": {
        "id": "uuid",
        "name": "Information Technology"
      },
      "position": {
        "id": "uuid",
        "title": "Software Developer"
      },
      "manager": {
        "id": "uuid",
        "firstName": "Jane",
        "lastName": "Smith"
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalRecords": 50
  }
}
```

#### 4.2.2 POST /api/employees
**Purpose**: Create new employee
**Access**: Admin, HR
**Content-Type**: multipart/form-data (for photo upload)
**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "hireDate": "2025-01-01",
  "departmentId": "uuid",
  "positionId": "uuid",
  "managerId": "uuid",
  "aadhaarNumber": "123456789012",
  "panNumber": "ABCDE1234F",
  "salaryStructure": {
    "basicSalary": 50000,
    "hra": 15000,
    "conveyanceAllowance": 2000
  }
}
```

### 4.3 Leave Management Endpoints

#### 4.3.1 GET /api/leave/requests
**Purpose**: Get leave requests
**Access**: Authenticated users
**Query Parameters**:
- `status`: Filter by status
- `startDate`: Filter from date
- `endDate`: Filter to date
- `employeeId`: Filter by employee (admin/hr/manager only)

#### 4.3.2 POST /api/leave/requests
**Purpose**: Submit leave request
**Access**: All authenticated users
**Request Body**:
```json
{
  "leaveTypeId": "uuid",
  "startDate": "2025-02-01",
  "endDate": "2025-02-03",
  "reason": "Personal work",
  "isHalfDay": false
}
```

### 4.4 Timesheet Endpoints

#### 4.4.1 GET /api/timesheets
**Purpose**: Get timesheets
**Access**: Authenticated users
**Query Parameters**:
- `startDate`: Filter from date
- `endDate`: Filter to date
- `status`: Filter by status
- `projectId`: Filter by project

#### 4.4.2 POST /api/timesheets
**Purpose**: Submit timesheet entry
**Access**: All authenticated users
**Request Body**:
```json
{
  "workDate": "2025-01-15",
  "hoursWorked": 8.5,
  "projectId": "uuid",
  "taskId": "uuid",
  "description": "Worked on user authentication module",
  "clockInTime": "09:00:00",
  "clockOutTime": "18:30:00",
  "breakHours": 1.0
}
```

### 4.5 Payroll Endpoints

#### 4.5.1 GET /api/payroll
**Purpose**: Get payroll records
**Access**: Admin, HR, Employee (own records)
**Query Parameters**:
- `month`: Filter by month
- `year`: Filter by year
- `employeeId`: Filter by employee (admin/hr only)
- `status`: Filter by status

#### 4.5.2 POST /api/payroll/generate
**Purpose**: Generate payroll for a period
**Access**: Admin, HR
**Request Body**:
```json
{
  "month": 1,
  "year": 2025,
  "employeeIds": ["uuid1", "uuid2"] // Optional, if not provided, generates for all
}
```

## 5. Frontend Architecture

### 5.1 Component Structure
```
src/components/
├── common/                 # Reusable UI components
│   ├── ResponsiveTable.js     # Adaptive table/card component
│   ├── MobileOptimizedNavigation.js  # Mobile-first navigation
│   └── ResponsiveForm.js      # Adaptive form layouts
├── features/               # Feature-specific components
│   ├── auth/
│   │   └── Login.js           # Authentication component
│   ├── employees/
│   │   ├── EmployeeList.js    # Employee listing with search/filter
│   │   ├── EmployeeForm.js    # Employee creation/editing
│   │   └── EmployeeProfile.js # Employee detail view
│   ├── leave/
│   │   ├── LeaveManagement.js # Leave request management
│   │   └── LeaveSubmission.js # Leave request form
│   ├── timesheet/
│   │   └── TimesheetManagement.js # Timesheet tracking
│   └── payroll/
│       └── PayrollManagement.js   # Payroll processing
├── layout/                 # Layout components
│   ├── Layout.js              # Main application layout
│   └── Dashboard.js           # Dashboard container
└── ui/                     # Basic UI elements
    ├── Loading.js             # Loading indicators
    └── ErrorBoundary.js       # Error handling
```

### 5.2 State Management Architecture

#### 5.2.1 Context Providers
```javascript
// AuthContext.js - Authentication state
const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  login: (email, password) => {},
  logout: () => {},
  register: (userData) => {}
});

// LoadingContext.js - Global loading states
const LoadingContext = createContext({
  isLoading: (key) => boolean,
  setLoading: (key, status) => {},
  globalLoading: false
});

// NotificationContext.js - Toast notifications
const NotificationContext = createContext({
  showNotification: (message, type) => {},
  hideNotification: (id) => {}
});
```

#### 5.2.2 Custom Hooks
```javascript
// useAuth - Authentication utilities
export const useAuth = () => {
  const context = useContext(AuthContext);
  return {
    user: context.user,
    isAuthenticated: context.isAuthenticated,
    isAdmin: () => context.user?.role === 'admin',
    isHR: () => ['admin', 'hr'].includes(context.user?.role),
    isManager: () => ['admin', 'hr', 'manager'].includes(context.user?.role),
    isEmployee: () => context.user?.role === 'employee',
    login: context.login,
    logout: context.logout
  };
};

// useApi - API communication with error handling
export const useApi = () => {
  const { setLoading } = useLoading();
  const { showNotification } = useNotifications();
  
  const apiCall = async (apiFunction, loadingKey) => {
    try {
      setLoading(loadingKey, true);
      const result = await apiFunction();
      return { success: true, data: result };
    } catch (error) {
      showNotification(error.message, 'error');
      return { success: false, error };
    } finally {
      setLoading(loadingKey, false);
    }
  };
  
  return { apiCall };
};
```

### 5.3 Responsive Design Implementation

#### 5.3.1 Mobile-First Components
```javascript
// ResponsiveTable.js - Automatically switches between table and card view
const ResponsiveTable = ({ data, columns, renderMobileCard }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  return isMobile ? (
    // Mobile card view
    <Box>
      {data.map(item => renderMobileCard(item))}
    </Box>
  ) : (
    // Desktop table view
    <Table>
      <TableHead>
        <TableRow>
          {columns.map(col => <TableCell key={col.id}>{col.label}</TableCell>)}
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map(item => (
          <TableRow key={item.id}>
            {columns.map(col => (
              <TableCell key={col.id}>
                {col.render ? col.render(item) : item[col.field]}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
```

#### 5.3.2 Breakpoint System
```javascript
// Material-UI breakpoints
const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,      // Mobile portrait
      sm: 600,    // Mobile landscape
      md: 960,    // Tablet
      lg: 1280,   // Desktop
      xl: 1920    // Large desktop
    }
  }
});

// Usage in components
const useStyles = makeStyles(theme => ({
  container: {
    padding: theme.spacing(2),
    [theme.breakpoints.down('md')]: {
      padding: theme.spacing(1),
    },
    [theme.breakpoints.up('lg')]: {
      padding: theme.spacing(3),
    }
  }
}));
```

## 6. Security Implementation

### 6.1 Authentication & Authorization

#### 6.1.1 JWT Token Structure
```javascript
// Token payload
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "employee",
  "employeeId": "uuid",
  "iat": 1704067200,  // Issued at
  "exp": 1704153600   // Expires (24 hours)
}

// Token generation
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employee?.id
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};
```

#### 6.1.2 Role-Based Access Control (RBAC)
```javascript
// Authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    next();
  };
};

// Usage in routes
router.get('/admin-only', authenticateToken, authorize('admin'), handler);
router.get('/hr-manager', authenticateToken, authorize('admin', 'hr'), handler);
```

#### 6.1.3 Field-Level Access Control
```javascript
// Enhanced field access control middleware
const enhancedFieldAccessControl = () => {
  return (req, res, next) => {
    req.filterEmployeeData = (employeeData, isOwnRecord = false) => {
      const userRole = req.user.role;
      
      // Define field access rules
      const fieldAccess = {
        admin: ['*'], // All fields
        hr: ['*'],    // All fields
        manager: [
          'id', 'employeeId', 'firstName', 'lastName', 'email', 
          'phone', 'status', 'department', 'position', 'hireDate'
          // Exclude: salary, bank details, statutory details
        ],
        employee: isOwnRecord ? [
          'id', 'employeeId', 'firstName', 'lastName', 'email',
          'phone', 'address', 'city', 'state', 'pinCode',
          'emergencyContactName', 'emergencyContactPhone'
          // Own record: include personal details, exclude salary/bank
        ] : [
          'id', 'employeeId', 'firstName', 'lastName', 'email', 'phone'
          // Other records: basic info only
        ]
      };
      
      const allowedFields = fieldAccess[userRole] || [];
      
      if (allowedFields.includes('*')) {
        return employeeData; // Admin/HR get all fields
      }
      
      // Filter data to include only allowed fields
      const filteredData = {};
      allowedFields.forEach(field => {
        if (employeeData[field] !== undefined) {
          filteredData[field] = employeeData[field];
        }
      });
      
      return filteredData;
    };
    
    next();
  };
};
```

### 6.2 Input Validation

#### 6.2.1 Schema Validation with Joi
```javascript
const Joi = require('joi');

const employeeSchema = {
  create: Joi.object({
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^[0-9]{10,15}$/),
    hireDate: Joi.date().required(),
    aadhaarNumber: Joi.string().pattern(/^[0-9]{12}$/),
    panNumber: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/),
    departmentId: Joi.string().uuid().required(),
    positionId: Joi.string().uuid().required(),
    managerId: Joi.string().uuid().optional()
  }),
  
  update: Joi.object({
    firstName: Joi.string().min(2).max(50),
    lastName: Joi.string().min(2).max(50),
    phone: Joi.string().pattern(/^[0-9]{10,15}$/),
    status: Joi.string().valid('Active', 'Inactive', 'On Leave', 'Terminated'),
    // ... other updatable fields
  })
};

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(d => d.message)
      });
    }
    next();
  };
};
```

### 6.3 Security Middleware Stack

#### 6.3.1 Enhanced Security Features
```javascript
// Enhanced session tracking
const enhancedSessionTracking = () => {
  return (req, res, next) => {
    if (req.user) {
      req.sessionInfo = {
        userId: req.user.userId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date()
      };
      
      // Log session activity
      console.log(`Session: ${req.user.email} from ${req.ip}`);
    }
    next();
  };
};

// Comprehensive audit logging
const comprehensiveAuditLog = () => {
  return (req, res, next) => {
    const originalSend = res.send;
    res.send = function(data) {
      // Log the request and response
      const auditEntry = {
        timestamp: new Date(),
        method: req.method,
        url: req.url,
        user: req.user?.email || 'anonymous',
        ip: req.ip,
        statusCode: res.statusCode,
        userAgent: req.get('User-Agent')
      };
      
      // Store audit log (implement your logging solution)
      console.log('Audit:', JSON.stringify(auditEntry));
      
      originalSend.call(this, data);
    };
    next();
  };
};

// Rate limiting with different limits for different operations
const enhancedRateLimiting = (options = {}) => {
  const { maxRequests = 100, maxSensitiveRequests = 20 } = options;
  
  return (req, res, next) => {
    // Implement sophisticated rate limiting
    // Different limits for different endpoints/operations
    // Higher limits for read operations, lower for write operations
    next();
  };
};
```

## 7. File Structure Analysis

### 7.1 Backend File Structure
```
backend/
├── config/
│   └── database.js           # Database configuration for different environments
├── controllers/
│   └── settings.controller.js # Business logic controllers
├── middleware/
│   ├── auth.simple.js        # JWT authentication & authorization
│   ├── validation.js         # Input validation using Joi
│   ├── upload.js            # File upload handling with Multer
│   ├── fieldAccessControl.js # Field-level access control
│   ├── enhancedFieldAccessControl.js # Advanced field filtering
│   └── enhancedSecurity.js  # Security middleware stack
├── models/
│   ├── index.js             # Sequelize initialization & model associations
│   ├── user.model.js        # User authentication model
│   ├── employee.model.js    # Employee information model
│   ├── department.model.js  # Department organization model
│   ├── position.model.js    # Job position model
│   ├── leave-request.model.js # Leave management model
│   ├── leave-balance.model.js # Leave balance tracking
│   ├── leave-type.model.js  # Leave type configuration
│   ├── timesheet.model.js   # Time tracking model
│   ├── payroll.model.js     # Payroll processing model
│   ├── payroll-component.model.js # Salary component breakdown
│   ├── salary-structure.model.js # Employee salary structure
│   ├── project.model.js     # Project management
│   ├── task.model.js        # Task management
│   └── refresh-token.model.js # JWT refresh token management
├── routes/
│   ├── auth.routes.js       # Authentication endpoints
│   ├── employee.routes.js   # Employee management API
│   ├── leave.routes.js      # Leave management API
│   ├── timesheet.routes.js  # Timesheet API
│   ├── payroll.routes.js    # Payroll API
│   ├── dashboard.routes.js  # Dashboard data API
│   └── settings.routes.js   # Application settings API
├── services/                # Business logic services (planned)
├── utils/                   # Utility functions
├── uploads/                 # File upload storage directory
└── server.js               # Main application entry point
```

### 7.2 Frontend File Structure
```
frontend/src/
├── components/
│   ├── common/              # Reusable components
│   │   ├── ResponsiveTable.js        # Adaptive table/card component
│   │   ├── MobileOptimizedNavigation.js # Mobile navigation
│   │   └── ResponsiveForm.js         # Adaptive form layouts
│   ├── features/            # Feature-based organization
│   │   ├── auth/
│   │   │   └── Login.js             # Authentication component
│   │   ├── employees/
│   │   │   ├── EmployeeList.js      # Employee listing & management
│   │   │   ├── EmployeeForm.js      # Employee creation/editing
│   │   │   └── EmployeeProfile.js   # Employee detail view
│   │   ├── leave/
│   │   │   ├── LeaveManagement.js   # Leave request management
│   │   │   └── LeaveSubmission.js   # Leave request submission
│   │   ├── timesheet/
│   │   │   └── TimesheetManagement.js # Timesheet tracking
│   │   └── payroll/
│   │       └── PayrollManagement.js  # Payroll processing interface
│   ├── layout/
│   │   ├── Layout.js               # Main application layout
│   │   └── Dashboard.js            # Dashboard container
│   └── ui/                 # Basic UI components
│       ├── Loading.js              # Loading indicators
│       └── ErrorBoundary.js        # Error handling component
├── contexts/               # React Context providers
│   ├── AuthContext.js              # Authentication state management
│   ├── LoadingContext.js           # Global loading state
│   └── NotificationContext.js      # Toast notification system
├── services/               # API communication layer
│   ├── auth.service.js             # Authentication API calls
│   ├── employee.service.js         # Employee management API
│   ├── leave.service.js            # Leave management API
│   ├── timesheet.service.js        # Timesheet API
│   ├── payroll.service.js          # Payroll API
│   └── ApiService.js               # Base API service with interceptors
├── hooks/                  # Custom React hooks
├── utils/                  # Utility functions
├── http-common.js          # Axios configuration
└── App.js                  # Main application component
```

## 8. Component Analysis

### 8.1 ResponsiveTable Component
**Purpose**: Provides adaptive UI that switches between table (desktop) and card (mobile) views

**Features**:
- Automatic breakpoint detection using Material-UI's useMediaQuery
- Built-in mobile card components for different data types
- Touch-optimized interactions for mobile devices
- Expandable details in mobile view
- Consistent styling across devices

**Props Interface**:
```javascript
ResponsiveTable.propTypes = {
  data: PropTypes.array.required,           // Data to display
  columns: PropTypes.array.required,        // Column definitions
  renderMobileCard: PropTypes.func,         // Custom mobile card renderer
  loading: PropTypes.bool,                  // Loading state
  mobileBreakpoint: PropTypes.string,       // Breakpoint for mobile switch
  pagination: PropTypes.object,             // Pagination configuration
  onPageChange: PropTypes.func,             // Page change handler
  onRowsPerPageChange: PropTypes.func       // Rows per page handler
};
```

### 8.2 MobileOptimizedNavigation Component
**Purpose**: Mobile-first navigation system with swipeable drawer and bottom navigation

**Features**:
- Swipeable drawer for iOS-style navigation
- Bottom navigation for primary actions
- Speed dial for quick actions
- Touch gesture support
- Responsive design patterns

### 8.3 AuthContext Provider
**Purpose**: Centralized authentication state management

**State Management**:
```javascript
const authState = {
  user: null,                    // Current user object
  isAuthenticated: false,        // Authentication status
  loading: true                  // Initial loading state
};

const authActions = {
  login: async (email, password) => {
    // Authenticate user and update state
    const response = await authService.login(email, password);
    setUser(response.user);
    setIsAuthenticated(true);
    localStorage.setItem('accessToken', response.accessToken);
  },
  
  logout: async () => {
    // Clear user state and tokens
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('accessToken');
  },
  
  refreshToken: async () => {
    // Refresh JWT token if expired
  }
};
```

## 9. Service Layer

### 9.1 API Service Architecture
```javascript
// Base API service with interceptors
class ApiService {
  constructor() {
    this.http = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    this.setupInterceptors();
  }
  
  setupInterceptors() {
    // Request interceptor - Add auth token
    this.http.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Response interceptor - Handle errors
    this.http.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Unauthorized - redirect to login
          localStorage.removeItem('accessToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }
}
```

### 9.2 Employee Service Implementation
```javascript
class EmployeeService extends ApiService {
  async getAll(params = {}) {
    const response = await this.http.get('/employees', { params });
    return response.data;
  }
  
  async get(id) {
    const response = await this.http.get(`/employees/${id}`);
    return response.data.data;
  }
  
  async create(data) {
    const response = await this.http.post('/employees', data);
    return response.data.data;
  }
  
  async createWithPhoto(data, photo) {
    const formData = new FormData();
    
    // Separate salary structure from employee data
    const { salaryStructure, ...employeeData } = data;
    
    // Add employee data to form
    Object.keys(employeeData).forEach(key => {
      if (employeeData[key] !== null && employeeData[key] !== undefined) {
        formData.append(key, employeeData[key]);
      }
    });
    
    // Add salary structure as JSON
    if (salaryStructure) {
      formData.append('salaryStructure', JSON.stringify(salaryStructure));
    }
    
    // Add photo file
    if (photo) {
      formData.append('photo', photo);
    }
    
    const response = await this.http.post('/employees', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    return response.data.data;
  }
  
  async update(id, data) {
    const response = await this.http.put(`/employees/${id}`, data);
    return response.data.data;
  }
  
  async delete(id) {
    const response = await this.http.delete(`/employees/${id}`);
    return response.data;
  }
}
```

## 10. State Management

### 10.1 Context-Based State Management
The application uses React Context API for state management, organized into specific contexts:

#### 10.1.1 AuthContext
- Manages user authentication state
- Provides authentication methods (login, logout, register)
- Handles token storage and validation
- Provides role-based utility functions

#### 10.1.2 LoadingContext
- Manages loading states across the application
- Supports multiple concurrent loading states with keys
- Provides global loading indicator
- Prevents race conditions in loading states

#### 10.1.3 NotificationContext
- Manages toast notifications
- Supports different notification types (success, error, warning, info)
- Provides auto-dismiss functionality
- Queue management for multiple notifications

### 10.2 State Management Patterns

#### 10.2.1 Loading State Pattern
```javascript
// In components
const { isLoading, setLoading } = useLoading();
const { apiCall } = useApi();

const handleDataFetch = async () => {
  const result = await apiCall(
    () => employeeService.getAll(),
    'employee-list'  // Loading key
  );
  
  if (result.success) {
    setEmployees(result.data);
  }
};

// Loading state is automatically managed
const isLoadingEmployees = isLoading('employee-list');
```

#### 10.2.2 Error Handling Pattern
```javascript
// Centralized error handling in API service
const handleApiError = (error) => {
  const message = error.response?.data?.message || 'An error occurred';
  showNotification(message, 'error');
  
  // Log error for debugging
  console.error('API Error:', error);
  
  return { success: false, error: message };
};
```

## 11. Database Migration Strategy

### 11.1 Current Database Support
- **Development**: SQLite (file-based, lightweight)
- **Production**: PostgreSQL (scalable, robust)

### 11.2 Migration Considerations
1. **Data Types**: Ensure compatibility between SQLite and PostgreSQL
2. **UUID Support**: PostgreSQL native UUID vs SQLite string representation
3. **Enum Types**: PostgreSQL native enums vs SQLite string constraints
4. **Indexing**: Different index strategies for performance optimization

### 11.3 Environment Configuration
```javascript
// config/database.js
module.exports = {
  development: {
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: console.log
  },
  production: {
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    logging: false,
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000
    }
  }
};
```

## 12. Performance Optimization

### 12.1 Frontend Optimizations
1. **Code Splitting**: Lazy loading of route components
2. **Component Memoization**: React.memo for expensive components
3. **Bundle Analysis**: Webpack bundle analyzer for size optimization
4. **Image Optimization**: WebP format, lazy loading, responsive images

### 12.2 Backend Optimizations
1. **Database Indexing**: Strategic indexes on frequently queried fields
2. **Query Optimization**: Efficient joins, pagination, filtering
3. **Caching Strategy**: Redis for session storage, query result caching
4. **API Response Optimization**: Field filtering, data pagination

### 12.3 Security Hardening
1. **Input Sanitization**: XSS prevention, SQL injection protection
2. **Rate Limiting**: API endpoint protection, user-based limits
3. **HTTPS Enforcement**: SSL/TLS in production
4. **Security Headers**: Helmet.js configuration
5. **Audit Logging**: Comprehensive request/response logging

---

This documentation provides a comprehensive low-level analysis of the SkyRakSys HRM system, covering architecture, database design, API endpoints, frontend components, security implementation, and performance considerations. It serves as a complete reference for understanding the system's current state and can be used for comparison against requirements for future enhancements.
