# 🌐 SkyrakSys HRM API Documentation

## 🎯 **Overview**

This document provides comprehensive documentation for all API endpoints in the SkyrakSys HRM system. The API is built with Node.js/Express and follows RESTful principles with JWT authentication.

---

## 🔗 **Base URLs**
- **Development**: `http://localhost:8080/api`
- **Production**: `https://your-domain.com/api`
- **Swagger UI**: `http://localhost:8080/api-docs` (Interactive API documentation)

---

## 🔐 **Authentication**

### **JWT Token Authentication**
All API endpoints except login require JWT authentication.

**Headers:**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### **Authentication Flow**
1. **Login**: `POST /api/auth/login` with email/password
2. **Receive Token**: Server returns JWT token
3. **Use Token**: Include token in Authorization header for subsequent requests
4. **Token Expiry**: Tokens expire after 24 hours

### **User Roles**
- `admin` - Full system access
- `hr_manager` - HR operations and employee management  
- `team_lead` - Team management and approval workflows
- `employee` - Basic employee functions

---

## 📊 **Response Format**

### **Success Response**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "error": null
}
```

### **Error Response**
```json
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

### **Pagination Response**
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

---

## 🔑 **Authentication Endpoints**

### **POST /api/auth/login**
User login with email and password.

**Request Body:**
```json
{
  "email": "admin@skyraksys.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "admin@skyraksys.com",
      "role": "admin"
    },
    "employee": {
      "id": 1,
      "firstName": "System",
      "lastName": "Administrator"
    }
  }
}
```

