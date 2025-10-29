# 🌐 API Reference Guide

**Version**: 2.0.0  
**Last Updated**: October 27, 2025  
**Base URL**: `http://localhost:5000/api` (Development)

---

## 📋 Table of Contents

1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [Standard Response Format](#standard-response-format)
4. [Error Handling](#error-handling)
5. [Authentication Endpoints](#authentication-endpoints)
6. [Employee Endpoints](#employee-endpoints)
7. [Timesheet Endpoints](#timesheet-endpoints)
8. [Leave Management Endpoints](#leave-management-endpoints)
9. [Payroll Endpoints](#payroll-endpoints)
10. [Project & Task Endpoints](#project--task-endpoints)
11. [Dashboard & Reports](#dashboard--reports)
12. [Admin Endpoints](#admin-endpoints)

---

## 🎯 API Overview

### Base Information

| Property | Value |
|----------|-------|
| **Protocol** | HTTP/HTTPS |
| **Format** | JSON |
| **Authentication** | JWT Bearer Token |
| **Rate Limiting** | 300 requests/15 min (general), 20 requests/15 min (auth) |
| **Versioning** | Not versioned (v1 implicit) |

### HTTP Methods

| Method | Usage |
|--------|-------|
| **GET** | Retrieve resource(s) |
| **POST** | Create new resource |
| **PUT** | Update entire resource |
| **PATCH** | Update partial resource |
| **DELETE** | Delete resource |

### Common Headers

```http
Content-Type: application/json
Authorization: Bearer {access_token}
```

---

## 🔐 Authentication

### JWT Token Structure

**Payload**:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "employee",
  "employeeId": "uuid",
  "iat": 1698422400,
  "exp": 1698426000
}
```

**Usage**:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Role-Based Access

| Role | Access Level |
|------|--------------|
| **admin** | Full system access |
| **hr** | Employee, leave, payroll management |
| **manager** | Team management, approvals |
| **employee** | Self-service only |

---

## 📦 Standard Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  }
}
```

### Success with Pagination

```json
{
  "success": true,
  "message": "Employees retrieved successfully",
  "data": {
    "employees": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 95,
      "itemsPerPage": 10
    }
  }
}
```

---

## ❌ Error Handling

### Error Response Format

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

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| **200** | OK | Request successful |
| **201** | Created | Resource created successfully |
| **400** | Bad Request | Invalid input/validation error |
| **401** | Unauthorized | Authentication required or failed |
| **403** | Forbidden | Insufficient permissions |
| **404** | Not Found | Resource not found |
| **409** | Conflict | Duplicate resource (e.g., email exists) |
| **429** | Too Many Requests | Rate limit exceeded |
| **500** | Internal Server Error | Server error |

### Common Error Examples

**Validation Error**:
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Email must be a valid email address"
    },
    {
      "field": "phone",
      "message": "Phone must be 10 digits"
    }
  ]
}
```

**Authentication Error**:
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

**Authorization Error**:
```json
{
  "success": false,
  "message": "Access denied. Insufficient permissions."
}
```

---

## 🔑 Authentication Endpoints

### POST /auth/login

**Description**: Authenticate user and receive access token

**Request**:
```json
{
  "email": "admin@skyraksys.com",
  "password": "admin123"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "admin@skyraksys.com",
      "role": "admin",
      "employeeId": "550e8400-e29b-41d4-a716-446655440001"
    }
  }
}
```

**Errors**:
- 401: Invalid credentials
- 400: Validation error

---

### GET /auth/profile

**Description**: Get current user profile

**Authentication**: Required

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "employee",
    "employee": {
      "id": "uuid",
      "employeeId": "SKYT001",
      "firstName": "John",
      "lastName": "Doe",
      "department": {
        "id": "uuid",
        "name": "Engineering"
      },
      "position": {
        "id": "uuid",
        "title": "Software Engineer"
      }
    }
  }
}
```

---

### PUT /auth/change-password

**Description**: Change user password

**Authentication**: Required

**Request**:
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Errors**:
- 400: Current password incorrect
- 400: Password validation failed

---

## 👥 Employee Endpoints

### GET /employees

**Description**: Get all employees with filtering and pagination

**Authentication**: Required  
**Roles**: All

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| page | integer | Page number (default: 1) |
| limit | integer | Items per page (default: 10, max: 100) |
| search | string | Search by name, email, or employee ID |
| department | uuid | Filter by department ID |
| position | uuid | Filter by position ID |
| status | string | Filter by status (Active, Inactive, etc.) |
| sort | string | Sort field (e.g., firstName, hireDate) |
| order | string | Sort order (asc, desc) |

**Example Request**:
```http
GET /api/employees?page=1&limit=10&department=uuid&status=Active&sort=firstName&order=asc
```

**Response** (200):
```json
{
  "success": true,
  "message": "Employees retrieved successfully",
  "data": {
    "employees": [
      {
        "id": "uuid",
        "employeeId": "SKYT001",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@skyraksys.com",
        "phone": "9876543210",
        "status": "Active",
        "department": {
          "id": "uuid",
          "name": "Engineering"
        },
        "position": {
          "id": "uuid",
          "title": "Software Engineer"
        },
        "manager": {
          "id": "uuid",
          "firstName": "Jane",
          "lastName": "Smith"
        },
        "hireDate": "2024-01-15",
        "createdAt": "2024-01-10T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 45,
      "itemsPerPage": 10
    }
  }
}
```

---

### GET /employees/:id

**Description**: Get single employee details

**Authentication**: Required  
**Roles**: All (employees can only access their own data)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "employeeId": "SKYT001",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@skyraksys.com",
    "phone": "9876543210",
    "dateOfBirth": "1990-05-15",
    "gender": "Male",
    "maritalStatus": "Single",
    "address": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pinCode": "400001",
    "country": "India",
    "department": {
      "id": "uuid",
      "name": "Engineering"
    },
    "position": {
      "id": "uuid",
      "title": "Software Engineer"
    },
    "manager": {
      "id": "uuid",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane.smith@skyraksys.com"
    },
    "hireDate": "2024-01-15",
    "joiningDate": "2024-01-15",
    "employmentType": "Full-time",
    "status": "Active",
    "bankName": "HDFC Bank",
    "accountNumber": "12345678901234",
    "ifscCode": "HDFC0001234",
    "panNumber": "ABCDE1234F",
    "uanNumber": "123456789012",
    "basicSalary": 50000.00,
    "createdAt": "2024-01-10T10:00:00.000Z",
    "updatedAt": "2024-01-10T10:00:00.000Z"
  }
}
```

**Errors**:
- 404: Employee not found
- 403: Access denied (if trying to access other employee's data)

---

### POST /employees

**Description**: Create new employee

**Authentication**: Required  
**Roles**: admin, hr

**Request**:
```json
{
  "employeeId": "SKYT015",
  "firstName": "Alice",
  "lastName": "Johnson",
  "email": "alice.johnson@skyraksys.com",
  "phone": "9876543210",
  "dateOfBirth": "1992-08-20",
  "gender": "Female",
  "maritalStatus": "Single",
  "address": "456 Park Avenue",
  "city": "Delhi",
  "state": "Delhi",
  "pinCode": "110001",
  "departmentId": "uuid",
  "positionId": "uuid",
  "managerId": "uuid",
  "hireDate": "2025-11-01",
  "employmentType": "Full-time",
  "basicSalary": 60000.00,
  "bankName": "ICICI Bank",
  "accountNumber": "98765432109876",
  "ifscCode": "ICIC0001234",
  "panNumber": "FGHIJ5678K"
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Employee created successfully",
  "data": {
    "id": "uuid",
    "employeeId": "SKYT015",
    "firstName": "Alice",
    "lastName": "Johnson",
    "email": "alice.johnson@skyraksys.com",
    // ... other fields
  }
}
```

**Errors**:
- 400: Validation error
- 409: Employee ID or email already exists

---

### PUT /employees/:id

**Description**: Update employee information

**Authentication**: Required  
**Roles**: admin, hr (full update), employee (limited fields)

**Request** (partial update supported):
```json
{
  "phone": "9999888877",
  "address": "New Address",
  "city": "Mumbai",
  "bankName": "HDFC Bank",
  "accountNumber": "11112222333344"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Employee updated successfully",
  "data": {
    // Updated employee object
  }
}
```

---

### DELETE /employees/:id

**Description**: Deactivate employee (soft delete)

**Authentication**: Required  
**Roles**: admin, hr

**Response** (200):
```json
{
  "success": true,
  "message": "Employee deactivated successfully"
}
```

---

## ⏰ Timesheet Endpoints

### GET /timesheets

**Description**: Get timesheets with filtering

**Authentication**: Required  
**Roles**: All

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| page | integer | Page number |
| limit | integer | Items per page |
| employeeId | uuid | Filter by employee |
| projectId | uuid | Filter by project |
| status | string | Filter by status (Draft, Submitted, Approved, Rejected) |
| weekStart | date | Filter by week start date |
| startDate | date | Filter from date |
| endDate | date | Filter to date |

**Response** (200):
```json
{
  "success": true,
  "data": {
    "timesheets": [
      {
        "id": "uuid",
        "employee": {
          "id": "uuid",
          "employeeId": "SKYT001",
          "firstName": "John",
          "lastName": "Doe"
        },
        "project": {
          "id": "uuid",
          "name": "Website Redesign"
        },
        "task": {
          "id": "uuid",
          "name": "Frontend Development"
        },
        "weekStartDate": "2025-10-20",
        "mondayHours": 8.0,
        "tuesdayHours": 8.0,
        "wednesdayHours": 8.0,
        "thursdayHours": 8.0,
        "fridayHours": 8.0,
        "saturdayHours": 0.0,
        "sundayHours": 0.0,
        "totalHours": 40.0,
        "description": "Worked on responsive design",
        "status": "Approved",
        "submittedAt": "2025-10-25T09:00:00.000Z",
        "approvedBy": {
          "id": "uuid",
          "firstName": "Jane",
          "lastName": "Smith"
        },
        "approvedAt": "2025-10-26T10:30:00.000Z",
        "createdAt": "2025-10-20T08:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 25,
      "itemsPerPage": 10
    }
  }
}
```

---

### POST /timesheets

**Description**: Create new timesheet entry

**Authentication**: Required  
**Roles**: All

**Request**:
```json
{
  "projectId": "uuid",
  "taskId": "uuid",
  "weekStartDate": "2025-10-28",
  "mondayHours": 8.0,
  "tuesdayHours": 7.5,
  "wednesdayHours": 8.0,
  "thursdayHours": 8.0,
  "fridayHours": 6.5,
  "saturdayHours": 0.0,
  "sundayHours": 0.0,
  "description": "Development work on feature X"
}
```

**Validation Rules**:
- weekStartDate must be a Monday
- Daily hours: 0-24
- Total hours calculated automatically
- Cannot create duplicate entry (same employee, week, project, task)

**Response** (201):
```json
{
  "success": true,
  "message": "Timesheet created successfully",
  "data": {
    "id": "uuid",
    "employeeId": "uuid",
    "projectId": "uuid",
    "taskId": "uuid",
    "weekStartDate": "2025-10-28",
    "totalHours": 38.0,
    "status": "Draft",
    // ... other fields
  }
}
```

---

### PUT /timesheets/:id/submit

**Description**: Submit timesheet for approval

**Authentication**: Required  
**Roles**: employee (own timesheets only)

**Request**: No body required

**Response** (200):
```json
{
  "success": true,
  "message": "Timesheet submitted successfully",
  "data": {
    "id": "uuid",
    "status": "Submitted",
    "submittedAt": "2025-10-27T14:30:00.000Z"
  }
}
```

**Business Rules**:
- Timesheet must be in Draft status
- Cannot submit with 0 total hours
- Employee can only submit their own timesheets

---

### PUT /timesheets/:id/status

**Description**: Approve or reject timesheet

**Authentication**: Required  
**Roles**: manager, hr, admin

**Request**:
```json
{
  "status": "Approved",
  "comments": "Approved, good work"
}
```

**Valid Status Values**: Approved, Rejected

**Response** (200):
```json
{
  "success": true,
  "message": "Timesheet approved successfully",
  "data": {
    "id": "uuid",
    "status": "Approved",
    "approvedBy": "uuid",
    "approvedAt": "2025-10-27T15:00:00.000Z",
    "approverComments": "Approved, good work"
  }
}
```

---

## 🏖️ Leave Management Endpoints

### GET /leave

**Description**: Get leave requests

**Authentication**: Required  
**Roles**: All

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| employeeId | uuid | Filter by employee |
| leaveTypeId | uuid | Filter by leave type |
| status | string | Filter by status |
| startDate | date | Filter from date |
| endDate | date | Filter to date |
| year | integer | Filter by year |

**Response** (200):
```json
{
  "success": true,
  "data": {
    "leaveRequests": [
      {
        "id": "uuid",
        "employee": {
          "id": "uuid",
          "employeeId": "SKYT001",
          "firstName": "John",
          "lastName": "Doe"
        },
        "leaveType": {
          "id": "uuid",
          "name": "Casual Leave",
          "isPaid": true
        },
        "startDate": "2025-11-01",
        "endDate": "2025-11-03",
        "totalDays": 3.0,
        "isHalfDay": false,
        "reason": "Family function",
        "status": "Approved",
        "approvedBy": {
          "id": "uuid",
          "firstName": "Jane",
          "lastName": "Smith"
        },
        "approvedAt": "2025-10-27T10:00:00.000Z",
        "approverComments": "Approved",
        "createdAt": "2025-10-25T09:00:00.000Z"
      }
    ]
  }
}
```

---

### POST /leave

**Description**: Submit leave request

**Authentication**: Required  
**Roles**: All

**Request**:
```json
{
  "leaveTypeId": "uuid",
  "startDate": "2025-11-05",
  "endDate": "2025-11-07",
  "isHalfDay": false,
  "halfDayPeriod": null,
  "reason": "Personal work"
}
```

**Half-Day Example**:
```json
{
  "leaveTypeId": "uuid",
  "startDate": "2025-11-05",
  "endDate": "2025-11-05",
  "isHalfDay": true,
  "halfDayPeriod": "First Half",
  "reason": "Doctor appointment"
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Leave request submitted successfully",
  "data": {
    "id": "uuid",
    "employeeId": "uuid",
    "leaveTypeId": "uuid",
    "startDate": "2025-11-05",
    "endDate": "2025-11-07",
    "totalDays": 3.0,
    "status": "Pending",
    "createdAt": "2025-10-27T14:00:00.000Z"
  }
}
```

**Business Rules**:
- Cannot apply for past dates
- Cannot overlap with existing approved leaves
- Total days calculated automatically
- Half-day: totalDays = 0.5
- Must have sufficient leave balance

---

### PUT /leave/:id/status

**Description**: Approve or reject leave request

**Authentication**: Required  
**Roles**: manager, hr, admin

**Request**:
```json
{
  "status": "Approved",
  "comments": "Approved as requested"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Leave request approved successfully",
  "data": {
    "id": "uuid",
    "status": "Approved",
    "approvedBy": "uuid",
    "approvedAt": "2025-10-27T15:30:00.000Z"
  }
}
```

---

### GET /leave/balance/:employeeId?

**Description**: Get leave balance for employee

**Authentication**: Required  
**Roles**: All (employees can only view their own)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "year": 2025,
    "balances": [
      {
        "leaveType": {
          "id": "uuid",
          "name": "Casual Leave",
          "maxDaysPerYear": 12
        },
        "totalAllocated": 12.0,
        "usedDays": 5.0,
        "pendingDays": 2.0,
        "availableDays": 5.0
      },
      {
        "leaveType": {
          "id": "uuid",
          "name": "Sick Leave",
          "maxDaysPerYear": 10
        },
        "totalAllocated": 10.0,
        "usedDays": 2.0,
        "pendingDays": 0.0,
        "availableDays": 8.0
      }
    ]
  }
}
```

---

## 💰 Payroll Endpoints

### GET /payrolls

**Description**: Get payroll records

**Authentication**: Required  
**Roles**: admin, hr (all), employee (own only)

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| employeeId | uuid | Filter by employee |
| status | string | Filter by status |
| year | integer | Filter by year |
| month | integer | Filter by month (1-12) |

**Response** (200):
```json
{
  "success": true,
  "data": {
    "payrolls": [
      {
        "id": "uuid",
        "employee": {
          "id": "uuid",
          "employeeId": "SKYT001",
          "firstName": "John",
          "lastName": "Doe"
        },
        "payPeriodStart": "2025-10-01",
        "payPeriodEnd": "2025-10-31",
        "payDate": "2025-11-05",
        "basicSalary": 50000.00,
        "hra": 25000.00,
        "conveyance": 1600.00,
        "specialAllowance": 23400.00,
        "otherAllowances": 0.00,
        "grossSalary": 100000.00,
        "pfEmployee": 6000.00,
        "pfEmployer": 6000.00,
        "esiEmployee": 0.00,
        "esiEmployer": 0.00,
        "professionalTax": 200.00,
        "tds": 5000.00,
        "otherDeductions": 0.00,
        "totalDeductions": 11200.00,
        "netSalary": 88800.00,
        "workingDays": 26,
        "presentDays": 24,
        "absentDays": 2,
        "paidLeaves": 2,
        "status": "Paid",
        "processedAt": "2025-11-05T10:00:00.000Z"
      }
    ]
  }
}
```

---

### POST /payrolls/generate

**Description**: Generate payroll for employees

**Authentication**: Required  
**Roles**: admin, hr

**Request**:
```json
{
  "payPeriodStart": "2025-11-01",
  "payPeriodEnd": "2025-11-30",
  "employeeIds": ["uuid1", "uuid2"],
  "autoApprove": false
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Payroll generated for 2 employees",
  "data": {
    "generated": 2,
    "failed": 0,
    "payrolls": [
      {
        "id": "uuid",
        "employeeId": "uuid",
        "netSalary": 88800.00,
        "status": "Draft"
      }
    ]
  }
}
```

---

### GET /payslips/:id

**Description**: Get payslip details with breakdown

**Authentication**: Required  
**Roles**: admin, hr (all), employee (own only)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "payslipNumber": "PS-2025-10-001",
    "employee": {
      "employeeId": "SKYT001",
      "firstName": "John",
      "lastName": "Doe",
      "designation": "Software Engineer",
      "department": "Engineering",
      "bankAccount": "1234****5678",
      "panNumber": "ABCDE1234F",
      "uanNumber": "123456789012"
    },
    "payPeriod": {
      "month": "October",
      "year": 2025,
      "startDate": "2025-10-01",
      "endDate": "2025-10-31"
    },
    "earnings": [
      {
        "component": "Basic Salary",
        "amount": 50000.00
      },
      {
        "component": "HRA",
        "amount": 25000.00
      },
      {
        "component": "Conveyance",
        "amount": 1600.00
      },
      {
        "component": "Special Allowance",
        "amount": 23400.00
      }
    ],
    "deductions": [
      {
        "component": "Provident Fund",
        "amount": 6000.00
      },
      {
        "component": "Professional Tax",
        "amount": 200.00
      },
      {
        "component": "TDS",
        "amount": 5000.00
      }
    ],
    "summary": {
      "grossSalary": 100000.00,
      "totalDeductions": 11200.00,
      "netSalary": 88800.00
    },
    "attendance": {
      "workingDays": 26,
      "presentDays": 24,
      "absentDays": 2,
      "paidLeaves": 2
    }
  }
}
```

---

## 📊 Dashboard & Reports

### GET /dashboard/stats

**Description**: Get dashboard statistics

**Authentication**: Required  
**Roles**: All

**Response** (200):
```json
{
  "success": true,
  "data": {
    "employees": {
      "total": 95,
      "active": 90,
      "onLeave": 3,
      "inactive": 2
    },
    "leaves": {
      "pending": 5,
      "approved": 23,
      "rejected": 2
    },
    "timesheets": {
      "draft": 12,
      "submitted": 8,
      "approved": 45
    },
    "departments": [
      {
        "name": "Engineering",
        "employeeCount": 35
      },
      {
        "name": "Sales",
        "employeeCount": 20
      }
    ]
  }
}
```

---

## 🔧 Admin Endpoints

### GET /departments

**Description**: Get all departments

**Authentication**: Required

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Engineering",
      "description": "Software development team",
      "head": {
        "id": "uuid",
        "firstName": "Jane",
        "lastName": "Smith"
      },
      "employeeCount": 35,
      "isActive": true
    }
  ]
}
```

---

### GET /positions

**Description**: Get all positions

**Authentication**: Required

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Software Engineer",
      "description": "Full stack development",
      "department": {
        "id": "uuid",
        "name": "Engineering"
      },
      "minSalary": 40000.00,
      "maxSalary": 80000.00,
      "employeeCount": 25,
      "isActive": true
    }
  ]
}
```

---

### GET /projects

**Description**: Get all projects

**Authentication**: Required

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Website Redesign",
      "description": "Complete website overhaul",
      "clientName": "ABC Corp",
      "startDate": "2025-09-01",
      "endDate": "2025-12-31",
      "status": "Active",
      "manager": {
        "id": "uuid",
        "firstName": "Jane",
        "lastName": "Smith"
      },
      "taskCount": 15,
      "isActive": true
    }
  ]
}
```

---

## 📚 Additional Resources

### Swagger Documentation

Interactive API documentation available at:
```
http://localhost:5000/api/docs
```

### Postman Collection

Import the API collection for testing:
```
/docs/api/SkyrakSys-HRM-API.postman_collection.json
```

### Rate Limiting

If you exceed rate limits, you'll receive:
```json
{
  "success": false,
  "message": "Too many requests, please try again later."
}
```

Headers included:
```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1698426000
```

---

**Next**: [Security Guide](./04-SECURITY_GUIDE.md)
