
# 🧾 Human Resources Management (HRM) System – Module Overview

This document outlines the architecture and data structure of a simplified Human Resources Management (HRM) system. It includes four primary modules:

1. **Employee Management**
2. **Leave Management**
3. **Timesheet Management**
4. **Payslip Management**

---

## 1. 👥 Employee Management

This module serves as the central repository of employee information and organizational structure.

### 🔹 Employee Profile

Stores fundamental and statutory information for each employee.

* **Fields:**

  * `employeeId` (Primary Key)
  * `firstName`
  * `lastName`
  * `email`
  * `phone`
  * `hireDate`
  * `department`
  * `position`
  * `status` (e.g., Active, On Leave)

### 🔹 Statutory Details (India-specific)

Ensures compliance with statutory laws.

* **Fields:**

  * `aadhaarNumber`
  * `panNumber`
  * `uanNumber`

### 🔹 Organizational Structure

Separate lookup tables ensure referential integrity.

* `Departments`: List of all departments.
* `Positions`: List of job roles or titles.
* `ManagerId`: A foreign key in the employee table that establishes reporting hierarchy.

---

## 2. 🗓️ Leave Management

Manages employee leave requests, approval workflows, and leave balances.

### 🔹 Leave Requests

Captures each leave application with complete lifecycle tracking.

* **Fields:**

  * `id` (Primary Key)
  * `employeeId`
  * `leaveType` (e.g., Sick, Vacation)
  * `startDate`
  * `endDate`
  * `totalDays`
  * `reason`
  * `status` (Pending, Approved, Rejected)
  * `approvedBy`
  * `approvedAt`

### 🔹 Leave Balances

Tracks accrual and consumption of leave days.

* **Fields:**

  * `employeeId`
  * `leaveType`
  * `totalAccrued`
  * `totalTaken`
  * `balance`

Leave balances update automatically upon approval of a leave request.

---

## 3. ⏱️ Timesheet Management

Enables tracking of work hours for task/project-level reporting and approval.

### 🔹 Timesheet Entries

Daily logs of employee work hours.

* **Fields:**

  * `id` (Primary Key)
  * `employeeId`
  * `workDate`
  * `hoursWorked`
  * `project`
  * `task`
  * `description`
  * `status` (DRAFT, SUBMITTED, APPROVED)

### 🔹 Supporting Tables

* `Projects`: Reference list of all active projects.
* `Tasks`: Reference list of tasks within projects.

---

## 4. 💵 Payslip Management

Automates monthly salary processing and payslip generation.

### 🔹 Payslip Record

Stores summary of an employee’s salary for a given month.

* **Fields:**

  * `payslipId`
  * `employeeId`
  * `month`
  * `year`
  * `paymentDate`
  * `totalEarnings`
  * `totalDeductions`
  * `netSalary`

### 🔹 Detailed Salary Breakdown

Linked detail tables provide transparency.

* `PayslipEarnings`: Contains components like Basic, HRA, and other allowances.
* `PayslipDeductions`: Contains deductions like PF, TDS, PT, and LOP (Loss of Pay).

### 🔹 Salary Structure

* Stores fixed monthly salary components for each employee.
* Used as the basis for monthly payroll and payslip calculation.

---

### ✅ Summary

This HRM system provides a modular and scalable foundation for managing employee lifecycle operations—from onboarding to payroll—with support for Indian statutory compliance and project-level tracking.

---

## 🚀 Proposed Architecture & Technology Stack

This section outlines the recommended technical architecture for building a robust, scalable, and maintainable HRM system.

### 🔹 Architecture Principles

*   **Modular & Service-Oriented:** The system will be designed with a service-oriented architecture (SOA) where each module (Employee, Leave, etc.) is a distinct service. This promotes separation of concerns and allows for independent development and scaling.
*   **Stateless API:** The backend will expose a stateless RESTful API, ensuring that each request from the client contains all the information needed to be understood and processed.
*   **Relational Data Integrity:** A relational database will be used to enforce data consistency, relationships (e.g., manager-employee), and transactional integrity.

### 🔹 Technology Stack

*   **Backend:** **Node.js with Express.js** – A lightweight and fast framework ideal for building RESTful APIs. Its event-driven, non-blocking I/O model is well-suited for I/O-heavy applications.
*   **Frontend:** **React.js** – A popular and powerful library for building dynamic and responsive user interfaces. Its component-based architecture aligns well with our modular design.
*   **Database:** **PostgreSQL** – A robust, open-source object-relational database system known for its reliability, feature robustness, and performance.
*   **Authentication:** **JSON Web Tokens (JWT)** – A standard, secure method for handling user authentication and role-based access control (RBAC).
*   **DevOps & Deployment:** **Docker** – For containerizing the application, ensuring consistency across development, testing, and production environments. A CI/CD pipeline (e.g., using GitHub Actions) will be set up for automated builds and deployments.


📄 HRM System – Requirement Document (Simplified)
🎯 Purpose
To develop a simple Human Resource Management (HRM) system that supports employee data management, timesheet and leave tracking, payroll generation, and role-based access for HR, Managers, and Employees.

🧑‍💼 1. HR (Human Resources) – Admin Role
✅ Responsibilities:
Manage the entire organization’s employee records and structure.

Configure salary structures and payslip templates.

🔧 Functional Requirements:
Feature	Description
Employee Management	Add, edit, or deactivate employee records. Maintain personal and statutory details.
Organizational Structure	Manage departments, job positions, and reporting hierarchy.
Salary Configuration	Define monthly salary components per employee.
Payslip Template Setup	Configure earnings and deduction heads (e.g., Basic, HRA, PF, Tax).
Payslip Generation	Generate monthly payslips for all employees with breakdowns.
View All Timesheets	Access all employee timesheet entries for payroll review.
View Leave Reports	Access leave usage reports across the organization.

👨‍💼 2. Manager – Reporting Role
✅ Responsibilities:
Supervise team tasks, approve timesheets and leaves.

🔧 Functional Requirements:
Feature	Description
Timesheet Approval	View and approve/reject submitted timesheets from team members.
Leave Approval	View and approve/reject leave requests from team members.
Project Management	Add/edit projects and tasks to be used in timesheet submissions.
Team Overview	View list and status of their direct reportees.

👨‍💻 3. Employee – Self-Service Role
✅ Responsibilities:
Manage their own attendance, leave, and view payslip records.

🔧 Functional Requirements:
Feature	Description
Profile View	View own personal and job-related details.
Timesheet Submission	Submit daily/weekly work entries linked to projects and tasks.
Leave Request	Submit requests for various types of leave (e.g., Sick, Vacation).
Payslip Access	View/download monthly payslips with full breakdown.
Leave Balance View	See available leave balance by leave type.

🔐 Role-Based Access Summary
Feature	HR/Admin	Manager	Employee
Employee Management	✅	❌	🔍 (self)
Payslip Configuration	✅	❌	❌
Payslip Generation	✅	❌	🔍
Leave Approval	❌	✅	❌
Leave Request	❌	❌	✅
Timesheet Approval	❌	✅	❌
Timesheet Submission	❌	❌	✅
Project/Task Management	❌	✅	🔍