### **GET /api/auth/me**
Get current user profile.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "employee": { ... }
  }
}
```

### **POST /api/auth/register**
Register new user (Admin only).

**Request Body:**
```json
{
  "email": "newuser@skyraksys.com",
  "password": "password123",
  "role": "employee"
}
```

---

## 👥 **Employee Management Endpoints**

### **GET /api/employees**
Get list of employees with filtering and pagination.

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 10, max: 100)
- `department` (string): Filter by department
- `position` (string): Filter by position
- `isActive` (boolean): Filter by active status
- `search` (string): Search in name, email, or employee ID

**Example Request:**
```http
GET /api/employees?page=1&limit=20&department=Engineering&isActive=true
```

**Response:**
```json
{
  "success": true,
  "data": {
    "employees": [
      {
        "id": 1,
        "employeeId": "EMP001",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@skyraksys.com",
        "position": "Software Developer",
        "department": "Engineering",
        "managerId": 2,
        "salary": 75000,
        "isActive": true,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

### **POST /api/employees**
Create new employee.

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@skyraksys.com",
  "phone": "+1234567890",
  "dateOfBirth": "1990-05-15",
  "dateOfJoining": "2024-01-15",
  "position": "Frontend Developer",
  "department": "Engineering",
  "managerId": 2,
  "salary": 80000,
  "salaryStructure": {
    "basic": 60000,
    "hra": 15000,
    "transport": 3000,
    "medical": 2000
  },
  "createUser": true,
  "userRole": "employee"
}
```

### **GET /api/employees/{id}**
Get employee details by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "employeeId": "EMP001",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@skyraksys.com",
    "phone": "+1234567890",
    "dateOfBirth": "1985-03-20",
    "dateOfJoining": "2023-01-15",
    "position": "Software Developer",
    "department": "Engineering",
    "manager": {
      "id": 2,
      "firstName": "Alice",
      "lastName": "Johnson",
      "position": "Engineering Manager"
    },
    "directReports": [
      {
        "id": 3,
        "firstName": "Bob",
        "lastName": "Wilson",
        "position": "Junior Developer"
      }
    ],
    "salary": 75000,
    "salaryStructure": { ... },
    "isActive": true,
    "user": {
      "id": 2,
      "email": "john.doe@skyraksys.com",
      "role": "employee",
      "isActive": true
    }
  }
}
```

### **PUT /api/employees/{id}**
Update employee information.

### **DELETE /api/employees/{id}**
Soft delete employee (sets isActive to false).

---

## 🏖️ **Leave Management Endpoints**

### **GET /api/leaves**
Get leave requests with filtering.

**Query Parameters:**
- `employeeId` (integer): Filter by employee
- `status` (string): pending, approved, rejected
- `leaveType` (string): annual, sick, personal, maternity, paternity, emergency
- `startDate` (date): Filter leaves starting from date
- `endDate` (date): Filter leaves ending before date

### **POST /api/leaves**
Create leave request.

**Request Body:**
```json
{
  "leaveType": "annual",
  "startDate": "2024-02-15",
  "endDate": "2024-02-20",
  "reason": "Family vacation",
  "employeeId": 1
}
```

### **PATCH /api/leaves/{id}/approve**
Approve leave request (Manager/HR only).

**Request Body:**
```json
{
  "comments": "Approved for family vacation"
}
```

### **PATCH /api/leaves/{id}/reject**
Reject leave request (Manager/HR only).

**Request Body:**
```json
{
  "comments": "Not enough notice provided"
}
```

---

## ⏰ **Timesheet Management Endpoints**

### **GET /api/timesheets**
Get timesheet entries.

**Query Parameters:**
- `employeeId` (integer): Filter by employee
- `date` (date): Specific date
- `week` (date): Week starting date (Monday)
- `status` (string): draft, submitted, approved, rejected

### **POST /api/timesheets**
Create/update timesheet entry.

**Request Body:**
```json
{
  "date": "2024-01-15",
  "hoursWorked": 8,
  "overtimeHours": 2,
  "projectId": 1,
  "taskId": 5,
  "description": "Frontend development and testing",
  "employeeId": 1
}
```

### **POST /api/timesheets/weekly**
Submit weekly timesheet.

**Request Body:**
```json
{
  "weekStartDate": "2024-01-15",
  "timesheets": [
    {
      "date": "2024-01-15",
      "hoursWorked": 8,
      "overtimeHours": 0,
      "projectId": 1,
      "description": "Backend API development"
    },
    {
      "date": "2024-01-16",
      "hoursWorked": 8,
      "overtimeHours": 2,
      "projectId": 1,
      "description": "Database optimization"
    }
  ]
}
```

---

## 📋 **Project Management Endpoints**

### **GET /api/projects**
Get all projects.

**Query Parameters:**
- `status` (string): planning, active, on_hold, completed, cancelled
- `managerId` (integer): Filter by project manager

### **POST /api/projects**
Create new project.

**Request Body:**
```json
{
  "name": "Mobile App Development",
  "description": "Development of iOS and Android applications",
  "startDate": "2024-02-01",
  "endDate": "2024-08-01",
  "managerId": 2,
  "budget": 500000,
  "status": "planning"
}
```

### **GET /api/projects/{id}/tasks**
Get tasks for a project.

### **POST /api/projects/{id}/tasks**
Create task in project.

---

## 💰 **Payroll Management Endpoints**

### **GET /api/payroll/payslips**
Get payslips.

**Query Parameters:**
- `employeeId` (integer): Filter by employee
- `payPeriod` (string): Filter by pay period (e.g., "2024-01")
- `year` (integer): Filter by year

### **POST /api/payroll/payslips**
Generate payslip.

**Request Body:**
```json
{
  "employeeId": 1,
  "payPeriod": "2024-01",
  "bonuses": 5000,
  "additionalDeductions": {
    "loan": 2000,
    "advance": 1000
  }
}
```

### **GET /api/payroll/payslips/{id}/download**
Download payslip as PDF.

---

## 📊 **Reports Endpoints**

### **GET /api/reports/employees**
Generate employee report.

**Query Parameters:**
- `department` (string): Filter by department
- `position` (string): Filter by position
- `format` (string): json, csv, pdf

### **GET /api/reports/attendance**
Generate attendance report.

**Query Parameters:**
- `startDate` (date): Report start date
- `endDate` (date): Report end date
- `employeeId` (integer): Specific employee
- `department` (string): Filter by department

### **GET /api/reports/leaves**
Generate leave report.

### **GET /api/reports/payroll**
Generate payroll report.

---

## 🏥 **System Health Endpoints**

### **GET /api/health**
Basic health check.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 86400
}
```

### **GET /api/health/detailed**
Detailed system health (Admin only).

**Response:**
```json
{
  "status": "healthy",
  "database": {
    "status": "connected",
    "responseTime": 25
  },
  "memory": {
    "used": 512,
    "total": 2048,
    "percentage": 25
  },
  "version": "1.0.0",
  "environment": "production"
}
```

---

## 🚨 **Error Codes**

| Code | Description |
|------|-------------|
| `AUTH_001` | Invalid credentials |
| `AUTH_002` | Token expired |
| `AUTH_003` | Insufficient permissions |
| `VAL_001` | Validation error |
| `VAL_002` | Required field missing |
| `NOT_FOUND` | Resource not found |
| `DUPLICATE` | Duplicate entry |
| `DB_ERROR` | Database error |
| `SERVER_ERROR` | Internal server error |

---

## 📈 **Rate Limiting**

- **Authenticated users**: 1000 requests per hour
- **Unauthenticated**: 100 requests per hour
- **Admin users**: 2000 requests per hour

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642234567
```

---

## 🔄 **Webhooks**

The system supports webhooks for real-time notifications:

### **Events**
- `employee.created`
- `employee.updated`
- `employee.deactivated`
- `leave.submitted`
- `leave.approved`
- `leave.rejected`
- `timesheet.submitted`
- `payslip.generated`

### **Webhook Payload**
```json
{
  "event": "leave.approved",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "leaveId": 123,
    "employeeId": 1,
    "approverId": 2
  }
}
```

---

## 🧪 **Testing the API**

### **Using curl**
```bash
# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@skyraksys.com","password":"admin123"}'

# Get employees
curl -X GET http://localhost:8080/api/employees \
  -H "Authorization: Bearer <your_token>"
```

### **Using Postman**
1. Import the Postman collection from `/docs/api/postman-collection.json`
2. Set up environment variables for base URL and token
3. Use the pre-configured requests

### **Interactive Documentation**
Visit `http://localhost:8080/api-docs` for interactive Swagger UI documentation where you can test endpoints directly.

---

## 📞 **Support**

For API support:
- **Email**: api-support@skyraksys.com
- **Documentation**: Check this guide first
- **Issues**: Create GitHub issue with API tag
- **Swagger UI**: Use interactive documentation for testing

---

**Happy Coding! 🚀**
- `DELETE /api/timesheets/:id` - Delete timesheet

### Projects
- `GET /api/projects` - List projects
- `GET /api/projects/:id` - Get project details
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Payroll
- `GET /api/payroll` - List payroll records
- `GET /api/payroll/:id` - Get payroll details
- `POST /api/payroll` - Generate payroll
- `PUT /api/payroll/:id` - Update payroll
- `DELETE /api/payroll/:id` - Delete payroll

## Request/Response Examples

### Authentication

#### Login Request
```json
POST /api/auth/login
{
    "email": "user@example.com",
    "password": "password123"
}
```

#### Login Response
```json
{
    "success": true,
    "data": {
        "token": "jwt_token_here",
        "user": {
            "id": "uuid",
            "email": "user@example.com",
            "role": "admin"
        }
    }
}
```

## Error Handling

### Error Response Format
```json
{
    "success": false,
    "error": {
        "code": "ERROR_CODE",
        "message": "Error description"
    }
}
```

### Common Error Codes
- `INVALID_CREDENTIALS` - Login failed
- `TOKEN_EXPIRED` - JWT token expired
- `UNAUTHORIZED` - Missing or invalid token
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid input data

## Rate Limiting
API endpoints are rate-limited to protect against abuse:
- 100 requests per 15 minutes window per IP
- Authentication endpoints: 5 requests per minute

## Best Practices
1. Always validate request data
2. Handle API errors gracefully
3. Implement proper token refresh mechanism
4. Use appropriate HTTP methods
5. Follow security guidelines

## References
- [Authentication Guide](../development/AUTHENTICATION.md)
- [Error Handling Guide](../development/ERROR_HANDLING.md)
- [Security Best Practices](../development/SECURITY.md)