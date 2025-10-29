# Modern Weekly Timesheet - Developer Quick Reference

## Component Location
```
frontend/src/components/features/timesheet/ModernWeeklyTimesheet.js
```

## Route
```javascript
/timesheets - Main timesheet interface (role-based tabs)
/timesheets/week/:weekStart - Specific week view

// Legacy routes (auto-redirect to /timesheets)
/timesheet-management
/add-timesheet
/weekly-timesheet
/timesheet-history
/timesheet-manager
```

## Import
```javascript
import ModernWeeklyTimesheet from './components/features/timesheet/ModernWeeklyTimesheet';

// Or from index
import { ModernWeeklyTimesheet } from './components/features/timesheet';
```

## Features by Role

### Employee
- **Tab 0: My Timesheet**
  - Weekly entry (Monday-Sunday)
  - Project/task selection
  - Hour entry (0.25 increments)
  - Save draft
  - Submit for approval
  - Week navigation
  - Auto-save

- **Tab 2: History**
  - View all submitted timesheets
  - See approval status
  - View details of past weeks

### Manager / Admin
- **Tab 0: My Timesheet** (same as employee)
- **Tab 1: Pending Approvals**
  - View all submitted timesheets
  - Approve with comments
  - Reject with comments
  - View employee details
- **Tab 2: History** (same as employee)

## State Management

### Key State Variables
```javascript
activeTab         // Current tab (0: Entry, 1: Approvals, 2: History)
currentWeek       // Selected week (dayjs object)
tasks             // Array of timesheet entries
timesheetStatus   // 'draft' | 'submitted' | 'approved' | 'rejected'
isReadOnly        // Lock editing for submitted timesheets
loading           // Data loading state
saving            // Save operation in progress
submitting        // Submit operation in progress
pendingTimesheets // Manager view: pending approvals
historyTimesheets // All historical timesheets
```

## API Calls

### Employee Operations
```javascript
// Load timesheet for specific week
timesheetService.getByDateRange(weekStart, weekEnd)

// Save draft or submit
timesheetService.createBatch(timesheetData)

// Load history
timesheetService.getAll()
```

### Manager Operations
```javascript
// Get pending approvals
timesheetService.getPending()

// Approve/reject
timesheetService.updateStatus(id, 'approved'|'rejected', comments)
```

### Reference Data
```javascript
ProjectDataService.getAll()  // Load projects
TaskDataService.getAll()     // Load tasks
```

## Data Format

### Timesheet Entry (UI State)
```javascript
{
  id: number,
  projectId: string,
  taskId: string,
  hours: {
    monday: string,
    tuesday: string,
    wednesday: string,
    thursday: string,
    friday: string,
    saturday: string,
    sunday: string
  },
  notes: string
}
```

### Timesheet Submission (API Format)
```javascript
{
  projectId: string,
  taskId: string,
  weekStartDate: 'YYYY-MM-DD',
  monday: number,
  tuesday: number,
  wednesday: number,
  thursday: number,
  friday: number,
  saturday: number,
  sunday: number,
  notes: string,
  status: 'draft' | 'submitted'
}
```

## Validation Rules

```javascript
// Required fields
✅ projectId - Must select a project
✅ taskId - Must select a task
✅ At least one day must have hours > 0

// Hour constraints
✅ Must be valid number
✅ Cannot be negative
✅ Cannot exceed 24 per day
✅ Minimum 0.25 per entry
```

## Helper Functions

### Calculations
```javascript
calculateDayTotal(day)      // Sum hours for specific day across all tasks
calculateTaskTotal(task)    // Sum hours for specific task across all days
calculateWeekTotal()        // Total hours for entire week
```

### Navigation
```javascript
goToPreviousWeek()          // Navigate to previous week
goToNextWeek()              // Navigate to next week
goToCurrentWeek()           // Jump to current week
```

### Status
```javascript
getStatusConfig(status)     // Returns color, label, icon for status chip
```

## Component Structure

```
ModernWeeklyTimesheet
├── Header
│   ├── Title & description
│   └── Refresh button
│
├── Tabs
│   ├── Tab 0: My Timesheet
│   ├── Tab 1: Pending Approvals (manager/admin only)
│   └── Tab 2: History
│
├── Tab 0: Timesheet Entry
│   ├── Week Navigation
│   │   ├── Previous/Next buttons
│   │   ├── Week number & date range
│   │   └── "Today" button
│   │
│   ├── Status Alert (if read-only)
│   │
│   ├── Timesheet Table
│   │   ├── Project column (dropdown)
│   │   ├── Task column (dropdown)
│   │   ├── 7 day columns (input fields)
│   │   ├── Total column (calculated)
│   │   ├── Notes column (text field)
│   │   └── Delete button
│   │
│   ├── Daily Totals Row
│   │
│   ├── Add Task Button
│   │
│   └── Action Buttons
│       ├── Save Draft
│       └── Submit for Approval
│
├── Tab 1: Pending Approvals (Manager/Admin)
│   ├── Pending Timesheets Table
│   │   ├── Employee (with avatar)
│   │   ├── Week range
│   │   ├── Total hours
│   │   ├── Submitted date
│   │   ├── Status chip
│   │   └── Actions
│   │       ├── View Details
│   │       ├── Approve
│   │       └── Reject
│   │
│   └── Approval Dialog
│       ├── Comments field
│       └── Approve/Reject buttons
│
├── Tab 2: History
│   ├── History Table
│   │   ├── Week range
│   │   ├── Total hours
│   │   ├── Submitted date
│   │   ├── Status chip
│   │   └── View Details button
│   │
│   └── View Details Dialog
│       ├── Employee info
│       ├── Week range
│       ├── Status
│       ├── Daily breakdown
│       └── Notes
│
└── Dialogs
    ├── Approval Dialog (approve/reject with comments)
    └── View Details Dialog (detailed timesheet view)
```

