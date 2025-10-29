# 🏗️ Technical Architecture Guide

**Version**: 2.0.0  
**Last Updated**: October 27, 2025

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Pattern](#architecture-pattern)
3. [Technology Stack](#technology-stack)
4. [Component Architecture](#component-architecture)
5. [Data Flow](#data-flow)
6. [Security Architecture](#security-architecture)
7. [Scalability & Performance](#scalability--performance)
8. [Integration Points](#integration-points)

---

## 🎯 System Overview

SkyrakSys HRM follows a **3-tier architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                    │
│              React 18.3 + Material-UI (MUI)             │
│          Browser (Chrome, Firefox, Safari, Edge)         │
└──────────────────┬──────────────────────────────────────┘
                   │ REST API (HTTPS)
┌──────────────────▼──────────────────────────────────────┐
│                   APPLICATION LAYER                      │
│              Node.js 18+ + Express.js 4.18              │
│        JWT Auth │ Business Logic │ Validation           │
└──────────────────┬──────────────────────────────────────┘
                   │ Sequelize ORM
┌──────────────────▼──────────────────────────────────────┐
│                      DATA LAYER                          │
│                 PostgreSQL 15+ Database                  │
│           Relationships │ Indexes │ Constraints          │
└─────────────────────────────────────────────────────────┘
```

---

## 🏛️ Architecture Pattern

### MVC (Model-View-Controller) with REST API

#### Backend (Node.js + Express)

```
backend/
├── models/              # Data models (Sequelize ORM)
│   ├── user.model.js
│   ├── employee.model.js
│   ├── timesheet.model.js
│   └── ...
├── controllers/         # Business logic layer
│   └── settings.controller.js
├── routes/              # API endpoint definitions
│   ├── auth.routes.js
│   ├── employee.routes.js
│   ├── timesheet.routes.js
│   └── ...
├── middleware/          # Request processing
│   ├── auth.simple.js           # Authentication
│   ├── validation.js            # Input validation
│   ├── errorHandler.js          # Error handling
│   └── requestLogger.js         # Logging
├── services/            # External services & utilities
│   ├── email.service.js
│   └── database.service.js
├── config/              # Configuration files
│   ├── database.js
│   ├── auth.config.js
│   └── swagger.js
├── utils/               # Helper functions
│   ├── logHelper.js
│   └── demoSeed.js
└── server.js            # Application entry point
```

#### Frontend (React)

```
frontend/src/
├── components/          # Reusable UI components
│   ├── layout/              # Layout components
│   ├── common/              # Shared components
│   ├── employees/           # Employee-specific
│   ├── admin/               # Admin features
│   └── ...
├── pages/               # Page-level components
│   ├── Projects/
│   └── Tasks/
├── services/            # API communication layer
│   ├── auth.service.js
│   ├── employee.service.js
│   └── http-common.js       # Axios configuration
├── contexts/            # React Context for state
│   └── AuthContext.js
├── hooks/               # Custom React hooks
├── utils/               # Frontend utilities
├── theme/               # MUI theme configuration
└── App.js               # Main application component
```

---

## 🔧 Technology Stack

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | Runtime environment |
| **Express.js** | 4.18.2 | Web application framework |
| **PostgreSQL** | 15+ | Relational database |
| **Sequelize** | 6.35.0 | ORM (Object-Relational Mapping) |
| **JWT** | 9.0.2 | Authentication tokens |
| **bcryptjs** | 2.4.3 | Password hashing |
| **Joi** | 17.11.0 | Input validation |
| **Winston** | 3.11.0 | Logging framework |
| **Helmet** | 7.1.0 | Security headers |
| **CORS** | 2.8.5 | Cross-origin resource sharing |
| **Multer** | 1.4.5 | File uploads |
| **PDFKit** | 0.17.1 | PDF generation |
| **ExcelJS** | 4.4.0 | Excel file generation |
| **Nodemailer** | 7.0.10 | Email service |
| **Swagger** | 6.2.8 | API documentation |

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.1 | UI library |
| **Material-UI (MUI)** | 5.15.0 | Component library |
| **React Router** | 6.25.1 | Client-side routing |
| **Axios** | 1.11.0 | HTTP client |
| **Day.js** | 1.11.13 | Date manipulation |
| **Recharts** | 2.8.0 | Data visualization |
| **Notistack** | 3.0.0 | Notification system |
| **React Hook Form** | 7.48.0 | Form management |

### Testing & Development

| Technology | Version | Purpose |
|------------|---------|---------|
| **Playwright** | Latest | E2E testing |
| **Jest** | 29.7.0 | Unit testing |
| **Nodemon** | 3.0.1 | Development auto-reload |

### Deployment & Infrastructure

| Technology | Purpose |
|------------|---------|
| **PM2** | Process manager |
| **Nginx** | Reverse proxy & load balancer |
| **Docker** | Containerization |
| **RHEL 9.6** | Production server OS |

---

## 🧩 Component Architecture

### Backend Components

#### 1. **Authentication Layer**
```javascript
// middleware/auth.simple.js
- generateAccessToken()      // Creates JWT
- authenticateToken()         // Validates JWT
- authorize(...roles)         // Role-based access control
```

**Flow**:
```
Login → Validate Credentials → Generate JWT → Store in LocalStorage
↓
Protected Route Request → Extract Token → Verify Token → Attach User to Request
```

#### 2. **Data Models (Sequelize ORM)**

**Core Models**:
- `User` - Authentication & authorization
- `Employee` - Employee master data
- `Department` - Organizational structure
- `Position` - Job positions & salary structures
- `Project` - Project management
- `Task` - Task tracking
- `Timesheet` - Weekly time tracking
- `LeaveRequest` - Leave applications
- `LeaveBalance` - Leave balance tracking
- `LeaveType` - Leave type definitions
- `Payroll` - Payroll processing
- `PayslipTemplate` - Payslip configurations
- `SalaryStructure` - Salary components

**Model Relationships**:
```javascript
// One-to-One
Employee ←→ User (authentication)

// One-to-Many
Employee → LeaveRequest (employee can have multiple leaves)
Employee → Timesheet (employee submits multiple timesheets)
Employee → Payroll (employee has multiple pay periods)
Department → Employee (department has multiple employees)
Project → Task (project has multiple tasks)

// Many-to-One
Timesheet → Project (timesheet belongs to project)
Timesheet → Task (timesheet belongs to task)
LeaveRequest → Employee (leave request by employee)

// Self-Referencing
Employee → Employee (manager relationship)
```

#### 3. **API Routes**

**Route Organization**:
```javascript
// Format: /api/{resource}/{action}

// Authentication
POST   /api/auth/login
GET    /api/auth/profile
PUT    /api/auth/change-password

// Employees
GET    /api/employees
GET    /api/employees/:id
POST   /api/employees
PUT    /api/employees/:id
DELETE /api/employees/:id

// Timesheets
GET    /api/timesheets
POST   /api/timesheets
PUT    /api/timesheets/:id
PUT    /api/timesheets/:id/submit
PUT    /api/timesheets/:id/status

// Leaves
GET    /api/leave
POST   /api/leave
PUT    /api/leave/:id/status

// Payroll
GET    /api/payrolls
POST   /api/payrolls/generate
GET    /api/payslips/:id
```

#### 4. **Middleware Stack**

**Request Processing Pipeline**:
```
Incoming Request
    ↓
[1] CORS middleware          (Allow cross-origin requests)
    ↓
[2] Helmet                   (Security headers)
    ↓
[3] Rate Limiting            (DDoS protection)
    ↓
[4] Body Parser              (JSON/URL encoded)
    ↓
[5] Request Logger           (Winston logging)
    ↓
[6] Authentication           (JWT validation)
    ↓
[7] Authorization            (Role checking)
    ↓
[8] Validation               (Joi schemas)
    ↓
Route Handler (Business Logic)
    ↓
[9] Error Handler            (Centralized error handling)
    ↓
Response
```

#### 5. **Error Handling**

**Centralized Error Handling**:
```javascript
// middleware/errorHandler.js
app.use((error, req, res, next) => {
  // Log error
  logger.error(error);
  
  // Handle different error types
  - SequelizeValidationError → 400
  - SequelizeUniqueConstraintError → 409
  - JWT TokenExpiredError → 401
  - JWT JsonWebTokenError → 403
  - Default → 500
});
```

**Standard Error Response**:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### Frontend Components

#### 1. **Component Hierarchy**

```
App.js (Root)
├── AuthContext.Provider (Authentication state)
├── Router
│   ├── Layout (Navigation + Sidebar)
│   │   ├── Header
│   │   ├── Sidebar
│   │   └── Main Content Area
│   │       ├── Dashboard
│   │       ├── Employees Module
│   │       │   ├── EmployeesList
│   │       │   ├── AddEmployee
│   │       │   └── EditEmployee
│   │       ├── Timesheets Module
│   │       ├── Leaves Module
│   │       ├── Payroll Module
│   │       └── Admin Module
│   └── Login (Public route)
```

#### 2. **State Management**

**Context API Pattern**:
```javascript
// contexts/AuthContext.js
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const login = async (credentials) => { /* ... */ };
  const logout = () => { /* ... */ };
  
  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Usage in components
const { user, isAuthenticated } = useContext(AuthContext);
```

#### 3. **API Communication**

**Service Layer Pattern**:
```javascript
// services/employee.service.js
import http from './http-common';

class EmployeeService {
  getAll() {
    return http.get('/employees');
  }
  
  get(id) {
    return http.get(`/employees/${id}`);
  }
  
  create(data) {
    return http.post('/employees', data);
  }
  
  update(id, data) {
    return http.put(`/employees/${id}`, data);
  }
}

export default new EmployeeService();
```

**HTTP Common (Axios Instance)**:
```javascript
// services/http-common.js
import axios from 'axios';

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor (add auth token)
instance.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor (handle errors)
instance.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default instance;
```

---

## 🔄 Data Flow

### Complete Request-Response Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     1. USER INTERACTION                          │
│  User clicks "Submit Timesheet" button in React component      │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    2. FRONTEND PROCESSING                        │
│  - Form validation (React Hook Form)                            │
│  - Call service: timesheetService.submit(data)                  │
│  - Add Authorization header with JWT token                      │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP Request
┌────────────────────────────▼────────────────────────────────────┐
│                   3. SERVER RECEIVES REQUEST                     │
│  - Express server receives POST /api/timesheets/:id/submit      │
│  - CORS middleware validates origin                             │
│  - Helmet adds security headers                                 │
│  - Rate limiter checks request frequency                        │
│  - Body parser processes JSON payload                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    4. AUTHENTICATION                             │
│  - authenticateToken() middleware extracts JWT                  │
│  - Verifies token signature                                     │
│  - Decodes user info: { id, email, role, employeeId }          │
│  - Attaches user to req.user                                    │
│  - Logs authentication event                                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                     5. AUTHORIZATION                             │
│  - authorize() middleware checks user role                      │
│  - Verifies user has permission for action                      │
│  - Logs authorization event                                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      6. VALIDATION                               │
│  - Joi schema validates request body                            │
│  - Checks required fields                                       │
│  - Validates data types and formats                             │
│  - Returns 400 if validation fails                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                   7. BUSINESS LOGIC (Route Handler)              │
│  - Fetch timesheet from database                                │
│  - Verify ownership (employeeId matches)                        │
│  - Check current status (must be Draft)                         │
│  - Calculate total hours                                        │
│  - Update status to "Submitted"                                 │
│  - Set submittedAt timestamp                                    │
│  - Create audit log entry                                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    8. DATABASE OPERATIONS                        │
│  - Sequelize ORM translates to SQL:                             │
│    UPDATE timesheets                                            │
│    SET status = 'Submitted',                                    │
│        submittedAt = NOW()                                      │
│    WHERE id = ? AND employeeId = ?                              │
│  - PostgreSQL executes query                                    │
│  - Returns updated record                                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    9. RESPONSE PREPARATION                       │
│  - Format success response:                                     │
│    {                                                            │
│      "success": true,                                           │
│      "message": "Timesheet submitted successfully",             │
│      "data": { timesheetObject }                                │
│    }                                                            │
│  - Log response                                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                   10. FRONTEND RECEIVES RESPONSE                 │
│  - Axios receives HTTP 200 response                             │
│  - Service returns promise with data                            │
│  - Component updates state                                      │
│  - Show success notification (Notistack)                        │
│  - Redirect or refresh list                                     │
└─────────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
┌─────────────┐
│ User Login  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│ POST /api/auth/login    │
│ { email, password }     │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Backend validates credentials   │
│ - Find user by email            │
│ - Compare password hash         │
└──────┬──────────────────────────┘
       │
       ▼ (Success)
┌─────────────────────────────────┐
│ Generate JWT Access Token       │
│ {                               │
│   id: user.id,                  │
│   email: user.email,            │
│   role: user.role,              │
│   employeeId: user.employee.id  │
│ }                               │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Return tokens to frontend       │
│ {                               │
│   accessToken: "jwt...",        │
│   user: { id, email, role }     │
│ }                               │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Frontend stores in LocalStorage │
│ - accessToken                   │
│ - user data                     │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ All subsequent API requests     │
│ include Authorization header:   │
│ Bearer {accessToken}            │
└─────────────────────────────────┘
```

---

## 🔒 Security Architecture

### 1. **Authentication Security**

**JWT Token Management**:
- **Algorithm**: HS256 (HMAC with SHA-256)
- **Expiration**: 1 hour (configurable)
- **Secret**: 256-bit random key (environment variable)
- **Storage**: LocalStorage (consider HttpOnly cookies for production)

**Password Security**:
- **Hashing**: bcryptjs with 12 salt rounds
- **Minimum Length**: 8 characters
- **No plain-text storage**: Passwords never stored in plain text

### 2. **Authorization Security**

**Role-Based Access Control (RBAC)**:
```javascript
const permissions = {
  admin: ['*'],  // Full access
  hr: [
    'employees.read',
    'employees.write',
    'leaves.approve',
    'payroll.process',
    'reports.view'
  ],
  manager: [
    'team.read',
    'timesheets.approve',
    'leaves.approve',
    'projects.manage'
  ],
  employee: [
    'profile.read',
    'profile.write',
    'timesheets.create',
    'leaves.request'
  ]
};
```

### 3. **API Security**

**Security Headers (Helmet)**:
```javascript
- Content-Security-Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security
```

**Rate Limiting**:
```javascript
// General API: 300 requests per 15 minutes
// Auth endpoints: 20 requests per 15 minutes
```

**CORS Configuration**:
```javascript
allowedOrigins = [
  'http://localhost:3000',     // Development
  'https://yourdomain.com'     // Production
]
```

### 4. **Input Validation**

**Joi Schema Validation**:
```javascript
const employeeSchema = Joi.object({
  email: Joi.string().email().required(),
  firstName: Joi.string().min(2).max(50).required(),
  phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
  salary: Joi.number().positive().optional()
});
```

**SQL Injection Protection**:
- Sequelize ORM parameterized queries
- No raw SQL queries without sanitization

### 5. **Audit Logging**

**Logged Events**:
- Authentication attempts (success/failure)
- Authorization failures
- Data modifications (create/update/delete)
- Sensitive operations (payroll processing, approvals)

**Log Format**:
```json
{
  "timestamp": "2025-10-27T10:30:00.000Z",
  "level": "info",
  "event": "timesheet_submitted",
  "userId": "uuid",
  "email": "user@example.com",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "resource": "/api/timesheets/123",
  "action": "PUT",
  "success": true
}
```

---

## ⚡ Scalability & Performance

### Database Optimization

**Indexes**:
```sql
-- User table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Employee table
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_manager ON employees(manager_id);
CREATE INDEX idx_employees_status ON employees(status);

-- Timesheet table
CREATE INDEX idx_timesheets_employee ON timesheets(employee_id);
CREATE INDEX idx_timesheets_project ON timesheets(project_id);
CREATE INDEX idx_timesheets_status ON timesheets(status);
CREATE INDEX idx_timesheets_week ON timesheets(week_start_date);

-- Composite indexes
CREATE INDEX idx_timesheets_employee_week ON timesheets(employee_id, week_start_date);
```

**Connection Pooling**:
```javascript
pool: {
  max: 5,          // Maximum connections
  min: 0,          // Minimum connections
  acquire: 60000,  // Maximum time (ms) to acquire connection
  idle: 10000      // Maximum time (ms) connection can be idle
}
```

### Application Performance

**Process Management (PM2)**:
```javascript
module.exports = {
  apps: [{
    name: 'hrm-backend',
    script: './server.js',
    instances: 'max',     // Use all CPU cores
    exec_mode: 'cluster', // Cluster mode for load balancing
    max_memory_restart: '1G'
  }]
};
```

**Caching Strategy**:
- Static assets cached at Nginx level
- API responses: Consider Redis for frequent queries
- Frontend: React memo for expensive components

### Load Balancing

**Nginx Configuration**:
```nginx
upstream hrm_backend {
    least_conn;
    server 127.0.0.1:5000;
    server 127.0.0.1:5001;
    server 127.0.0.1:5002;
}

server {
    location /api {
        proxy_pass http://hrm_backend;
    }
}
```

---

## 🔌 Integration Points

### Email Service Integration

**Provider**: Nodemailer with SMTP
**Usage**:
- Welcome emails for new employees
- Leave request notifications
- Timesheet approval notifications
- Payslip distribution
- Password reset emails

### File Upload Integration

**Provider**: Multer middleware
**Storage**: Local file system (`uploads/` directory)
**File Types**:
- Employee documents (PDF, DOCX)
- Profile photos (JPG, PNG)
- Payslip attachments

### PDF Generation

**Provider**: PDFKit
**Usage**:
- Payslip PDFs
- Employee reports
- Leave balance statements

### Excel Export

**Provider**: ExcelJS
**Usage**:
- Employee data export
- Attendance reports
- Payroll summaries

---

## 📊 Monitoring & Logging

### Application Logs

**Winston Configuration**:
```javascript
logger.info('Informational message');
logger.warn('Warning message');
logger.error('Error message');
```

**Log Locations**:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- `logs/access.log` - HTTP access logs

### Health Monitoring

**Health Check Endpoint**:
```
GET /api/health
```

**Response**:
```json
{
  "status": "OK",
  "timestamp": "2025-10-27T10:30:00.000Z",
  "environment": "production",
  "database": "PostgreSQL",
  "dbHost": "localhost",
  "dbPort": "5432"
}
```

---

## 🚀 Deployment Architecture

### Production Stack

```
┌──────────────────────────────────────┐
│          Internet / Users             │
└─────────────┬────────────────────────┘
              │ HTTPS (443)
┌─────────────▼────────────────────────┐
│        Nginx (Reverse Proxy)         │
│  - SSL termination                   │
│  - Load balancing                    │
│  - Static file serving               │
│  - Rate limiting                     │
└─────────────┬────────────────────────┘
              │ HTTP (5000-5002)
┌─────────────▼────────────────────────┐
│   PM2 Process Manager (Cluster)      │
│  ┌────────┬────────┬────────┐       │
│  │ Node.js│ Node.js│ Node.js│       │
│  │ :5000  │ :5001  │ :5002  │       │
│  └────────┴────────┴────────┘       │
└─────────────┬────────────────────────┘
              │ PostgreSQL Protocol (5432)
┌─────────────▼────────────────────────┐
│     PostgreSQL 15 Database           │
│  - Connection pooling                │
│  - Backup & replication              │
└──────────────────────────────────────┘
```

### Containerization (Docker)

**docker-compose.yml**:
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    depends_on:
      - postgres
  
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

## 📚 References

- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [React Best Practices](https://react.dev/learn)
- [PostgreSQL Performance Tips](https://www.postgresql.org/docs/current/performance-tips.html)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

**Next**: [Database Design Guide](./02-DATABASE_DESIGN.md)
