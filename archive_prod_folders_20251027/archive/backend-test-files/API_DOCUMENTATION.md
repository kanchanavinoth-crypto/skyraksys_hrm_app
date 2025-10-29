# API Documentation - SkyRakSys HRM System

## Overview

This document provides detailed API documentation for the SkyRakSys HRM System backend. All endpoints require authentication unless specified otherwise.

## Base URL
```
http://localhost:8080/api
```

## Authentication

### Headers Required
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Authentication Flow

1. **Login** to get access and refresh tokens
2. Use **access token** for API requests
3. Use **refresh token** to get new access token when expired
4. **Logout** to invalidate tokens

---

## 🔐 Authentication Endpoints

### POST /auth/login
User authentication

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
    "user": {
      "id": "uuid",
      "email": "admin@skyraksys.com",
      "role": "ADMIN",
      "employee": {
        "id": "uuid",
        "firstName": "System",
        "lastName": "Administrator"
      }
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
}
```

### POST /auth/register
User registration (Admin/HR only)

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "EMPLOYEE",
  "employeeData": {
    "firstName": "John",
    "lastName": "Doe",
    "departmentId": "dept_uuid",
    "positionId": "pos_uuid",
    "joiningDate": "2024-01-01",
    "salary": 50000
  }
}
```

### POST /auth/refresh
Refresh access token

**Request Body:**
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

### POST /auth/logout
User logout

**Request Body:**
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

### GET /auth/profile
Get current user profile

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "EMPLOYEE",
    "employee": {
      "firstName": "John",
      "lastName": "Doe",
      "department": "Engineering",
      "position": "Software Engineer"
    }
  }
}
```

### PUT /auth/profile
Update user profile

**Request Body:**
```json
{
  "firstName": "Updated Name",
  "phone": "+1234567890",
  "address": "New Address"
}
```

### PUT /auth/change-password
Change password

**Request Body:**
```json
{
  "currentPassword": "oldPassword",
  "newPassword": "newPassword123"
}
```

---

## 👥 Employee Endpoints

### GET /employees
Get all employees with filtering and pagination

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search in name, email, or employee ID
- `department`: Filter by department ID
- `position`: Filter by position ID
- `status`: Filter by status (ACTIVE, INACTIVE)

**Response:**
```json
{
  "success": true,
  "data": {
    "employees": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10
    }
  }
}
```

### GET /employees/:id
Get employee by ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "employeeId": "EMP001",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "department": {
      "id": "uuid",
      "name": "Engineering"
    },
    "position": {
      "id": "uuid",
      "title": "Software Engineer"
    },
    "joiningDate": "2024-01-01",
    "salary": 50000,
    "manager": {
      "id": "uuid",
      "firstName": "Jane",
      "lastName": "Smith"
    }
  }
}
```

### POST /employees
Create new employee (Admin/HR only)

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "departmentId": "dept_uuid",
  "positionId": "pos_uuid",
  "managerId": "manager_uuid",
  "joiningDate": "2024-01-01",
  "salary": 50000,
  "address": "123 Main St",
  "dateOfBirth": "1990-01-01",
  "emergencyContact": {
    "name": "Jane Doe",
    "phone": "+1234567891",
    "relationship": "Spouse"
  }
}
```

### PUT /employees/:id
Update employee

**Request Body:** (Same as POST, all fields optional)

### DELETE /employees/:id
Deactivate employee (Admin/HR only)

### GET /employees/meta/departments
Get all departments

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Engineering",
      "description": "Software Development",
      "headId": "manager_uuid"
    }
  ]
}
```

### GET /employees/meta/positions
Get all positions

### GET /employees/meta/dashboard
Get employee dashboard statistics

---

## 🏖️ Leave Management Endpoints

### GET /leaves
Get leave requests with filtering

**Query Parameters:**
- `page`, `limit`: Pagination
- `status`: PENDING, APPROVED, REJECTED, CANCELLED
- `employeeId`: Filter by employee
- `leaveType`: Filter by leave type
- `dateFrom`, `dateTo`: Date range filter

**Response:**
```json
{
  "success": true,
  "data": {
    "leaves": [
      {
        "id": "uuid",
        "employee": {
          "firstName": "John",
          "lastName": "Doe"
        },
        "leaveType": {
          "name": "Annual Leave",
          "code": "AL"
        },
        "startDate": "2024-01-15",
        "endDate": "2024-01-20",
        "days": 4,
        "reason": "Family vacation",
        "status": "PENDING",
        "appliedDate": "2024-01-01"
      }
    ],
    "pagination": {...}
  }
}
```

### POST /leaves
Create leave request

**Request Body:**
```json
{
  "leaveTypeId": "leave_type_uuid",
  "startDate": "2024-01-15",
  "endDate": "2024-01-20",
  "reason": "Family vacation",
  "isHalfDay": false,
  "halfDayType": null
}
```

### PUT /leaves/:id/status
Approve/reject leave request (Manager/HR/Admin only)

**Request Body:**
```json
{
  "status": "APPROVED",
  "comments": "Approved for vacation"
}
```

### PUT /leaves/:id/cancel
Cancel leave request (Employee only, for own requests)

