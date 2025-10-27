# 📋 SkyRakSys HRM - Comprehensive Context Documentation

## 📖 Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Overview](#architecture-overview)
3. [Backend Architecture](#backend-architecture)
4. [Frontend Architecture](#frontend-architecture)
5. [Database Schema & Models](#database-schema--models)
6. [API Endpoints](#api-endpoints)
7. [Authentication & Authorization](#authentication--authorization)
8. [Business Logic & Workflows](#business-logic--workflows)
9. [Technology Stack](#technology-stack)
10. [Development Environment](#development-environment)
11. [Deployment & Configuration](#deployment--configuration)
12. [Testing Framework](#testing-framework)

---

## 🎯 System Overview

### Business Purpose
SkyRakSys HRM is a comprehensive Human Resource Management System designed for modern organizations to manage employee lifecycle, timesheets, leave requests, payroll, and performance tracking.

### Core Features
- **Employee Management**: Complete employee lifecycle management
- **Timesheet Management**: Weekly timesheet tracking with project/task allocation
- **Leave Management**: Leave requests, approvals, and balance tracking
- **Payroll Management**: Salary structures, payslips, and payroll processing
- **Project & Task Management**: Project allocation and task tracking
- **Role-Based Access Control**: Admin, HR, Manager, and Employee roles
- **Dashboard & Reporting**: Comprehensive analytics and reporting

### User Roles
- **Admin**: Full system access and configuration
- **HR Manager**: Employee management and HR operations
- **Manager**: Team management and approval workflows
- **Employee**: Self-service and task management

---

## 🏗️ Architecture Overview

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   React 18.3.1  │◄──►│   Node.js       │◄──►│   PostgreSQL    │
│   Material-UI   │    │   Express.js    │    │   Sequelize ORM │
│   React Router  │    │   JWT Auth      │    │   Foreign Keys  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Directory Structure
```
skyraksys_hrm/
├── 📂 backend/              # Node.js API Server
│   ├── 📂 config/           # Database & app configuration
│   ├── 📂 middleware/       # Authentication, validation, security
│   ├── 📂 models/           # Sequelize database models
│   ├── 📂 routes/           # API endpoint definitions
│   ├── 📂 controllers/      # Business logic controllers
│   ├── 📂 services/         # Business logic services
│   ├── 📂 utils/            # Utility functions
│   ├── 📂 uploads/          # File storage
│   └── 📄 server.js         # Application entry point
├── 📂 frontend/             # React User Interface
│   ├── 📂 public/           # Static assets
│   └── 📂 src/
│       ├── 📂 components/   # React components
│       ├── 📂 contexts/     # React context providers
│       ├── 📂 services/     # API communication
│       ├── 📂 utils/        # Helper functions
│       ├── 📄 App.js        # Main application
│       └── 📄 index.js      # React entry point
├── 📂 docs/                 # Documentation
├── 📂 scripts/              # Deployment & utility scripts
├── 📂 tests/                # Test files
├── 📄 docker-compose.yml    # Container orchestration
├── 📄 ecosystem.config.js   # PM2 configuration
└── 📄 package.json          # Root dependencies
```

---

## 🖥️ Backend Architecture

### Core Components

#### Models (Database Layer)
**Location**: `backend/models/`
**Key Models**:
- **User**: Authentication and user accounts
- **Employee**: Employee information and relationships
- **Department**: Organizational structure
- **Position**: Job positions and roles
- **Project**: Project management
- **Task**: Task allocation and tracking
- **Timesheet**: Weekly timesheet entries
- **LeaveRequest**: Leave application management
- **LeaveBalance**: Leave balance tracking
- **LeaveType**: Leave type definitions
- **Payroll**: Payroll processing
- **SalaryStructure**: Employee compensation structure

#### Database Relationships
```sql
-- Core relationships
User ──► Employee (1:1)
Employee ──► Department (N:1)
Employee ──► Position (N:1)
Employee ──► Employee (Manager) (N:1)
Employee ──► LeaveRequest (1:N)
Employee ──► Timesheet (1:N)
Employee ──► Payroll (1:N)

-- Project management
Project ──► Task (1:N)
Task ──► Employee (Assignee) (N:1)
Task ──► Timesheet (1:N)

-- Leave management
LeaveType ──► LeaveRequest (1:N)
LeaveType ──► LeaveBalance (1:N)
Employee ──► LeaveBalance (1:N)
```

#### Routes & API Endpoints
**Location**: `backend/routes/`
**Key Route Files**:
- `auth.routes.js`: Authentication endpoints
- `employee.routes.js`: Employee management
- `timesheet.routes.js`: Timesheet operations
- `leave.routes.js`: Leave management
- `project.routes.js`: Project management
- `task.routes.js`: Task management
- `payroll.routes.js`: Payroll operations
- `dashboard.routes.js`: Analytics and reporting

#### Middleware
**Location**: `backend/middleware/`
**Key Middleware**:
- **`auth.js`**: JWT authentication and role-based authorization
- **`validation.js`**: Joi schema validation for all endpoints
- **Security**: CORS, rate limiting, input sanitization

#### Configuration
**Database Configuration**:
- **Database**: PostgreSQL (SQLite permanently disabled)
- **ORM**: Sequelize with associations and constraints
- **Connection Pooling**: Configured for production scaling
- **SSL Support**: Available for production deployments

---

## ⚛️ Frontend Architecture

### Component Structure
**Location**: `frontend/src/components/`

#### Component Organization
```
components/
├── 📂 features/               # Feature-based components
│   ├── 📂 dashboard/          # Dashboard components
│   │   ├── AdminDashboard.js
│   │   ├── EmployeeDashboard.js
│   │   └── ManagerDashboard.js
│   ├── 📂 employees/          # Employee management
│   │   ├── EmployeeList.js
│   │   ├── EmployeeForm.js
│   │   ├── EmployeeProfile.js
│   │   └── EmployeeEdit.js
│   ├── 📂 leave/              # Leave management
│   │   ├── LeaveManagement.js
│   │   ├── EmployeeLeaveRequests.js
│   │   └── LeaveBalance.js
│   ├── 📂 timesheet/          # Timesheet management
│   │   ├── TimesheetManagement.js
│   │   ├── TimesheetEntry.js
│   │   ├── WeeklyTimesheet.js
│   │   └── TimesheetManager.js
│   ├── 📂 payroll/            # Payroll components
│   │   ├── PayrollManagement.js
│   │   └── EmployeePayslips.js
│   └── 📂 admin/              # Admin components
│       ├── UserManagement.js
│       ├── SystemSettings.js
│       └── ReportsModule.js
├── 📂 layout/                 # Layout components
│   └── Layout.js
├── 📂 common/                 # Reusable components
│   ├── Login.js
│   ├── ProtectedRoute.js
│   └── ErrorBoundary.js
└── 📂 manager/                # Manager-specific components
```

#### State Management
**React Context Architecture**:
- **`AuthContext`**: User authentication and session management
- **`LoadingContext`**: Global loading state management
- **`NotificationContext`**: Toast notifications and user feedback

#### Routing & Navigation
**React Router Configuration**:
- **Protected Routes**: Role-based route protection
- **Lazy Loading**: Code splitting for performance optimization
- **Dynamic Navigation**: Role-based menu rendering

#### UI Framework
- **Material-UI (MUI) 5.15.0**: Complete UI component library
- **Responsive Design**: Mobile-first approach
- **Custom Theming**: Branded color schemes and typography
- **Icons**: Material-UI icons integration

---

## 🗄️ Database Schema & Models

### Core Database Models

#### User Model
```javascript
// Authentication and user accounts
{
  id: UUID (Primary Key),
  email: String (Unique),
  password: String (Hashed),
  role: ENUM('admin', 'hr', 'manager', 'employee'),
  isActive: Boolean,
  lastLoginAt: DateTime,
  passwordChangedAt: DateTime
}
```

#### Employee Model
```javascript
// Complete employee information
{
  id: UUID (Primary Key),
  employeeId: String (Unique),
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  dateOfBirth: Date,
  gender: ENUM('Male', 'Female', 'Other'),
  address: String,
  city: String,
  state: String,
  pinCode: String,
  nationality: String,
  maritalStatus: ENUM('Single', 'Married', 'Divorced', 'Widowed'),
  
  // Employment details
  hireDate: Date,
  employmentType: ENUM('Full-time', 'Part-time', 'Contract', 'Intern'),
  status: ENUM('Active', 'Inactive', 'On Leave', 'Terminated'),
  workLocation: String,
  joiningDate: Date,
  confirmationDate: Date,
  resignationDate: Date,
  lastWorkingDate: Date,
  
  // Financial details
  bankName: String,
  bankAccountNumber: String,
  ifscCode: String,
  bankBranch: String,
  accountHolderName: String,
  
  // Relationships
  userId: UUID (Foreign Key -> Users),
  departmentId: UUID (Foreign Key -> Departments),
  positionId: UUID (Foreign Key -> Positions),
  managerId: UUID (Foreign Key -> Employees)
}
```

#### Project & Task Models
```javascript
// Project Model
{
  id: UUID (Primary Key),
  name: String,
  description: Text,
  startDate: Date,
  endDate: Date,
  status: ENUM('Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'),
  clientName: String,
  managerId: UUID (Foreign Key -> Employees),
  isActive: Boolean
}

// Task Model
{
  id: UUID (Primary Key),
  name: String,
  description: Text,
  estimatedHours: Decimal(5,2),
  actualHours: Decimal(5,2),
  status: ENUM('Not Started', 'In Progress', 'Completed', 'On Hold'),
  priority: ENUM('Low', 'Medium', 'High', 'Critical'),
  availableToAll: Boolean,
  projectId: UUID (Foreign Key -> Projects),
  assignedTo: UUID (Foreign Key -> Employees),
  isActive: Boolean
}
```

#### Timesheet Model
```javascript
// Weekly timesheet tracking
{
  id: UUID (Primary Key),
  employeeId: UUID (Foreign Key -> Employees),
  projectId: UUID (Foreign Key -> Projects),
  taskId: UUID (Foreign Key -> Tasks),
  weekStartDate: Date (Must be Monday),
  mondayHours: Decimal(4,2),
  tuesdayHours: Decimal(4,2),
  wednesdayHours: Decimal(4,2),
  thursdayHours: Decimal(4,2),
  fridayHours: Decimal(4,2),
  saturdayHours: Decimal(4,2),
  sundayHours: Decimal(4,2),
  totalHours: Decimal(5,2),
  description: Text,
  status: ENUM('Draft', 'Submitted', 'Approved', 'Rejected'),
  approvedBy: UUID (Foreign Key -> Employees),
  approvedAt: DateTime,
  approverComments: Text
}
```

### Database Constraints
```sql
-- Foreign Key Constraints with Cascade Rules
tasks_projectId_fkey: 
  FOREIGN KEY ("projectId") REFERENCES projects(id) 
  ON UPDATE CASCADE ON DELETE SET NULL

tasks_assignedTo_fkey: 
  FOREIGN KEY ("assignedTo") REFERENCES employees(id) 
  ON UPDATE CASCADE ON DELETE SET NULL

timesheets_taskId_fkey: 
  FOREIGN KEY ("taskId") REFERENCES tasks(id) 
  ON UPDATE CASCADE
```

---

## 🔌 API Endpoints

### Authentication Endpoints
```http
POST   /api/auth/login              # User login
GET    /api/auth/profile            # Get current user profile
GET    /api/auth/me                 # Alias for profile
PUT    /api/auth/change-password    # Change user password
POST   /api/auth/register           # Register new user (Admin/HR only)
PUT    /api/auth/users/:id/reset    # Reset user password (Admin/HR only)
PUT    /api/auth/users/:id/role     # Change user role (Admin only)
PUT    /api/auth/users/:id/status   # Change user status (Admin/HR only)
```

### Employee Management
```http
GET    /api/employees               # List all employees
GET    /api/employees/:id           # Get employee by ID
POST   /api/employees               # Create new employee
PUT    /api/employees/:id           # Update employee
DELETE /api/employees/:id           # Delete employee
GET    /api/employees/:id/manager   # Get employee's manager
PUT    /api/employees/:id/manager   # Update employee's manager
```

### Timesheet Management
```http
GET    /api/timesheets              # List timesheets (filtered by role)
GET    /api/timesheets/:id          # Get specific timesheet
POST   /api/timesheets              # Create new timesheet
PUT    /api/timesheets/:id          # Update timesheet
DELETE /api/timesheets/:id          # Delete timesheet
PUT    /api/timesheets/:id/approve  # Approve timesheet (Manager+)
PUT    /api/timesheets/:id/reject   # Reject timesheet (Manager+)
GET    /api/timesheets/employee/:id # Get employee's timesheets
```

### Leave Management
```http
GET    /api/leave                   # List leave requests
GET    /api/leave/:id               # Get specific leave request
POST   /api/leave                   # Create leave request
PUT    /api/leave/:id               # Update leave request
DELETE /api/leave/:id               # Delete leave request
PUT    /api/leave/:id/approve       # Approve leave request (Manager+)
PUT    /api/leave/:id/reject        # Reject leave request (Manager+)
GET    /api/leave/balance/:empId    # Get leave balance
```

### Project & Task Management
```http
GET    /api/projects                # List all projects
GET    /api/projects/:id            # Get project with tasks
POST   /api/projects                # Create new project
PUT    /api/projects/:id            # Update project
DELETE /api/projects/:id            # Delete project

GET    /api/tasks                   # List all tasks
GET    /api/tasks/:id               # Get specific task
POST   /api/tasks                   # Create new task
PUT    /api/tasks/:id               # Update task
DELETE /api/tasks/:id               # Delete task
```

### Dashboard & Reporting
```http
GET    /api/dashboard/stats         # General dashboard statistics
GET    /api/dashboard/admin-stats   # Admin dashboard (Admin/HR only)
GET    /api/dashboard/employee-stats # Employee-specific stats
```

---

## 🔐 Authentication & Authorization

### Authentication System
**JWT-Based Authentication**:
- **Access Tokens**: Short-lived JWT tokens (configurable expiry)
- **Token Storage**: LocalStorage for web application
- **Token Validation**: Middleware validates all protected routes
- **Automatic Refresh**: Token refresh mechanism implemented

### Authorization Middleware
**Role-Based Access Control**:
```javascript
// Middleware functions
authenticateToken()     // Validates JWT token
authorize(...roles)     // Checks user role permissions
isAdminOrHR()          // Admin or HR access only
isManagerOrAbove()     // Manager, HR, or Admin access
canAccessEmployee()    // Own data or manager's subordinates
```

### Role Permissions
```javascript
// Permission Matrix
{
  admin: {
    employees: ['create', 'read', 'update', 'delete'],
    projects: ['create', 'read', 'update', 'delete'],
    timesheets: ['read', 'approve', 'reject'],
    leave: ['read', 'approve', 'reject'],
    payroll: ['create', 'read', 'update', 'delete'],
    settings: ['read', 'update']
  },
  hr: {
    employees: ['create', 'read', 'update', 'delete'],
    projects: ['read'],
    timesheets: ['read'],
    leave: ['read', 'approve', 'reject'],
    payroll: ['create', 'read', 'update'],
    settings: ['read']
  },
  manager: {
    employees: ['read', 'update'], // Own team only
    projects: ['read', 'update'], // Assigned projects only
    timesheets: ['read', 'approve', 'reject'], // Team timesheets
    leave: ['approve', 'reject'], // Team leave requests
    payroll: ['read'] // Team payroll only
  },
  employee: {
    employees: ['read'], // Own profile only
    projects: ['read'], // Assigned projects only
    timesheets: ['create', 'read', 'update'], // Own timesheets
    leave: ['create', 'read', 'update'], // Own leave requests
    payroll: ['read'] // Own payslips only
  }
}
```

### Input Validation
**Joi Schema Validation**:
- **Comprehensive Schemas**: All endpoints have validation schemas
- **Error Handling**: Detailed validation error messages
- **Security**: Input sanitization and validation
- **Business Rules**: Custom validation rules for business logic

---

## 🔄 Business Logic & Workflows

### Employee Management Workflow
1. **Employee Creation**:
   - HR/Admin creates employee record
   - System generates unique employee ID
   - User account created with initial password
   - Department and position assignment
   - Manager assignment (optional)

2. **Employee Updates**:
   - Profile information updates
   - Role changes (Admin only)
   - Department/position transfers
   - Manager reassignments

### Timesheet Workflow
1. **Weekly Timesheet Entry**:
   - Employee selects project and task
   - Enters hours for each day (Monday-Sunday)
   - Adds description of work performed
   - Submits for approval

2. **Approval Process**:
   - Manager reviews submitted timesheets
   - Can approve or reject with comments
   - Approved timesheets locked for editing
   - Integration with payroll calculations

### Leave Management Workflow
1. **Leave Request**:
   - Employee submits leave request
   - System checks available leave balance
   - Request routed to direct manager
   - Email notifications sent

2. **Approval Process**:
   - Manager reviews request
   - Can approve, reject, or request modifications
   - Approved leaves deducted from balance
   - Calendar integration updates

### Project & Task Management
1. **Project Creation**:
   - Admin/HR creates new project
   - Assigns project manager
   - Sets project timeline and budget
   - Creates initial task structure

2. **Task Assignment**:
   - Tasks assigned to specific employees
   - Tasks can be marked as "available to all"
   - Time tracking integration
   - Progress monitoring

---

## 🛠️ Technology Stack

### Backend Technologies
```json
{
  "runtime": "Node.js 18+",
  "framework": "Express.js 4.x",
  "database": "PostgreSQL 13+",
  "orm": "Sequelize 6.x",
  "authentication": "JWT (jsonwebtoken 9.0.2)",
  "validation": "Joi 17.x",
  "security": "bcryptjs 3.0.2",
  "documentation": "Swagger/OpenAPI 3.0",
  "fileUpload": "Multer",
  "cors": "CORS middleware",
  "environment": "dotenv"
}
```

### Frontend Technologies
```json
{
  "framework": "React 18.3.1",
  "router": "React Router 6.25.1",
  "ui": "Material-UI (MUI) 5.15.0",
  "http": "Axios 1.11.0",
  "forms": "React Hook Form 7.48.0",
  "notifications": "Notistack 3.0.0",
  "charts": "Recharts 2.8.0",
  "dates": "Day.js 1.11.13 + Date-fns 4.1.0",
  "state": "React Context + Hooks",
  "testing": "React Testing Library",
  "bundler": "Create React App (Webpack)"
}
```

### Development Tools
```json
{
  "processManager": "PM2 (ecosystem.config.js)",
  "containerization": "Docker Compose",
  "concurrency": "Concurrently (dev environment)",
  "linting": "ESLint",
  "security": "npm audit",
  "testing": "Jest + React Testing Library",
  "apiTesting": "Custom validation scripts"
}
```

---

## 🔧 Development Environment

### Environment Setup
```bash
# Root level setup
npm install                    # Install root dependencies
npm run dev                    # Start both backend and frontend

# Backend setup
cd backend
npm install                    # Install backend dependencies
npm run dev                    # Start backend development server

# Frontend setup
cd frontend
npm install                    # Install frontend dependencies
npm start                      # Start React development server
```

### Environment Variables
```env
# Backend (.env)
NODE_ENV=development
PORT=8080
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skyraksys_hrm
DB_USER=hrm_admin
DB_PASSWORD=hrm_secure_2024
JWT_SECRET=your_jwt_secret_key_here
DB_SSL=false

# Frontend (package.json proxy)
"proxy": "http://localhost:8080"
```

### Database Setup
```bash
# PostgreSQL setup required
# 1. Install PostgreSQL
# 2. Create database: skyraksys_hrm
# 3. Create user: hrm_admin
# 4. Run migrations (auto-sync enabled in dev)
```

---

## 🚀 Deployment & Configuration

### Production Configuration
**PM2 Ecosystem Configuration**:
```javascript
// ecosystem.config.js
{
  apps: [{
    name: 'skyraksys-hrm-backend',
    script: 'backend/server.js',
    instances: 2,
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 8080
    },
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
}
```

### Docker Configuration
```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./backend
    ports: ["8080:8080"]
    environment:
      - NODE_ENV=production
    depends_on: [postgres]
  
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    depends_on: [backend]
  
  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: skyraksys_hrm
      POSTGRES_USER: hrm_admin
    volumes: ["postgres_data:/var/lib/postgresql/data"]
```

### Health Monitoring
- **Health Check Endpoint**: `/api/health`
- **Database Connection Monitoring**: Automatic reconnection
- **Error Logging**: Structured logging with timestamps
- **Performance Monitoring**: Memory and CPU usage tracking

---

## 🧪 Testing Framework

### Backend Testing
- **Unit Tests**: Model and utility function testing
- **Integration Tests**: API endpoint testing
- **Authentication Tests**: JWT and role-based access testing
- **Database Tests**: Model relationships and constraints

### Frontend Testing
- **Component Tests**: React component testing
- **Context Tests**: State management testing
- **Integration Tests**: API integration testing
- **E2E Tests**: Complete user workflow testing

### Test Scripts
```bash
# Run all tests
npm test

# Backend tests only
npm run test:backend

# Frontend tests only
npm run test:frontend

# Test coverage
npm run test:coverage
```

---

## 📊 Default System Data

### Default Users
```javascript
// System comes with default users for testing
{
  admin: {
    email: 'admin@company.com',
    password: 'Kx9mP7qR2nF8sA5t',
    role: 'admin'
  },
  hr: {
    email: 'hr@company.com', 
    password: 'Lw3nQ6xY8mD4vB7h',
    role: 'hr'
  },
  employee: {
    email: 'employee@company.com',
    password: 'Mv4pS9wE2nR6kA8j', 
    role: 'employee'
  }
}
```

### Sample Projects & Tasks
- **Website Development Project**: Backend, Frontend, Database tasks
- **Mobile App Project**: iOS, Android, UI/UX tasks  
- **Data Analytics Project**: Pipeline and Dashboard tasks

---

## 🔗 API Documentation

### Swagger Documentation
- **URL**: `http://localhost:8080/api-docs`
- **Interactive API Testing**: Built-in Swagger UI
- **Schema Definitions**: Complete request/response schemas
- **Authentication**: Bearer token integration

### API Response Format
```javascript
// Success Response
{
  success: true,
  message: "Operation successful",
  data: { /* response data */ }
}

// Error Response  
{
  success: false,
  message: "Error description",
  error: "Detailed error information",
  validationErrors: [ /* validation details */ ]
}
```

---

## 🎯 Key Implementation Highlights

### Security Features
- ✅ JWT-based authentication with role-based authorization
- ✅ Password hashing with bcrypt (12 rounds)
- ✅ Input validation with Joi schemas
- ✅ CORS configuration for cross-origin requests
- ✅ SQL injection prevention with Sequelize ORM
- ✅ Rate limiting and security headers

### Performance Optimizations
- ✅ Database connection pooling
- ✅ Lazy loading for React components
- ✅ Efficient database queries with eager loading
- ✅ Frontend code splitting
- ✅ API response caching strategies

### Data Integrity
- ✅ Foreign key constraints with CASCADE rules
- ✅ Database transaction support
- ✅ Input validation at multiple layers
- ✅ Audit trails for critical operations
- ✅ Soft delete capabilities where appropriate

### User Experience
- ✅ Responsive design for all screen sizes
- ✅ Real-time notifications and feedback
- ✅ Intuitive navigation and role-based menus
- ✅ Error handling with user-friendly messages
- ✅ Loading states and progress indicators

---

## 📞 Support & Maintenance

### Documentation Locations
- **API Documentation**: `/api-docs` (Swagger UI)
- **Developer Guide**: `docs/COMPLETE_DEVELOPER_GUIDE.md`
- **Architecture Analysis**: `PROJECT_STRUCTURE_ANALYSIS.md`
- **Database Schema**: `PROJECT_TASK_RELATIONSHIP_ANALYSIS.md`

### Development Guidelines
- **Code Style**: ESLint configuration with React standards
- **Git Workflow**: Feature branch development with pull requests
- **Testing**: Comprehensive test coverage required
- **Documentation**: JSDoc comments for complex functions

### Monitoring & Logging
- **Application Logs**: Structured logging with timestamps
- **Error Tracking**: Comprehensive error logging
- **Performance Metrics**: Memory and response time monitoring
- **Database Monitoring**: Connection pool and query performance

---

*Last Updated: September 21, 2025*
*Version: 2.0.0*
*Documentation maintained by: SkyRakSys Development Team*