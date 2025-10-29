# Leave Balance Fields - Complete Guide

## Understanding Leave Balance Fields

### Field Definitions

#### 1. **Total Allocated** (Display Field)
- **What it is:** Total leave days available to the employee
- **Formula:** `totalAccrued + carryForward`
- **Example:** 20 days (current year) + 5 days (carried forward) = **25 days total**
- **Display:** Shows as "25.0 days" with breakdown "(20 + 5 CF)"

#### 2. **totalAccrued** (Database Field)
- **What it is:** Leave days allocated for the current year only
- **Source:** Set by HR/Admin at year start or during onboarding
- **Example:** Annual Leave = 20 days, Sick Leave = 12 days
- **Editable:** Yes, by Admin/HR
- **Default:** Based on company policy and leave type

#### 3. **carryForward** (Database Field)
- **What it is:** Unused leave days from previous year
- **Source:** Calculated automatically at year-end or set manually
- **Example:** Employee had 25 days, used 20, so 5 days carry forward
- **Editable:** Yes, by Admin/HR
- **Rules:** May have max limit (e.g., max 10 days CF depending on leave type)

#### 4. **Taken** (totalTaken)
- **What it is:** Leave days actually used/approved
- **Source:** Calculated from approved leave requests
- **Example:** Employee took 3 vacation days in March = 3 days taken
- **Display:** Orange/warning color
- **Updates:** Automatically when leave requests are approved

#### 5. **Pending** (totalPending)
- **What it is:** Leave days in requests awaiting approval
- **Source:** Calculated from pending leave requests
- **Example:** Employee requested 2 days next week = 2 days pending
- **Display:** Blue/info color
- **Updates:** Automatically when leave requests submitted/approved/rejected

#### 6. **Available** (balance)
- **What it is:** Remaining leave days employee can use
- **Formula:** `(totalAccrued + carryForward) - totalTaken - totalPending`
- **Example:** (20 + 5) - 8 - 2 = **15 days available**
- **Display:** 
  - 🟢 Green chip: > 10 days (healthy balance)
  - 🟡 Yellow chip: 5-10 days (moderate)
  - 🔴 Red chip: < 5 days (low - needs attention)

---

## Example Scenarios

### Scenario 1: New Employee
```
totalAccrued:    20 days  (annual allocation)
carryForward:     0 days  (new employee, nothing to carry)
----------------------------------------
Total Allocated: 20 days

totalTaken:       0 days  (hasn't taken leave yet)
totalPending:     0 days  (no requests pending)
----------------------------------------
Available:       20 days  (🟢 Green - full balance)
```

### Scenario 2: Mid-Year Employee
```
totalAccrued:    20 days  (annual allocation)
carryForward:     5 days  (brought forward from last year)
----------------------------------------
Total Allocated: 25 days  (20 + 5 CF)

totalTaken:       8 days  (used in Jan-May)
totalPending:     2 days  (requested for June)
----------------------------------------
Available:       15 days  (🟢 Green - good balance)
```

### Scenario 3: Employee Near Leave Limit
```
totalAccrued:    20 days  (annual allocation)
carryForward:     3 days  (brought forward)
----------------------------------------
Total Allocated: 23 days  (20 + 3 CF)

totalTaken:      15 days  (used Jan-Oct)
totalPending:     3 days  (requested for Nov)
----------------------------------------
Available:        5 days  (🟡 Yellow - moderate balance)
```

### Scenario 4: Employee with Low Balance
```
totalAccrued:    12 days  (sick leave allocation)
carryForward:     0 days  (no carry forward)
----------------------------------------
Total Allocated: 12 days

totalTaken:       9 days  (already used most)
totalPending:     1 day   (one day pending)
----------------------------------------
Available:        2 days  (🔴 Red - low balance warning!)
```

---

## UI Display Changes

### Before (Confusing)
```
| Employee  | Type | Accrued | Carry Fwd | Taken | Pending | Balance |
|-----------|------|---------|-----------|-------|---------|---------|
| John Doe  | AL   | 20 days | 5 days    | 8 days| 2 days  | 15 days |
```
**Problem:** Users had to mentally add Accrued + Carry Forward

### After (Clear)
```
| Employee  | Type | Total Allocated  | Taken | Pending | Available |
|-----------|------|------------------|-------|---------|-----------|
| John Doe  | AL   | 25.0 days       | 8 days| 2 days  | 《15 days》|
|           |      | (20 + 5 CF)      |       |         |  Green    |
```
**Benefit:** Shows total at a glance with breakdown in smaller text

---

## Edit Mode Behavior

### When Admin Clicks "Edit" Button:

**Display Changes To:**
```
Total Allocated:
  ┌─────────────────────┐
  │ Allocated:  [20.0] │  ← Can edit current year allocation
  └─────────────────────┘
  ┌─────────────────────┐
  │ Carry Fwd:  [ 5.0] │  ← Can edit carry forward separately
  └─────────────────────┘
```

