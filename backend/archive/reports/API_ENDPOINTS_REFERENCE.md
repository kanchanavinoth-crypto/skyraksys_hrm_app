# HRM System API Endpoints Reference

## Table of Contents
- [Authentication](#authentication)
- [Employee Management](#employee-management)
- [Leave Management](#leave-management)
- [Payroll Management](#payroll-management)
- [System Health](#system-health)
- [Testing Credentials](#testing-credentials)

---

## Authentication

### Base URL
```
http://localhost:5000/api
```

### Login
**Endpoint:** `POST /auth/login`  
**Description:** Authenticate user and get JWT token  
**Authentication:** None required  

**Request Payload:**
```json
{
  "email": "admin@company.com",
  "password": "Kx9mP7qR2nF8sA5t"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "36279948-488e-499f-8eb1-b2881d339116",
      "email": "admin@company.com",
      "role": "admin",
      "employeeId": "06fca70c-a5a0-4915-814c-fe1fb723059f"
    }
  }
}
```

### Get Current User Profile
**Endpoint:** `GET /auth/profile` or `GET /auth/me`  
**Description:** Get current authenticated user information  
**Authentication:** Bearer Token required  

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "87801a57-3627-46f0-aca5-4ee90fc9decc",
    "firstName": "System",
    "lastName": "Administrator",
    "email": "admin@company.com",
    "role": "admin",
    "isActive": true,
    "lastLoginAt": "2025-09-04T15:45:40.587Z",
    "passwordChangedAt": null,
    "emailVerifiedAt": null,
    "createdAt": "2025-09-04T15:42:35.088Z",
    "updatedAt": "2025-09-04T15:45:40.588Z",
    "deletedAt": null,
    "employee": {
      "id": "397dc37d-6de8-4a6e-927e-86767160ae01",
      "managerId": null
    }
  }
}
```

---

## Employee Management

### Get Employee Departments
**Endpoint:** `GET /employees/departments` or `GET /employees/meta/departments`  
**Description:** Get list of all active departments  
**Authentication:** Bearer Token required  

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "5f763f7b-644b-4d06-8f6e-eafc4a9f41cf",
      "name": "Human Resources",
      "description": "Manages employee relations, recruitment, and HR policies",
      "isActive": true,
      "createdAt": "2025-09-04T15:42:35.295Z",
      "updatedAt": "2025-09-04T15:42:35.295Z"
    },
    {
      "id": "9c1e3afb-7057-4199-acfa-7b9b7f82c2cc",
      "name": "Information Technology",
      "description": "Handles IT infrastructure, software development, and technical support",
      "isActive": true,
      "createdAt": "2025-09-04T15:42:35.295Z",
      "updatedAt": "2025-09-04T15:42:35.295Z"
    }
  ]
}
```

### Get Employee Positions
**Endpoint:** `GET /employees/positions` or `GET /employees/meta/positions`  
**Description:** Get list of all active positions  
**Authentication:** Bearer Token required  

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "3c983601-28d5-4420-9079-78c1f3fb3140",
      "title": "HR Manager",
      "description": "Manages HR operations and policies",
      "level": "Manager",
      "isActive": true,
      "createdAt": "2025-09-04T15:42:35.308Z",
      "updatedAt": "2025-09-04T15:42:35.308Z",
      "departmentId": "5f763f7b-644b-4d06-8f6e-eafc4a9f41cf"
    },
    {
      "id": "4406b985-cf4e-4cfc-b8e7-54295d1cd582",
      "title": "Software Developer",
      "description": "Develops and maintains software applications",
      "level": "Individual Contributor",
      "isActive": true,
      "createdAt": "2025-09-04T15:42:35.308Z",
      "updatedAt": "2025-09-04T15:42:35.308Z",
      "departmentId": "9c1e3afb-7057-4199-acfa-7b9b7f82c2cc"
    },
    {
      "id": "65be5f51-077c-4cb6-b535-ed983afcde23",
      "title": "System Administrator",
      "description": "Manages IT infrastructure and systems",
      "level": "Individual Contributor",
      "isActive": true,
      "createdAt": "2025-09-04T15:42:35.308Z",
      "updatedAt": "2025-09-04T15:42:35.308Z",
      "departmentId": "9c1e3afb-7057-4199-acfa-7b9b7f82c2cc"
    }
  ]
}
```

### Get Employee Statistics
**Endpoint:** `GET /employees/statistics`  
**Description:** Get employee count statistics  
**Authentication:** Bearer Token required (Admin/HR only)  

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "total": 3,
    "active": 3,
    "inactive": 0,
    "newThisMonth": 3
  }
}
```

### Get All Employees
**Endpoint:** `GET /employees`  
**Description:** Get paginated list of employees  
**Authentication:** Bearer Token required  

**Query Parameters:**
- `page` (optional): Page number (default: 0)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term

**Example URL:**
```
GET /employees?page=0&limit=10&search=
```

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "397dc37d-6de8-4a6e-927e-86767160ae01",
      "employeeId": "EMP001",
      "firstName": "System",
      "lastName": "Administrator",
      "email": "admin@company.com",
      "phone": "+1234567890",
      "status": "Active",
      "department": {
        "id": "5f763f7b-644b-4d06-8f6e-eafc4a9f41cf",
        "name": "Human Resources"
      },
      "position": {
        "id": "3c983601-28d5-4420-9079-78c1f3fb3140",
        "title": "HR Manager"
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalRecords": 3
  }
}
```

---

## Leave Management

### Get Leave Requests
**Endpoint:** `GET /leave` or `GET /leaves`  
**Description:** Get list of leave requests  
**Authentication:** Bearer Token required  

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "currentPage": 1,
    "totalPages": 0,
    "totalRecords": 0
  }
}
```

