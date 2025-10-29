# 🔄 Functional Flows

**Version**: 2.0.0  
**Last Updated**: October 27, 2025  
**Purpose**: Document business processes and workflows

---

## 📋 Table of Contents

1. [Employee Onboarding](#employee-onboarding)
2. [Timesheet Workflow](#timesheet-workflow)
3. [Leave Request Process](#leave-request-process)
4. [Payroll Processing](#payroll-processing)
5. [Performance Management](#performance-management)

---

## 👤 Employee Onboarding

### Overview
Complete process from job offer to first day of work.

### Flow Diagram

```
┌─────────────────┐
│  Job Offer      │
│  Accepted       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  HR Creates     │
│  Employee       │
│  Record         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  System Auto    │
│  Generates:     │
│  - Employee ID  │
│  - Email Setup  │
│  - User Account │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  HR Assigns:    │
│  - Department   │
│  - Position     │
│  - Manager      │
│  - Salary       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  System         │
│  Initializes:   │
│  - Leave Balance│
│  - Access Rights│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Welcome Email  │
│  Sent with:     │
│  - Login Link   │
│  - Temp Password│
│  - Onboarding   │
│    Checklist    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Employee       │
│  First Login    │
│  - Set Password │
│  - Complete     │
│    Profile      │
└─────────────────┘
```

### Detailed Steps

#### Step 1: HR Creates Employee Record
**Actor**: HR  
**Actions**:
1. Navigate to Employees > Add Employee
2. Enter mandatory information:
   - Personal details (name, DOB, contact)
   - Employment details (hire date, type)
   - Department and position
   - Manager assignment
   - Salary structure
   - Bank details
3. Upload documents (if any)
4. Click "Create Employee"

**System Actions**:
- Validates all required fields
- Checks for duplicate email/employee ID
- Generates unique UUID
- Auto-generates employee ID (SKYT###)

#### Step 2: System Setup
**Automatic Actions**:
- Creates user account linked to employee
- Generates temporary password
- Initializes leave balance for current year:
  - Casual Leave: 12 days
  - Sick Leave: 10 days
  - Earned Leave: based on tenure
- Sets default access permissions based on role

#### Step 3: Welcome Email
**System Sends**:
```
Subject: Welcome to SkyrakSys!

Hi [Name],

Welcome to SkyrakSys! Your account has been created.

Employee ID: SKYT###
Login URL: https://hrm.skyraksys.com
Email: [email]
Temporary Password: [password]

Please login and change your password immediately.

Next Steps:
1. Login to the system
2. Set a strong password
3. Complete your profile
4. Review leave balance
5. Contact your manager for onboarding schedule

HR Team
```

#### Step 4: Employee First Login
**Actor**: New Employee  
**Actions**:
1. Access login URL from email
2. Enter email and temporary password
3. System prompts for password change
4. Set new strong password
5. Complete profile information:
   - Update contact details
   - Add emergency contact
   - Verify bank information
6. Review assigned manager and department

**Completion**: Employee is now onboarded and can access system features.

---

## ⏰ Timesheet Workflow

### Overview
Weekly timesheet submission and approval process.

### Flow Diagram

```
┌──────────────┐
│  Employee    │
│  Logs Hours  │
│  (Draft)     │
└──────┬───────┘
       │
       ▼
┌──────────────┐       ┌──────────────┐
│  Employee    │──No──>│  Save as     │
│  Submits?    │       │  Draft       │
└──────┬───────┘       └──────────────┘
       │ Yes
       ▼
┌──────────────┐
│  Validation  │
│  - Hours > 0 │
│  - Project   │
│    Valid     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Status:     │
│  Submitted   │
│  Notify      │
│  Manager     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Manager     │
│  Reviews     │
└──────┬───────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌──────────┐      ┌──────────┐
│ Approve  │      │ Reject   │
└────┬─────┘      └────┬─────┘
     │                 │
     │                 ▼
     │          ┌──────────┐
     │          │ Notify   │
     │          │ Employee │
     │          │ Resubmit │
     │          └──────────┘
     │
     ▼
┌──────────────┐
│  Approved    │
│  Hours       │
│  Recorded    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Used for:   │
│  - Billing   │
│  - Reports   │
│  - Analytics │
└──────────────┘
```

### Detailed Steps

#### Step 1: Employee Creates Timesheet
**Actor**: Employee  
**Frequency**: Weekly  
**Actions**:
1. Navigate to Timesheets > Add Timesheet
2. Select week start date (Monday)
3. Select project and task
4. Enter hours for each day:
   - Monday through Friday: 0-24 hours
   - Weekend: optional
5. Add description of work done
6. Save as draft or submit

**Business Rules**:
- Week must start on Monday
- Can create multiple entries for different projects in same week
- Cannot create duplicate (same week, project, task)
- Hours must be between 0-24 per day
- Total hours calculated automatically

#### Step 2: Employee Submits Timesheet
**Actor**: Employee  
**Trigger**: When ready for approval  
**Actions**:
1. Review all draft timesheets
2. Verify hours and descriptions
3. Click "Submit for Approval"

**System Validations**:
- Total hours > 0
- All required fields filled
- Week is not in future
- Project/task are active

**System Actions**:
- Changes status from "Draft" to "Submitted"
- Records submission timestamp
- Sends notification to manager
- Locks timesheet from editing

#### Step 3: Manager Reviews
**Actor**: Manager  
**Actions**:
1. Receives notification of pending timesheet
2. Navigates to Timesheets > Pending Approvals
3. Reviews timesheet details:
   - Employee name and ID
   - Week period
   - Project and task
   - Hours per day
   - Total hours
   - Description
4. Verifies against:
   - Project deadlines
   - Expected deliverables
   - Team availability
5. Makes decision: Approve or Reject

#### Step 4: Approval/Rejection
**If Approved**:
- Manager clicks "Approve"
- Can add approval comments
- System:
  - Updates status to "Approved"
  - Records approver and timestamp
  - Notifies employee
  - Timesheet is now final

**If Rejected**:
- Manager clicks "Reject"
- Must add rejection reason
- System:
  - Updates status to "Rejected"
  - Records rejection details
  - Notifies employee with reason
  - Employee can edit and resubmit

#### Step 5: Reporting
**Uses of Approved Timesheets**:
- Client billing (billable hours)
- Project progress tracking
- Resource utilization reports
- Productivity analytics
- Payroll processing (if applicable)

---

## 🏖️ Leave Request Process

### Overview
Employee leave application and approval workflow.

### Flow Diagram

```
┌──────────────┐
│  Employee    │
│  Applies for │
│  Leave       │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  System      │
│  Validates:  │
│  - Balance   │
│  - Dates     │
│  - Overlaps  │
└──────┬───────┘
       │
       ├──────────────┐
       │ Valid        │ Invalid
       │              ▼
       │         ┌─────────┐
       │         │  Error  │
       │         │  Message│
       │         └─────────┘
       │
       ▼
┌──────────────┐
│  Leave       │
│  Request     │
│  Created     │
│  Status:     │
│  Pending     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Notify      │
│  Manager     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Manager     │
│  Reviews     │
│  - Dates     │
│  - Balance   │
│  - Team      │
│    Impact    │
└──────┬───────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌──────────┐      ┌──────────┐
│ Approve  │      │ Reject   │
└────┬─────┘      └────┬─────┘
     │                 │
     ▼                 ▼
┌──────────┐      ┌──────────┐
│ Deduct   │      │ Notify   │
│ from     │      │ Employee │
│ Balance  │      └──────────┘
└────┬─────┘
     │
     ▼
┌──────────┐
│ Add to   │
│ Calendar │
└────┬─────┘
     │
     ▼
┌──────────┐
│ Notify   │
│ Employee │
│ & Team   │
└──────────┘
```

### Detailed Steps

#### Step 1: Employee Applies for Leave
**Actor**: Employee  
**Actions**:
1. Navigate to Leaves > Apply Leave
2. Select leave type:
   - Casual Leave
   - Sick Leave
   - Earned Leave
   - Unpaid Leave
3. Choose dates:
   - Start date
   - End date
   - If single day and half-day: select period (First/Second Half)
4. Enter reason for leave
5. Review calculated:
   - Total days (working days only)
   - Current balance
   - Balance after leave
6. Submit application

**System Validations**:
```javascript
// Validation checks
- startDate >= today (cannot apply for past dates)
- endDate >= startDate
- Dates don't overlap with existing approved leaves
- Sufficient leave balance available
- Leave type is active
- Maximum leave duration not exceeded
```

#### Step 2: System Processing
**Automatic Calculations**:
```javascript
// Calculate working days
totalDays = calculateWorkingDays(startDate, endDate);
// Exclude weekends and public holidays
if (isHalfDay) {
  totalDays = 0.5;
}

// Check balance
availableBalance = currentBalance - pendingLeaves;
if (totalDays > availableBalance) {
  throw new Error('Insufficient leave balance');
}
```

**System Actions**:
- Creates leave request record
- Status set to "Pending"
- Sends notification to manager
- Marks dates as "pending leave" in calendar

#### Step 3: Manager Reviews Request
**Actor**: Manager  
**Considerations**:
1. **Employee Leave Balance**: Verify sufficient balance
2. **Team Coverage**: Check if team can manage workload
3. **Project Deadlines**: Review impact on project timelines
4. **Leave Pattern**: Check for suspicious patterns
5. **Previous Leaves**: Review leave history

**Actions**:
1. Navigate to Leaves > Team Requests
2. Open pending leave request
3. Review details
4. Check team calendar for other leaves
5. Make decision

#### Step 4: Approval Decision

**If Approved**:
1. Manager clicks "Approve"
2. Optional: Add approval comments
3. System:
   ```javascript
   - Updates status to "Approved"
   - Deducts days from leave balance
   - Records approver and timestamp
   - Adds to team calendar
   - Sends confirmation to employee
   - Notifies team members (optional)
   ```

**If Rejected**:
1. Manager clicks "Reject"
2. **Must** add rejection reason
3. System:
   ```javascript
   - Updates status to "Rejected"
   - No balance deduction
   - Records rejection details
   - Sends notification to employee with reason
   - Removes from pending calendar
   ```

#### Step 5: Post-Approval
**Leave Period**:
- Dates appear on team calendar
- System marks employee as "On Leave" during period
- Auto-responder can be set (if email integration exists)

**After Leave**:
- Employee returns to work
- Leave status remains "Approved" in history
- Balance shows deducted amount

---

## 💰 Payroll Processing

### Overview
Monthly salary processing and payslip generation.

### Flow Diagram

```
┌──────────────┐
│  Month End   │
│  Trigger     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  HR Initiates│
│  Payroll     │
│  Generation  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  System      │
│  Collects:   │
│  - Attendance│
│  - Leaves    │
│  - Timesheets│
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Calculate   │
│  for Each    │
│  Employee    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Gross       │
│  Salary      │
│  Calculation │
│  - Basic     │
│  - HRA       │
│  - Allowances│
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Deductions  │
│  - PF (12%)  │
│  - PT        │
│  - TDS       │
│  - Absent    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Net Salary  │
│  = Gross -   │
│    Deductions│
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  HR Reviews  │
│  Payroll     │
│  Data        │
└──────┬───────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌──────────┐      ┌──────────┐
│ Approve  │      │ Reject & │
│          │      │ Regenerate│
└────┬─────┘      └──────────┘
     │
     ▼
┌──────────────┐
│  Generate    │
│  Payslips    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Email       │
│  Payslips to │
│  Employees   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Process     │
│  Bank        │
│  Transfer    │
└──────────────┘
```

### Detailed Steps

#### Step 1: Initiate Payroll Generation
**Actor**: HR  
**Timing**: 1st-3rd of each month (for previous month)  
**Actions**:
1. Navigate to Payroll > Generate Payroll
2. Select:
   - Pay period start date (e.g., Oct 1)
   - Pay period end date (e.g., Oct 31)
   - Pay date (e.g., Nov 5)
3. Select employees:
   - All employees
   - Or specific employees/departments
4. Click "Generate Payroll"

#### Step 2: System Calculations

**For Each Employee**:

**A. Fetch Data**:
```javascript
// Get employee salary structure
const salaryStructure = {
  basicSalary: 50000,
  hra: 25000,         // 50% of basic
  conveyance: 1600,   // Fixed
  specialAllowance: 23400
};

// Get attendance data
const attendance = {
  workingDays: 26,    // Total working days in month
  presentDays: 24,    // Days present
  absentDays: 2,      // Days absent
  paidLeaves: 2       // Approved paid leaves taken
};
```

**B. Calculate Gross Salary**:
```javascript
grossSalary = basicSalary + hra + conveyance + specialAllowance;
// Example: 50000 + 25000 + 1600 + 23400 = 100,000
```

**C. Calculate Deductions**:
```javascript
// Provident Fund (12% of basic)
pfEmployee = basicSalary * 0.12;  // 6,000
pfEmployer = basicSalary * 0.12;  // 6,000 (not deducted from employee)

// ESI (if basicSalary < 21,000)
esiEmployee = basicSalary < 21000 ? grossSalary * 0.0075 : 0;

// Professional Tax (based on state slab)
professionalTax = 200;  // Fixed for Maharashtra

// TDS (based on annual income)
tds = calculateTDS(grossSalary, financialYear);

// Absent days deduction
absentDaysSalary = 0;
if (absentDays > 0) {
  perDaySalary = grossSalary / workingDays;
  absentDaysSalary = perDaySalary * absentDays;
}

// Total deductions
totalDeductions = pfEmployee + esiEmployee + professionalTax + 
                  tds + absentDaysSalary;
```

**D. Calculate Net Salary**:
```javascript
netSalary = grossSalary - totalDeductions;
// Example: 100,000 - 11,200 = 88,800
```

#### Step 3: HR Review
**Actor**: HR  
**Actions**:
1. Navigate to Payroll > Review
2. Check generated payroll records
3. Verify calculations for sample employees
4. Check for anomalies:
   - Unusually high/low salaries
   - Missing deductions
   - Calculation errors
5. Export to Excel for detailed review (optional)

**Common Checks**:
- Total company payout amount
- Individual net salaries
- Deduction totals
- Absent day calculations

#### Step 4: Approval/Regeneration

**If Corrections Needed**:
1. Click "Reject Payroll"
2. Fix issues:
   - Update employee data
   - Adjust salary components
   - Correct attendance
3. Regenerate payroll
4. Review again

**If Approved**:
1. Click "Approve Payroll"
2. System locks payroll records
3. Status changes to "Approved"
4. Payslips can now be generated

#### Step 5: Payslip Generation
**Actor**: HR  
**Actions**:
1. Navigate to Payroll > Generate Payslips
2. Select approved payroll month
3. Click "Generate All Payslips"
4. System creates PDF payslips for each employee

**Payslip Contents**:
```
======================================
      SKYRAKSYS PRIVATE LIMITED
           SALARY SLIP
        October 2025
======================================

Employee ID  : SKYT001
Name         : John Doe
Designation  : Software Engineer
Department   : Engineering
Bank Account : ****5678
PAN Number   : ABCDE1234F

Working Days : 26
Present Days : 24
Absent Days  : 2
Paid Leaves  : 2

--------------------------------------
EARNINGS                      AMOUNT
--------------------------------------
Basic Salary              50,000.00
HRA                       25,000.00
Conveyance                 1,600.00
Special Allowance         23,400.00
--------------------------------------
GROSS SALARY             100,000.00
--------------------------------------

DEDUCTIONS                    AMOUNT
--------------------------------------
Provident Fund             6,000.00
Professional Tax             200.00
TDS                        5,000.00
--------------------------------------
TOTAL DEDUCTIONS          11,200.00
--------------------------------------

NET SALARY                88,800.00
--------------------------------------
In Words: Eighty Eight Thousand Eight 
         Hundred Rupees Only
======================================
```

#### Step 6: Distribution
**Actions**:
1. System emails payslips to employees
2. Employees can view/download from portal:
   - Payroll > My Payslips
3. Archive payslips for future reference

#### Step 7: Bank Transfer (External)
**HR Action** (Outside System):
1. Generate bank transfer file
2. Upload to bank portal
3. Process salary transfer
4. Update payment status in system

---

## 📊 Performance Management

### Overview
Employee performance review cycle (if implemented).

### Annual Review Cycle

```
┌──────────────┐
│  Goal        │
│  Setting     │
│  (Jan)       │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Mid-Year    │
│  Review      │
│  (Jun)       │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Annual      │
│  Review      │
│  (Dec)       │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Rating &    │
│  Increment   │
│  (Jan)       │
└──────────────┘
```

### Process Steps

1. **Goal Setting** (Manager + Employee)
   - Define annual objectives
   - Set KPIs and metrics
   - Agree on success criteria

2. **Continuous Feedback** (Throughout Year)
   - Regular 1-on-1 meetings
   - Project milestone reviews
   - Skill development tracking

3. **Mid-Year Review** (June)
   - Progress assessment
   - Goal adjustment if needed
   - Development plan update

4. **Annual Review** (December)
   - Complete performance evaluation
   - Rate against objectives
   - Manager provides feedback
   - Employee self-assessment

5. **Ratings & Increments** (January)
   - Final rating assigned
   - Salary increment decided
   - Promotion decisions
   - New goals for upcoming year

---

**Next**: [Deployment Guide](./08-DEPLOYMENT_GUIDE.md)