**Why separate fields in edit mode?**
- Admin needs control over both components
- Allocated = company policy for this year
- Carry Forward = manual adjustment from previous year

---

## Bulk Initialize Dialog

When using "Bulk Initialize" for all employees:

```
┌──────────────────────────────────────┐
│ 👥 Bulk Initialize Leave Balances   │
├──────────────────────────────────────┤
│ Set allocations for year 2025       │
│                                      │
│ Annual Leave (days)    [  20  ]     │
│ Sick Leave (days)      [  12  ]     │
│ Personal Leave (days)  [   5  ]     │
│                                      │
│ Note: This sets totalAccrued only   │
│ Carry forward must be set manually  │
└──────────────────────────────────────┘
```

**What happens:**
- Sets `totalAccrued` for all active employees
- Sets `carryForward` to 0 (for new year)
- Only creates balances if they don't exist
- Skips employees who already have balances

---

## Create Individual Balance Dialog

```
┌──────────────────────────────────────┐
│ ➕ Create Leave Balance              │
├──────────────────────────────────────┤
│ Employee:        [John Doe     ▼]   │
│ Leave Type:      [Annual Leave ▼]   │
│ Year:            [2025]              │
│                                      │
│ Allocated Days:  [20.0]              │ ← totalAccrued
│ Carry Forward:   [ 5.0]              │ ← carryForward
│                                      │
│ Total Available: 25.0 days           │ ← Calculated
└──────────────────────────────────────┘
```

**Fields:**
- **Allocated Days** = Current year's allocation (totalAccrued)
- **Carry Forward** = Days from previous year
- **Total Available** = Auto-calculated sum (display only)

---

## Business Rules

### 1. Carry Forward Rules
```javascript
// Example policy
if (leaveType.carryForward === true) {
  // Allow carry forward
  if (leaveType.maxCarryForwardDays > 0) {
    carryForward = Math.min(previousYearUnused, maxCarryForwardDays);
  } else {
    carryForward = previousYearUnused; // No limit
  }
} else {
  carryForward = 0; // No carry forward allowed
}
```

### 2. Leave Request Validation
```javascript
// When employee requests leave
const requestedDays = calculateDays(startDate, endDate);
const available = (totalAccrued + carryForward) - totalTaken - totalPending;

if (requestedDays > available) {
  throw new Error(`Insufficient balance. Available: ${available} days`);
}
```

### 3. Year-End Process
```javascript
// At end of year (automated job)
const unused = (totalAccrued + carryForward) - totalTaken;

// Create next year's balance
createBalance({
  year: currentYear + 1,
  totalAccrued: leaveType.maxDaysPerYear, // Fresh allocation
  carryForward: calculateCarryForward(unused, leaveType),
  totalTaken: 0,
  totalPending: 0
});
```

---

## API Endpoints

### GET `/api/admin/leave-balances`
**Response:**
```json
{
  "success": true,
  "data": {
    "balances": [
      {
        "id": "uuid",
        "year": 2025,
        "totalAccrued": 20.0,
        "carryForward": 5.0,
        "totalTaken": 8.0,
        "totalPending": 2.0,
        "balance": 15.0,
        "employee": { "firstName": "John", "lastName": "Doe" },
        "leaveType": { "name": "Annual Leave" }
      }
    ]
  }
}
```

### POST `/api/admin/leave-balances`
**Request:**
```json
{
  "employeeId": "uuid",
  "leaveTypeId": "uuid",
  "year": 2025,
  "totalAccrued": 20.0,
  "carryForward": 5.0
}
```

### POST `/api/admin/leave-balances/bulk/initialize`
**Request:**
```json
{
  "year": 2025,
  "leaveAllocations": {
    "annual-leave-id": 20,
    "sick-leave-id": 12,
    "personal-leave-id": 5
  }
}
```

---

## Summary

### Key Concepts
1. **Total Allocated** = What employee gets (Allocated + Carry Forward)
2. **Taken** = What they've used (approved leaves)
3. **Pending** = What they've requested (waiting approval)
4. **Available** = What they can still use (Total - Taken - Pending)

### Benefits of This Approach
✅ Clear at-a-glance totals  
✅ Breakdown available when needed  
✅ Separate control over allocation and carry forward  
✅ Automatic calculations prevent errors  
✅ Color-coded status for quick identification  
✅ Historical tracking (year field)  

### Best Practices
1. Set `totalAccrued` based on company policy
2. Calculate `carryForward` automatically at year-end
3. Let `totalTaken` and `totalPending` update automatically
4. Monitor employees with low `balance` (< 5 days)
5. Audit carry forward limits per leave type
6. Generate reports at fiscal year end

---

**Updated:** October 25, 2025  
**Component:** LeaveBalanceModern.js  
**Feature:** Simplified leave balance display with total allocated field