## Styling

Uses Material-UI v5 components with theme integration:
- Paper elevation: 0 with borders for modern flat design
- Primary color for emphasis
- Grey tones for subtle elements
- Status colors: success (green), warning (orange), error (red)
- Consistent spacing (padding, margins)
- Hover effects on rows
- Smooth transitions

## Error Handling

```javascript
try {
  // API call
  await timesheetService.something();
  showSuccess('Success message');
} catch (error) {
  console.error('Context:', error);
  showError('User-friendly message');
}
```

## Best Practices

### When to Use
✅ Weekly time tracking
✅ Project-based hour logging
✅ Manager approval workflows
✅ Historical timesheet viewing

### Performance
- Lazy loaded (React.lazy)
- Wrapped in Suspense with loading fallback
- Wrapped in ErrorBoundary for resilience
- Efficient re-renders (careful state management)

### Accessibility
- Semantic HTML structure
- ARIA labels on buttons
- Keyboard navigation support
- Color contrast compliance
- Screen reader friendly

## Common Tasks

### Add a new field to timesheet entry
1. Update task state object
2. Add input field in table row
3. Update updateTask() handler
4. Update validation logic
5. Update API transformation

### Modify validation rules
1. Update validateTimesheet() function
2. Add error messages to fieldErrors state
3. Display errors in UI

### Add new tab
1. Add tab to Tabs component
2. Create render function (e.g., renderNewTab())
3. Add tab content in main render
4. Update useEffect to load data for new tab

### Customize status colors
Update getStatusConfig() function with new colors/icons

### Add export functionality
1. Create export function (Excel/PDF)
2. Add export button to UI
3. Integrate with backend export endpoint

## Testing

### Manual Testing Checklist
- [ ] Create new timesheet
- [ ] Add/delete rows
- [ ] Save draft
- [ ] Submit for approval
- [ ] Manager approval
- [ ] View history
- [ ] Week navigation
- [ ] Validation (negative, >24h, required fields)
- [ ] Legacy routes redirect correctly

### Unit Testing (Future)
```javascript
// Test calculations
describe('Calculations', () => {
  it('should calculate day total correctly', () => {
    // Test calculateDayTotal()
  });
  
  it('should calculate week total correctly', () => {
    // Test calculateWeekTotal()
  });
});

// Test validation
describe('Validation', () => {
  it('should reject negative hours', () => {
    // Test validateTimesheet()
  });
});
```

## Troubleshooting

### Timesheet not loading
- Check backend API is running (port 5000)
- Check browser console for errors
- Verify employee has valid employeeId
- Check network tab for API responses

### Validation errors
- Check fieldErrors state
- Console log validation results
- Verify validation rules match backend

### Approval not working
- Verify user has manager/admin role
- Check API endpoint permissions
- Verify timesheet status is 'submitted'

### Week navigation issues
- Check dayjs plugins are loaded (weekday, isoWeek)
- Verify currentWeek state updates
- Check date format (YYYY-MM-DD for API)

## Related Files

```
frontend/src/
├── components/features/timesheet/
│   ├── ModernWeeklyTimesheet.js ⭐ Main component
│   ├── index.js (exports)
│   ├── TimesheetManagement.js (legacy - can be deleted)
│   ├── WeeklyTimesheet.js (legacy - can be deleted)
│   └── TimesheetHistory.js (legacy - can be deleted)
│
├── services/
│   ├── timesheet.service.js (API calls)
│   ├── ProjectService.js (project data)
│   └── TaskService.js (task data)
│
├── contexts/
│   ├── AuthContext.js (user, roles)
│   └── NotificationContext.js (toast messages)
│
├── App.js (routes)
└── components/layout/Layout.js (navigation menu)
```

## Deployment Checklist

Before deploying to production:
- [ ] Test all roles (employee, manager, admin)
- [ ] Test on different browsers
- [ ] Test on mobile/tablet
- [ ] Verify API endpoints work
- [ ] Check loading states
- [ ] Verify error handling
- [ ] Test legacy route redirects
- [ ] Update documentation
- [ ] Run build: `npm run build`
- [ ] Check build size

## Support & Documentation

- Component doc: This file
- API docs: See backend/README.md
- Full consolidation report: TIMESHEET_CONSOLIDATION_COMPLETE.md
- Overall project: README.md

---

**Version**: 1.0.0  
**Last Updated**: 2025  
**Maintained By**: Development Team  
**Status**: ✅ Production Ready
