# SkyRakSys HRM System - Backend

A comprehensive Human Resources Management System backend built with Node.js, Express, and PostgreSQL.

## Features

- **Employee Management**: Complete employee lifecycle management
- **Leave Management**: Leave requests, approvals, and balance tracking
- **Timesheet Management**: Time tracking and approval workflows
- **Payroll Management**: Automated payroll processing and payslip generation
- **Authentication & Authorization**: JWT-based auth with role-based access control
- **RESTful API**: Well-documented REST API endpoints

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi
- **Security**: Helmet, bcryptjs, rate limiting
- **Logging**: Winston

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Create a `.env` file in the backend directory:

```env
# Environment
NODE_ENV=development
PORT=8080

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skyraksys_hrm_dev
DB_USER=postgres
DB_PASSWORD=password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Database Setup

#### Option A: Automatic Setup (Windows)
Run the setup script from the project root:
```bash
setup-database.bat
```

#### Option B: Manual Setup

1. Create PostgreSQL database:
```sql
CREATE DATABASE skyraksys_hrm_dev;
```

2. Run database synchronization:
```bash
npm run dev
```
The server will automatically sync the database schema on first run.

3. Seed initial data:
```bash
npx sequelize-cli db:seed:all
```

### 4. Start the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:8080`

## API Documentation

### Base URL
```
http://localhost:8080/api
```

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | User login |
| POST | `/auth/register` | User registration |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | User logout |
| GET | `/auth/profile` | Get user profile |
| PUT | `/auth/profile` | Update user profile |
| PUT | `/auth/change-password` | Change password |

### Employee Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/employees` | Get all employees | All |
| GET | `/employees/:id` | Get employee by ID | All |
| POST | `/employees` | Create employee | Admin, HR |
| PUT | `/employees/:id` | Update employee | Admin, HR, Self |
| DELETE | `/employees/:id` | Deactivate employee | Admin, HR |
| GET | `/employees/meta/departments` | Get departments | All |
| GET | `/employees/meta/positions` | Get positions | All |
| GET | `/employees/meta/dashboard` | Get dashboard stats | All |

### Leave Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/leaves` | Get leave requests | All |
| GET | `/leaves/:id` | Get leave request by ID | All |
| POST | `/leaves` | Create leave request | All |
| PUT | `/leaves/:id/status` | Approve/reject leave | Manager, Admin, HR |
| PUT | `/leaves/:id/cancel` | Cancel leave request | Self |
| GET | `/leaves/balance/:employeeId?` | Get leave balance | All |
| GET | `/leaves/types` | Get leave types | All |
| GET | `/leaves/statistics` | Get leave statistics | All |

### Timesheet Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/timesheets` | Get timesheets | All |
| GET | `/timesheets/:id` | Get timesheet by ID | All |
| POST | `/timesheets` | Create timesheet | All |
| PUT | `/timesheets/:id` | Update timesheet | Self |
| PUT | `/timesheets/:id/submit` | Submit timesheet | Self |
| PUT | `/timesheets/:id/status` | Approve/reject timesheet | Manager, Admin, HR |
| DELETE | `/timesheets/:id` | Delete timesheet | Self (Draft only) |
| GET | `/timesheets/summary/:employeeId?` | Get timesheet summary | All |
| GET | `/timesheets/meta/projects` | Get projects | All |
| GET | `/timesheets/meta/projects/:id/tasks` | Get project tasks | All |

### Payroll Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/payroll` | Get payroll records | Admin, HR, Self |
| GET | `/payroll/:id` | Get payroll by ID | Admin, HR, Self |
| POST | `/payroll/generate` | Generate payroll | Admin, HR |
| PUT | `/payroll/:id/status` | Update payroll status | Admin, HR |
| GET | `/payroll/meta/dashboard` | Get payroll dashboard | Admin, HR |
| GET | `/payroll/employee/:id/summary` | Get employee payroll summary | All |

## Default Users

After running the seeders, you can login with these demo accounts:

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| Admin | admin@skyraksys.com | admin123 | System Administrator |
| HR | hr@skyraksys.com | admin123 | HR Manager |
| Manager | lead@skyraksys.com | admin123 | Team Lead/Manager |
| Employee | employee1@skyraksys.com | admin123 | Software Engineer |
| Employee | employee2@skyraksys.com | admin123 | Software Engineer |

## Role-Based Access Control

### Admin
- Full access to all modules
- Can manage all employees, leaves, timesheets, and payroll
- Can view system-wide reports and analytics

### HR
- Full access to employee management
- Can view and manage all leave requests
- Can process payroll for all employees
- Can view HR analytics and reports

### Manager
- Can view and manage subordinates' data
- Can approve/reject leave requests for team members
- Can approve/reject timesheets for team members
- Can view team analytics

### Employee
- Can view and update own profile
- Can create and cancel own leave requests
- Can create and submit own timesheets
- Can view own payslips and leave balance

## Security Features

- **Password Hashing**: bcrypt with configurable rounds
- **JWT Authentication**: Secure token-based authentication
- **Refresh Tokens**: Automatic token refresh mechanism
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Joi schema validation for all inputs
- **SQL Injection Protection**: Sequelize ORM with parameterized queries
- **CORS Protection**: Configurable CORS settings
- **Helmet**: Security headers middleware

## Database Schema

The system uses PostgreSQL with the following main entities:

- **Users**: Authentication and user roles
- **Employees**: Employee profiles and organizational data
- **Departments**: Organizational departments
- **Positions**: Job positions and roles
- **LeaveTypes**: Types of leave (sick, annual, etc.)
- **LeaveRequests**: Leave request records
- **LeaveBalances**: Employee leave balances
- **Projects**: Project management
- **Tasks**: Task assignment and tracking
- **Timesheets**: Time tracking entries
- **Payroll**: Payroll processing records
- **PayrollComponents**: Salary component breakdown
- **SalaryStructures**: Employee salary configurations

## Development Commands

```bash
# Start development server with auto-reload
npm run dev

# Run tests
npm test

# Run database migrations
npm run migrate

# Run database seeders
npm run seed

# Reset database
npm run db:reset
```

## Error Handling

The API uses consistent error response format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Field-specific error message"
    }
  ]
}
```

## Health Check

Check if the API is running:

```bash
GET /api/health
```

Response:
```json
{
  "status": "OK",
  "message": "HRM API Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

## Contributing

1. Follow the existing code style
2. Write tests for new features
3. Update documentation for API changes
4. Use meaningful commit messages

## License

This project is licensed under the MIT License.
