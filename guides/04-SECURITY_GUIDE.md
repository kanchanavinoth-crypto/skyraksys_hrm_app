# 🔐 Security Guide

**Version**: 2.0.0  
**Last Updated**: October 27, 2025  
**Security Level**: Production-Ready

---

## 📋 Table of Contents

1. [Security Overview](#security-overview)
2. [Authentication System](#authentication-system)
3. [Authorization & Access Control](#authorization--access-control)
4. [Data Protection](#data-protection)
5. [Security Headers](#security-headers)
6. [Input Validation](#input-validation)
7. [Rate Limiting](#rate-limiting)
8. [Audit Logging](#audit-logging)
9. [Security Best Practices](#security-best-practices)
10. [Vulnerability Management](#vulnerability-management)
11. [Incident Response](#incident-response)

---

## 🎯 Security Overview

### Security Principles

| Principle | Implementation |
|-----------|----------------|
| **Authentication** | JWT-based token authentication |
| **Authorization** | Role-Based Access Control (RBAC) |
| **Data Protection** | Encryption at rest and in transit |
| **Auditing** | Comprehensive audit logging |
| **Validation** | Server-side input validation with Joi |
| **Rate Limiting** | Request throttling per IP |

### Security Stack

```
┌─────────────────────────────────────┐
│         Client Application          │
│         (React Frontend)            │
└─────────────────┬───────────────────┘
                  │ HTTPS
                  ▼
┌─────────────────────────────────────┐
│         Nginx Reverse Proxy         │
│    (SSL/TLS, Security Headers)      │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│       Express.js Backend            │
│  ┌───────────────────────────────┐  │
│  │  Helmet (Security Headers)    │  │
│  ├───────────────────────────────┤  │
│  │  Rate Limiting Middleware     │  │
│  ├───────────────────────────────┤  │
│  │  CORS Configuration           │  │
│  ├───────────────────────────────┤  │
│  │  JWT Authentication           │  │
│  ├───────────────────────────────┤  │
│  │  Role-Based Authorization     │  │
│  ├───────────────────────────────┤  │
│  │  Input Validation (Joi)       │  │
│  ├───────────────────────────────┤  │
│  │  Audit Logging                │  │
│  └───────────────────────────────┘  │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│        PostgreSQL Database          │
│   (Encrypted, Access Controlled)    │
└─────────────────────────────────────┘
```

---

## 🔑 Authentication System

### JWT Token Architecture

**Token Generation**:
```javascript
// backend/middleware/auth.simple.js
const jwt = require('jsonwebtoken');

function generateAccessToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    employeeId: user.employeeId
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '1h',
    issuer: 'skyraksys-hrm',
    audience: 'hrm-api'
  });
}
```

**Token Structure**:
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "admin@skyraksys.com",
    "role": "admin",
    "employeeId": "550e8400-e29b-41d4-a716-446655440001",
    "iat": 1698422400,
    "exp": 1698426000,
    "iss": "skyraksys-hrm",
    "aud": "hrm-api"
  },
  "signature": "..."
}
```

### Authentication Flow

```
┌──────────┐                ┌──────────┐                ┌──────────┐
│  Client  │                │  Backend │                │ Database │
└─────┬────┘                └────┬─────┘                └────┬─────┘
      │                          │                           │
      │  POST /api/auth/login    │                           │
      │  { email, password }     │                           │
      ├─────────────────────────>│                           │
      │                          │                           │
      │                          │  SELECT user WHERE email  │
      │                          ├──────────────────────────>│
      │                          │                           │
      │                          │  User record              │
      │                          │<──────────────────────────┤
      │                          │                           │
      │                          │ bcrypt.compare(password)  │
      │                          │ (password verification)   │
      │                          │                           │
      │                          │ generateAccessToken()     │
      │                          │                           │
      │  { accessToken, user }   │                           │
      │<─────────────────────────┤                           │
      │                          │                           │
      │  Store token in          │                           │
      │  localStorage/cookie     │                           │
      │                          │                           │
      │  GET /api/employees      │                           │
      │  Authorization: Bearer   │                           │
      │  {token}                 │                           │
      ├─────────────────────────>│                           │
      │                          │                           │
      │                          │ jwt.verify(token)         │
      │                          │                           │
      │                          │  Query data               │
      │                          ├──────────────────────────>│
      │                          │                           │
      │                          │  Data                     │
      │                          │<──────────────────────────┤
      │                          │                           │
      │  Response with data      │                           │
      │<─────────────────────────┤                           │
      │                          │                           │
```

### Password Security

**Hashing Implementation**:
```javascript
const bcrypt = require('bcryptjs');

// Password hashing during user creation
const saltRounds = 10;
const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

// Password verification during login
const isValid = await bcrypt.compare(plainPassword, hashedPassword);
```

**Password Requirements**:
- Minimum 8 characters
- Must contain uppercase letter
- Must contain lowercase letter
- Must contain number
- Must contain special character
- Cannot be common password

**Password Storage**:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,  -- bcrypt hash ($2a$10$...)
  -- ... other fields
);
```

### Token Validation Middleware

```javascript
// backend/middleware/auth.simple.js
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'skyraksys-hrm',
      audience: 'hrm-api'
    });
    
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    return res.status(403).json({
      success: false,
      message: 'Invalid token'
    });
  }
}
```

---

## 🛡️ Authorization & Access Control

### Role Hierarchy

```
┌─────────────────────────────────────────┐
│              admin                       │
│  (Full system access)                   │
│  ├─ User management                     │
│  ├─ System configuration                │
│  ├─ All employee operations             │
│  └─ All reports & analytics             │
└─────────────────┬───────────────────────┘
                  │
         ┌────────┴────────┐
         │                 │
┌────────▼───────┐  ┌──────▼──────────────┐
│      hr        │  │     manager         │
│  ├─ Employees  │  │  ├─ Team members    │
│  ├─ Leaves     │  │  ├─ Timesheets      │
│  ├─ Payroll    │  │  ├─ Leave approvals │
│  └─ Reports    │  │  └─ Team reports    │
└────────────────┘  └─────────┬───────────┘
                              │
                    ┌─────────▼──────────┐
                    │     employee       │
                    │  ├─ Self profile   │
                    │  ├─ Own timesheets │
                    │  ├─ Leave requests │
                    │  └─ Own payslips   │
                    └────────────────────┘
```

### RBAC Permission Matrix

| Resource | admin | hr | manager | employee |
|----------|-------|----|---------| ---------|
| **Users** |
| Create user | ✅ | ✅ | ❌ | ❌ |
| View all users | ✅ | ✅ | ❌ | ❌ |
| View own profile | ✅ | ✅ | ✅ | ✅ |
| Update user | ✅ | ✅ | ❌ | ❌ |
| Delete user | ✅ | ❌ | ❌ | ❌ |
| Change password | ✅ | ✅ | ✅ | ✅ |
| **Employees** |
| Create employee | ✅ | ✅ | ❌ | ❌ |
| View all employees | ✅ | ✅ | ✅ (team) | ❌ |
| View own data | ✅ | ✅ | ✅ | ✅ |
| Update employee | ✅ | ✅ | ❌ | 🔸 (limited) |
| Delete employee | ✅ | ✅ | ❌ | ❌ |
| **Timesheets** |
| Create timesheet | ✅ | ✅ | ✅ | ✅ |
| View all timesheets | ✅ | ✅ | ✅ (team) | ❌ |
| View own timesheets | ✅ | ✅ | ✅ | ✅ |
| Submit timesheet | ✅ | ✅ | ✅ | ✅ |
| Approve/reject | ✅ | ✅ | ✅ (team) | ❌ |
| **Leave Requests** |
| Apply leave | ✅ | ✅ | ✅ | ✅ |
| View all leaves | ✅ | ✅ | ✅ (team) | ❌ |
| View own leaves | ✅ | ✅ | ✅ | ✅ |
| Approve/reject | ✅ | ✅ | ✅ (team) | ❌ |
| Cancel leave | ✅ | ✅ | ✅ (own) | ✅ (own) |
| **Payroll** |
| Generate payroll | ✅ | ✅ | ❌ | ❌ |
| View all payrolls | ✅ | ✅ | ❌ | ❌ |
| View own payslip | ✅ | ✅ | ✅ | ✅ |
| Approve payroll | ✅ | ✅ | ❌ | ❌ |
| **Projects & Tasks** |
| Create project | ✅ | ✅ | ✅ | ❌ |
| View projects | ✅ | ✅ | ✅ | ✅ |
| Update project | ✅ | ✅ | ✅ (assigned) | ❌ |
| Delete project | ✅ | ✅ | ❌ | ❌ |
| **Reports** |
| Employee reports | ✅ | ✅ | ✅ (team) | ❌ |
| Timesheet reports | ✅ | ✅ | ✅ (team) | ❌ |
| Leave reports | ✅ | ✅ | ✅ (team) | ❌ |
| Payroll reports | ✅ | ✅ | ❌ | ❌ |
| **System Configuration** |
| Departments | ✅ | ✅ | ❌ | ❌ |
| Positions | ✅ | ✅ | ❌ | ❌ |
| Leave types | ✅ | ✅ | ❌ | ❌ |
| Audit logs | ✅ | ❌ | ❌ | ❌ |

**Legend**: ✅ Full Access | 🔸 Limited Access | ❌ No Access

### Authorization Middleware

```javascript
// backend/middleware/auth.simple.js
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
}
```

**Usage Examples**:
```javascript
// Admin only
router.get('/users', 
  authenticateToken, 
  authorize('admin'), 
  userController.getAllUsers
);

// HR and Admin
router.post('/employees', 
  authenticateToken, 
  authorize('admin', 'hr'), 
  employeeController.createEmployee
);

// Manager and above
router.put('/timesheets/:id/approve', 
  authenticateToken, 
  authorize('admin', 'hr', 'manager'), 
  timesheetController.approveTimesheet
);

// All authenticated users
router.get('/profile', 
  authenticateToken, 
  authController.getProfile
);
```

### Resource Ownership Check

```javascript
// Example: Employee can only update their own data
async function checkEmployeeOwnership(req, res, next) {
  const requestedEmployeeId = req.params.id;
  const currentUserEmployeeId = req.user.employeeId;

  // Admins and HR can access all employees
  if (['admin', 'hr'].includes(req.user.role)) {
    return next();
  }

  // Employees can only access their own data
  if (requestedEmployeeId !== currentUserEmployeeId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own data.'
    });
  }

  next();
}

// Usage
router.get('/employees/:id', 
  authenticateToken, 
  checkEmployeeOwnership,
  employeeController.getEmployee
);
```

---

## 🔒 Data Protection

### Encryption

**Passwords**:
- Algorithm: bcrypt
- Cost factor: 10 rounds
- Salt: Automatically generated per password

**Database Connection**:
```javascript
// config/database.js
{
  dialect: 'postgres',
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
}
```

**HTTPS/TLS**:
```nginx
# Nginx configuration
server {
    listen 443 ssl http2;
    server_name hrm.skyraksys.com;

    ssl_certificate /etc/ssl/certs/hrm.crt;
    ssl_certificate_key /etc/ssl/private/hrm.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
}
```

### Sensitive Data Handling

**PII (Personally Identifiable Information)**:
- Full name
- Email address
- Phone number
- Date of birth
- Address
- PAN number
- Bank account details
- Salary information

**Protection Measures**:
1. **Access Control**: Only authorized roles can view sensitive data
2. **Audit Logging**: All access to PII is logged
3. **Encryption**: Sensitive data encrypted in transit (HTTPS)
4. **Redaction**: Sensitive fields redacted in logs
5. **Masking**: Display masked values in UI (e.g., `****5678` for account numbers)

**Example - Redacting Sensitive Data in Logs**:
```javascript
// backend/utils/logger.js
function sanitizeLogData(data) {
  const sensitiveFields = ['password', 'accountNumber', 'panNumber'];
  
  const sanitized = { ...data };
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  });
  
  return sanitized;
}
```

---

## 🛡️ Security Headers

### Helmet Configuration

```javascript
// backend/server.js
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: true
}));
```

### Security Headers Applied

| Header | Value | Purpose |
|--------|-------|---------|
| **X-Content-Type-Options** | nosniff | Prevents MIME sniffing |
| **X-Frame-Options** | DENY | Prevents clickjacking |
| **X-XSS-Protection** | 1; mode=block | Enables XSS filter |
| **Strict-Transport-Security** | max-age=31536000; includeSubDomains | Forces HTTPS |
| **Content-Security-Policy** | (see above) | Restricts resource loading |
| **X-Powered-By** | (removed) | Hides technology stack |

**Response Example**:
```http
HTTP/1.1 200 OK
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline'
```

---

## ✅ Input Validation

### Joi Validation Schema

**Employee Creation Example**:
```javascript
// backend/middleware/validators/employee.validator.js
const Joi = require('joi');

const createEmployeeSchema = Joi.object({
  employeeId: Joi.string()
    .required()
    .pattern(/^SKYT\d{3,}$/)
    .messages({
      'string.pattern.base': 'Employee ID must start with SKYT followed by numbers'
    }),
  
  firstName: Joi.string()
    .required()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .messages({
      'string.pattern.base': 'First name must contain only letters'
    }),
  
  email: Joi.string()
    .required()
    .email()
    .lowercase(),
  
  phone: Joi.string()
    .required()
    .pattern(/^\d{10}$/)
    .messages({
      'string.pattern.base': 'Phone must be 10 digits'
    }),
  
  dateOfBirth: Joi.date()
    .required()
    .max('now')
    .less(Joi.ref('$today', {
      adjust: (value) => new Date(value.setFullYear(value.getFullYear() - 18))
    }))
    .messages({
      'date.less': 'Employee must be at least 18 years old'
    }),
  
  basicSalary: Joi.number()
    .required()
    .min(0)
    .max(10000000)
    .precision(2),
  
  panNumber: Joi.string()
    .required()
    .pattern(/^[A-Z]{5}\d{4}[A-Z]$/)
    .uppercase()
    .messages({
      'string.pattern.base': 'Invalid PAN number format'
    })
});
```

### Validation Middleware

```javascript
function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    req.validatedData = value;
    next();
  };
}

// Usage
router.post('/employees', 
  authenticateToken,
  authorize('admin', 'hr'),
  validate(createEmployeeSchema),
  employeeController.createEmployee
);
```

### SQL Injection Prevention

**Parameterized Queries (Sequelize)**:
```javascript
// ✅ SAFE - Parameterized query
const employee = await Employee.findOne({
  where: { employeeId: req.params.id }
});

// ✅ SAFE - Using bind parameters
const employees = await sequelize.query(
  'SELECT * FROM employees WHERE department_id = :deptId',
  {
    replacements: { deptId: departmentId },
    type: QueryTypes.SELECT
  }
);

// ❌ UNSAFE - String concatenation (NEVER DO THIS)
// const query = `SELECT * FROM employees WHERE id = '${req.params.id}'`;
```

---

## ⏱️ Rate Limiting

### Configuration

```javascript
// backend/server.js
const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per window
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for authentication
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Only 20 login attempts per 15 minutes
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes.'
  }
});

// Apply rate limiters
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
```

### Rate Limit Headers

```http
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 295
X-RateLimit-Reset: 1698426000
```

---

## 📝 Audit Logging

### Audit Log Structure

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
```

### Logged Actions

| Category | Actions |
|----------|---------|
| **Authentication** | LOGIN, LOGOUT, PASSWORD_CHANGE, FAILED_LOGIN |
| **Employee** | EMPLOYEE_CREATE, EMPLOYEE_UPDATE, EMPLOYEE_DELETE |
| **Timesheet** | TIMESHEET_CREATE, TIMESHEET_SUBMIT, TIMESHEET_APPROVE, TIMESHEET_REJECT |
| **Leave** | LEAVE_REQUEST, LEAVE_APPROVE, LEAVE_REJECT, LEAVE_CANCEL |
| **Payroll** | PAYROLL_GENERATE, PAYROLL_APPROVE, PAYSLIP_VIEW |
| **System** | CONFIG_CHANGE, USER_CREATE, USER_DELETE |

### Audit Logging Implementation

```javascript
// backend/utils/audit-logger.js
async function logAudit(data) {
  const {
    userId,
    action,
    resourceType,
    resourceId,
    details,
    ipAddress,
    userAgent
  } = data;

  await AuditLog.create({
    userId,
    action,
    resourceType,
    resourceId,
    details,
    ipAddress,
    userAgent
  });
}

// Usage in controller
async function updateEmployee(req, res) {
  try {
    const employee = await Employee.findByPk(req.params.id);
    await employee.update(req.validatedData);

    // Log the update
    await logAudit({
      userId: req.user.id,
      action: 'EMPLOYEE_UPDATE',
      resourceType: 'employee',
      resourceId: employee.id,
      details: {
        changes: req.validatedData,
        previousValues: employee.dataValues
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: employee
    });
  } catch (error) {
    next(error);
  }
}
```

### Audit Log Query

```javascript
// Get audit logs for specific user
const logs = await AuditLog.findAll({
  where: {
    userId: employeeUserId,
    createdAt: {
      [Op.gte]: new Date('2025-10-01'),
      [Op.lte]: new Date('2025-10-31')
    }
  },
  include: [{
    model: User,
    attributes: ['email', 'role']
  }],
  order: [['createdAt', 'DESC']]
});
```

---

## 🔧 Security Best Practices

### For Developers

#### 1. **Never Commit Secrets**
```bash
# ❌ BAD - Hardcoded secrets
const JWT_SECRET = 'mysecret123';

# ✅ GOOD - Use environment variables
const JWT_SECRET = process.env.JWT_SECRET;
```

**Use `.gitignore`**:
```
.env
.env.local
.env.production
*.key
*.pem
```

#### 2. **Validate All Inputs**
```javascript
// ✅ Always validate before processing
router.post('/endpoint', 
  validate(schema), 
  controller.handler
);
```

#### 3. **Use Prepared Statements**
```javascript
// ✅ GOOD - Sequelize automatically uses prepared statements
await Employee.findOne({ where: { id: userId } });

// ❌ BAD - Raw string concatenation
// await sequelize.query(`SELECT * FROM employees WHERE id = '${userId}'`);
```

#### 4. **Implement Least Privilege**
```javascript
// ✅ Restrict access by role
router.delete('/employees/:id', 
  authenticateToken,
  authorize('admin'), // Only admin can delete
  employeeController.deleteEmployee
);
```

#### 5. **Sanitize Output**
```javascript
// ✅ Remove sensitive fields before sending response
const userResponse = {
  id: user.id,
  email: user.email,
  role: user.role,
  // password is excluded
};
```

### For System Administrators

#### 1. **Environment Configuration**
```bash
# .env.production
NODE_ENV=production
PORT=5000

# Strong random secret (generate with: openssl rand -base64 32)
JWT_SECRET=<strong-random-secret>

# Database with restricted user
DB_HOST=localhost
DB_USER=hrm_app
DB_PASSWORD=<strong-password>
DB_NAME=skyraksys_hrm

# Restrict database user permissions
# GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO hrm_app;
```

#### 2. **Firewall Rules**
```bash
# Allow only necessary ports
sudo firewall-cmd --zone=public --add-service=https --permanent
sudo firewall-cmd --zone=public --add-service=http --permanent
sudo firewall-cmd --reload

# Restrict PostgreSQL access
# Edit /var/lib/pgsql/data/pg_hba.conf
# host    skyraksys_hrm    hrm_app    127.0.0.1/32    scram-sha-256
```

#### 3. **Regular Updates**
```bash
# Keep system updated
sudo dnf update -y

# Update Node.js packages
npm audit
npm audit fix

# Check for outdated packages
npm outdated
```

#### 4. **Backup Strategy**
```bash
# Daily automated backups
0 2 * * * /usr/local/bin/backup-hrm-db.sh

# Encrypt backups
gpg --encrypt --recipient admin@skyraksys.com backup.sql

# Store offsite (e.g., AWS S3 with encryption)
aws s3 cp backup.sql.gpg s3://hrm-backups/ --sse
```

### Security Checklist

#### Pre-Deployment
- [ ] All dependencies updated (`npm audit`)
- [ ] Environment variables configured
- [ ] Strong JWT secret generated
- [ ] Database user with minimal permissions
- [ ] SSL/TLS certificates installed
- [ ] Firewall rules configured
- [ ] Rate limiting enabled
- [ ] Security headers configured (Helmet)
- [ ] CORS properly configured
- [ ] Audit logging enabled

#### Post-Deployment
- [ ] Monitor logs for suspicious activity
- [ ] Review audit logs regularly
- [ ] Test authentication and authorization
- [ ] Verify HTTPS enforcement
- [ ] Check security headers
- [ ] Test rate limiting
- [ ] Verify backup automation
- [ ] Document incident response plan

---

## 🚨 Vulnerability Management

### Dependency Scanning

```bash
# Check for vulnerabilities
npm audit

# Fix automatically (where possible)
npm audit fix

# View detailed report
npm audit --json > audit-report.json
```

### Common Vulnerabilities

| Vulnerability | Prevention |
|---------------|------------|
| **SQL Injection** | Use ORM (Sequelize), parameterized queries |
| **XSS** | Input validation, output encoding, CSP headers |
| **CSRF** | CSRF tokens (handled by SameSite cookies) |
| **Broken Auth** | JWT with expiration, rate limiting, strong passwords |
| **Sensitive Data Exposure** | HTTPS, encryption, access control |
| **Broken Access Control** | RBAC, resource ownership checks |
| **Security Misconfiguration** | Security headers, proper error handling |
| **Insufficient Logging** | Comprehensive audit logging |

### Security Testing

```bash
# Run security audit
npm audit

# Check for outdated packages
npm outdated

# Static code analysis (optional)
npm install -g eslint-plugin-security
eslint --plugin security .
```

---

## 🆘 Incident Response

### Incident Response Plan

#### 1. **Detection**
- Monitor audit logs for unusual activity
- Check for failed login attempts
- Review rate limit violations
- Monitor error logs

#### 2. **Containment**
```bash
# Immediately revoke compromised tokens
# Update JWT_SECRET in environment
export JWT_SECRET=<new-strong-secret>

# Restart application
pm2 restart skyraksys-hrm

# Block suspicious IPs at firewall
sudo firewall-cmd --add-rich-rule='rule family="ipv4" source address="<IP>" reject'
```

#### 3. **Investigation**
```sql
-- Query audit logs for suspicious activity
SELECT * FROM audit_logs
WHERE action = 'FAILED_LOGIN'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Check for unauthorized access
SELECT * FROM audit_logs
WHERE user_id IN (
  SELECT id FROM users WHERE role != 'admin'
)
AND action IN ('USER_CREATE', 'CONFIG_CHANGE')
AND created_at > NOW() - INTERVAL '7 days';
```

#### 4. **Recovery**
- Reset compromised passwords
- Regenerate all JWT tokens
- Review and update access controls
- Restore from backup if data compromised

#### 5. **Post-Incident**
- Document incident details
- Update security measures
- Conduct team review
- Implement additional monitoring

### Emergency Contacts

| Role | Contact | Responsibility |
|------|---------|----------------|
| **System Admin** | admin@skyraksys.com | System access, infrastructure |
| **Security Lead** | security@skyraksys.com | Security decisions |
| **Database Admin** | dba@skyraksys.com | Database operations |
| **Development Lead** | dev-lead@skyraksys.com | Code changes, hotfixes |

---

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)

---

**Next**: [Developer Guide](./05-DEVELOPER_GUIDE.md)