### GET /leaves/balance/:employeeId?
Get leave balance for employee (optional employeeId for managers/HR)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "leaveType": {
        "name": "Annual Leave",
        "code": "AL"
      },
      "totalDays": 20,
      "usedDays": 5,
      "remainingDays": 15,
      "pendingDays": 2
    }
  ]
}
```

### GET /leaves/types
Get all leave types

### GET /leaves/statistics
Get leave statistics (Manager/HR/Admin only)

---

## ⏰ Timesheet Endpoints

### GET /timesheets
Get timesheets with filtering

**Query Parameters:**
- `page`, `limit`: Pagination
- `employeeId`: Filter by employee
- `status`: DRAFT, SUBMITTED, APPROVED, REJECTED
- `weekStarting`: Filter by week starting date
- `projectId`: Filter by project

**Response:**
```json
{
  "success": true,
  "data": {
    "timesheets": [
      {
        "id": "uuid",
        "employee": {
          "firstName": "John",
          "lastName": "Doe"
        },
        "weekStarting": "2024-01-01",
        "weekEnding": "2024-01-07",
        "totalHours": 40,
        "overtimeHours": 0,
        "status": "SUBMITTED",
        "entries": [
          {
            "date": "2024-01-01",
            "project": "Project Alpha",
            "task": "Development",
            "hours": 8,
            "description": "Feature implementation"
          }
        ]
      }
    ],
    "pagination": {...}
  }
}
```

### POST /timesheets
Create timesheet

**Request Body:**
```json
{
  "weekStarting": "2024-01-01",
  "entries": [
    {
      "date": "2024-01-01",
      "projectId": "project_uuid",
      "taskId": "task_uuid",
      "hours": 8,
      "description": "Feature development"
    }
  ]
}
```

### PUT /timesheets/:id
Update timesheet (only in DRAFT status)

### PUT /timesheets/:id/submit
Submit timesheet for approval

### PUT /timesheets/:id/status
Approve/reject timesheet (Manager/HR/Admin only)

**Request Body:**
```json
{
  "status": "APPROVED",
  "comments": "Good work this week"
}
```

### DELETE /timesheets/:id
Delete timesheet (only in DRAFT status)

### GET /timesheets/summary/:employeeId?
Get timesheet summary

### GET /timesheets/meta/projects
Get all projects

### GET /timesheets/meta/projects/:id/tasks
Get tasks for a project

---

## 💰 Payroll Endpoints

### GET /payroll
Get payroll records

**Query Parameters:**
- `page`, `limit`: Pagination
- `employeeId`: Filter by employee
- `status`: DRAFT, PROCESSED, PAID
- `month`, `year`: Filter by pay period

**Response:**
```json
{
  "success": true,
  "data": {
    "payrolls": [
      {
        "id": "uuid",
        "employee": {
          "firstName": "John",
          "lastName": "Doe",
          "employeeId": "EMP001"
        },
        "month": 1,
        "year": 2024,
        "basicSalary": 50000,
        "totalEarnings": 55000,
        "totalDeductions": 8000,
        "netSalary": 47000,
        "status": "PROCESSED",
        "payDate": "2024-01-31",
        "components": [
          {
            "type": "EARNING",
            "name": "Basic Salary",
            "amount": 50000
          },
          {
            "type": "DEDUCTION",
            "name": "Tax",
            "amount": 5000
          }
        ]
      }
    ],
    "pagination": {...}
  }
}
```

### GET /payroll/:id
Get payroll record by ID

### POST /payroll/generate
Generate payroll for month/year (Admin/HR only)

**Request Body:**
```json
{
  "month": 1,
  "year": 2024,
  "employeeIds": ["emp1_uuid", "emp2_uuid"] // optional, generates for all if not provided
}
```

### PUT /payroll/:id/status
Update payroll status (Admin/HR only)

**Request Body:**
```json
{
  "status": "PAID",
  "payDate": "2024-01-31"
}
```

### GET /payroll/meta/dashboard
Get payroll dashboard statistics (Admin/HR only)

### GET /payroll/employee/:id/summary
Get employee payroll summary

---

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ]
}
```

### Authentication Error (401)
```json
{
  "success": false,
  "message": "Authentication required"
}
```

### Authorization Error (403)
```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

### Not Found Error (404)
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Internal server error"
}
```

## Rate Limiting

- **Window**: 15 minutes
- **Max Requests**: 100 per IP per window
- **Headers**: 
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset time

## Data Types and Formats

### Date Format
All dates should be in ISO 8601 format: `YYYY-MM-DD`

### UUID Format
All IDs use UUID v4 format: `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`

### Pagination Response
```json
{
  "currentPage": 1,
  "totalPages": 10,
  "totalItems": 100,
  "itemsPerPage": 10,
  "hasNextPage": true,
  "hasPreviousPage": false
}
```

### Roles
- `ADMIN`: System administrator
- `HR`: HR manager  
- `MANAGER`: Team manager
- `EMPLOYEE`: Regular employee

### Status Values

**Employee Status:**
- `ACTIVE`: Active employee
- `INACTIVE`: Inactive employee

**Leave Status:**
- `PENDING`: Awaiting approval
- `APPROVED`: Approved leave
- `REJECTED`: Rejected leave
- `CANCELLED`: Cancelled by employee

**Timesheet Status:**
- `DRAFT`: Being edited
- `SUBMITTED`: Submitted for approval
- `APPROVED`: Approved timesheet
- `REJECTED`: Rejected timesheet

**Payroll Status:**
- `DRAFT`: Being prepared
- `PROCESSED`: Processed but not paid
- `PAID`: Payment completed