### Get Leave Balance
**Endpoint:** `GET /leave/balance/{employeeId}` or `GET /leaves/balance/{employeeId}`  
**Description:** Get leave balance for specific employee  
**Authentication:** Bearer Token required  

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Example URL:**
```
GET /leave/balance/06fca70c-a5a0-4915-814c-fe1fb723059f
```

---

## Payroll Management

### Get Payroll Data
**Endpoint:** `GET /payroll` or `GET /payrolls`  
**Description:** Get payroll information  
**Authentication:** Bearer Token required  

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

---

## Timesheet Management

### Get Timesheets
**Endpoint:** `GET /timesheets`  
**Description:** Get timesheet records  
**Authentication:** Bearer Token required  

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

---

## System Health

### Health Check
**Endpoint:** `GET /health`  
**Description:** Check API health status  
**Authentication:** None required  

**Success Response (200):**
```json
{
  "status": "OK",
  "message": "HRM System API is running",
  "timestamp": "2025-09-04T15:46:10.123Z",
  "version": "1.0.0"
}
```

---

## Testing Credentials

### Admin User
```json
{
  "email": "admin@company.com",
  "password": "Kx9mP7qR2nF8sA5t",
  "role": "admin"
}
```

### HR User
```json
{
  "email": "hr@company.com",
  "password": "Kx9mP7qR2nF8sA5t",
  "role": "hr"
}
```

### Employee User
```json
{
  "email": "employee@company.com",
  "password": "Kx9mP7qR2nF8sA5t",
  "role": "employee"
}
```

---

## Error Responses

### Authentication Errors
**401 Unauthorized:**
```json
{
  "success": false,
  "message": "No token provided."
}
```

```json
{
  "success": false,
  "message": "Failed to authenticate token."
}
```

### Not Found Errors
**404 Not Found:**
```json
{
  "success": false,
  "message": "API endpoint not found",
  "availableEndpoints": [
    "/api/auth/*",
    "/api/users/*",
    "/api/employees/*",
    "/api/departments/*",
    "/api/projects/*",
    "/api/tasks/*",
    "/api/timesheets/*",
    "/api/leave/*",
    "/api/payrolls/*",
    "/api/salary-structures/*",
    "/api/health"
  ]
}
```

### Validation Errors
**400 Bad Request:**
```json
{
  "success": false,
  "message": "Invalid credentials."
}
```

---

## cURL Testing Examples

### Login and Get Token
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"Kx9mP7qR2nF8sA5t"}' \
  http://localhost:5000/api/auth/login
```

### Get Current User
```bash
curl -H "Authorization: Bearer {YOUR_JWT_TOKEN}" \
  http://localhost:5000/api/auth/me
```

### Get Departments
```bash
curl -H "Authorization: Bearer {YOUR_JWT_TOKEN}" \
  http://localhost:5000/api/employees/departments
```

### Get Positions
```bash
curl -H "Authorization: Bearer {YOUR_JWT_TOKEN}" \
  http://localhost:5000/api/employees/positions
```

### Get Employee Statistics
```bash
curl -H "Authorization: Bearer {YOUR_JWT_TOKEN}" \
  http://localhost:5000/api/employees/statistics
```

### Get Leave Requests
```bash
curl -H "Authorization: Bearer {YOUR_JWT_TOKEN}" \
  http://localhost:5000/api/leaves
```

---

## Route Aliases

The following routes have aliases for frontend compatibility:

| Original Route | Alias Route | Purpose |
|---|---|---|
| `/api/auth/profile` | `/api/auth/me` | Frontend compatibility |
| `/api/leave` | `/api/leaves` | Plural/singular compatibility |
| `/api/payrolls` | `/api/payroll` | Plural/singular compatibility |
| `/api/employees/meta/departments` | `/api/employees/departments` | Simplified access |
| `/api/employees/meta/positions` | `/api/employees/positions` | Simplified access |

---

## Frontend Auth Service Methods

### Available Methods in authService

```javascript
// Synchronous methods
authService.getCurrentUser()      // Get user from JWT token (sync)
authService.getAccessToken()      // Get stored JWT token
authService.getToken()            // Alias for getAccessToken() (backward compatibility)
authService.isAuthenticated()     // Check if user is logged in
authService.clearAuthData()       // Clear stored tokens

// Asynchronous methods
authService.login(email, password)           // Login user
authService.getProfile()                     // Get full user profile from API
authService.updateProfile(profileData)      // Update user profile
authService.changePassword(current, new)    // Change password
authService.logout()                         // Logout user
authService.refreshToken()                   // Refresh JWT token
```

### getCurrentUser() vs getProfile()

- **`getCurrentUser()`**: Synchronous method that decodes the JWT token to get basic user info (id, email, role, employeeId)
- **`getProfile()`**: Asynchronous method that calls the API to get complete user profile with employee details

---

## Notes

1. **JWT Tokens**: All tokens expire after 1 hour. Use the login endpoint to get a fresh token when needed.

2. **CORS**: The API accepts requests from `localhost:3000`, `localhost:3001`, and configured frontend URLs.

3. **Rate Limiting**: Currently disabled for testing, but can be enabled in production.

4. **Database**: Uses PostgreSQL with UUID primary keys.

5. **Security**: All employee routes require authentication. Admin/HR routes require elevated permissions.

6. **Pagination**: Most list endpoints support pagination with `page` and `limit` parameters.

---

*Last Updated: September 4, 2025*
