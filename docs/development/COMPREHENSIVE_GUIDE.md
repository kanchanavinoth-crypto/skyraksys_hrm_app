# SkyRakSys HRM - Comprehensive System Guide

This document provides a detailed overview of the SkyRakSys HRM application, based on the current codebase. It covers the system's architecture, features, and setup instructions.

## 1. System Overview

SkyRakSys HRM is a full-featured Human Resource Management system designed to handle core HR functions. It consists of a Node.js/Express.js backend API and a React.js frontend application.

### Key Features:

*   **Employee Information Management:** Centralized database for all employee records.
*   **Authentication & Authorization:** Secure login with role-based access control (Admin, HR, Manager, Employee).
*   **Payroll Management:** Automated payroll processing based on defined salary structures.
*   **Leave Management:** Workflow for leave requests and approvals.
*   **Timesheet Management:** Tracking employee work hours against projects and tasks.

## 2. Technical Stack

*   **Backend:**
    *   **Framework:** Node.js, Express.js
    *   **Database:** Sequelize ORM with support for PostgreSQL and SQLite.
    *   **Authentication:** JSON Web Tokens (JWT)
    *   **Password Hashing:** bcryptjs
*   **Frontend:**
    *   **Library:** React.js
    *   **UI Components:** Material-UI
    *   **Routing:** React Router
    *   **State Management:** React Context API
    *   **HTTP Client:** Axios

## 3. Core Functionalities

### 3.1. Authentication

*   **Login:** Users authenticate with email and password.
*   **Roles:** The system supports four user roles: `admin`, `hr`, `manager`, and `employee`.
*   **Protected Routes:** Access to different parts of the application is restricted based on user roles.

### 3.2. Employee Management

*   **View Employees:** List all employees with search, filtering, and pagination.
*   **Add/Edit/Deactivate Employees:** Admins and HR can manage the complete employee lifecycle.
*   **Role-Based Views:**
    *   **Admins/HR:** Can view and manage all employees.
    *   **Managers:** Can view their direct reports.
    *   **Employees:** Can only view their own profile.

### 3.3. Leave Management

*   **Submit Requests:** Employees can submit leave requests.
*   **Approval Workflow:** Managers can approve or reject leave requests from their team members.
*   **Leave Balances:** The system tracks available leave for each employee.

### 3.4. Timesheet Management

*   **Log Hours:** Employees can log their daily work hours against specific projects and tasks.
*   **Approval Workflow:** Managers can review and approve timesheets for their team.

### 3.5. Payroll Management

*   **Salary Structures:** Define different components of an employee's salary (e.g., basic, allowances, deductions).
*   **Generate Payroll:** Admins and HR can generate monthly payroll for all active employees.
*   **View Payroll History:** Access historical payroll records.

## 4. Setup and Installation

### Prerequisites

*   Node.js (v16 or higher)
*   npm (or yarn)
*   A running instance of PostgreSQL (if not using SQLite)

### Backend Setup

1.  Navigate to the `backend` directory.
2.  Install dependencies: `npm install`
3.  Create a `.env` file by copying `.env.example`.
4.  Configure your database connection and `JWT_SECRET` in the `.env` file.
5.  Run the database migrations: `npx sequelize-cli db:migrate`
6.  (Optional) Seed the database with initial data: `npx sequelize-cli db:seed:all`
7.  Start the server: `npm start`

### Frontend Setup

1.  Navigate to the `frontend` directory.
2.  Install dependencies: `npm install`
3.  Start the development server: `npm start`
4.  The application will be available at `http://localhost:3000`.

## 5. API Endpoints

The backend provides a RESTful API for all HRM functionalities. Key endpoints include:

*   `POST /api/auth/login`: User authentication.
*   `GET /api/employees`: Fetch employees.
*   `POST /api/employees`: Create a new employee.
*   `GET /api/leave`: Fetch leave requests.
*   `POST /api/leave`: Submit a leave request.
*   `GET /api/timesheets`: Fetch timesheets.
*   `POST /api/timesheets`: Submit a timesheet.
*   `GET /api/payroll`: Fetch payroll records.
*   `POST /api/payroll/generate`: Generate payroll.

---
*This guide was generated based on an automated review of the source code.*
