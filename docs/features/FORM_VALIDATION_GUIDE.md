# Form Validation Integration Guide

## Overview
This guide explains how to use the Formik + Yup validated form components in the SkyRakSys HRM application.

## Components

### 1. ValidatedLeaveRequestForm
**Location:** `frontend/src/components/forms/ValidatedLeaveRequestForm.js`

**Purpose:** Provides client-side validation for leave request submissions with real-time feedback.

**Features:**
- Required field validation (leave type, dates, reason)
- Date logic validation (no past dates, end date after start date)
- Reason length validation (10-500 characters)
- Half-day options with conditional validation
- Visual validation summary
- Submit button disabled until form is valid

#### Usage Example

```javascript
import ValidatedLeaveRequestForm from './forms/ValidatedLeaveRequestForm';

function MyComponent() {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (values) => {
    setLoading(true);
    LeaveDataService.create(values)
      .then(response => {
        // Handle success
        console.log('Leave request created:', response.data);
      })
      .catch(error => {
        // Handle error
        console.error('Failed to create leave request:', error);
      })
      .finally(() => setLoading(false));
  };

  return (
    <ValidatedLeaveRequestForm
      onSubmit={handleSubmit}
      loading={loading}
      leaveTypes={leaveTypes}
      initialValues={{
        leaveTypeId: '',
        startDate: '',
        endDate: '',
        isStartHalfDay: false,
        isEndHalfDay: false,
        startHalfDayType: '',
        endHalfDayType: '',
        reason: ''
      }}
    />
  );
}
```

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onSubmit` | Function | Yes | Callback function called when form is submitted with valid data |
| `loading` | Boolean | No | Shows loading state on submit button |
| `leaveTypes` | Array | Yes | Array of leave type objects with `id` and `name` properties |
| `initialValues` | Object | No | Initial form values for editing existing requests |

#### Validation Schema

```javascript
{
  leaveTypeId: Yup.string()
    .required('Leave type is required')
    .uuid('Invalid leave type'),
  
  startDate: Yup.date()
    .required('Start date is required')
    .min(new Date(), 'Start date cannot be in the past'),
  
  endDate: Yup.date()
    .required('End date is required')
    .min(Yup.ref('startDate'), 'End date must be after start date'),
  
  reason: Yup.string()
    .required('Reason is required')
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason must not exceed 500 characters'),
  
  // Conditional validation for half-day fields
  startHalfDayType: Yup.string().when('isStartHalfDay', {
    is: true,
    then: Yup.string().required('Please select half day type')
  })
}
```

### 2. ValidatedEmployeeForm
**Location:** `frontend/src/components/forms/ValidatedEmployeeForm.js`

**Purpose:** Comprehensive employee data entry form with validation for personal, contact, employment, and salary information.

**Features:**
- Email format validation
- Phone number pattern validation
- Name validation (letters only, 2-50 characters)
- Employee ID validation (alphanumeric)
- Salary validation (positive number, minimum 1000)
- Date format validation
- Visual validation summary
- Responsive layout

#### Usage Example

```javascript
import ValidatedEmployeeForm from './forms/ValidatedEmployeeForm';

function AddEmployee() {
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (values) => {
    setLoading(true);
    EmployeeDataService.create(values)
      .then(response => {
        console.log('Employee created:', response.data);
      })
      .catch(error => {
        console.error('Failed to create employee:', error);
      })
      .finally(() => setLoading(false));
  };

  return (
    <ValidatedEmployeeForm
      onSubmit={handleSubmit}
      loading={loading}
      departments={departments}
      positions={positions}
      initialValues={{
        employeeId: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        gender: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        departmentId: '',
        positionId: '',
        managerId: '',
        dateOfJoining: '',
        employmentType: 'full-time',
        salary: '',
        status: 'active'
      }}
    />
  );
}
```

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onSubmit` | Function | Yes | Callback function called when form is submitted with valid data |
| `loading` | Boolean | No | Shows loading state on submit button |
| `departments` | Array | Yes | Array of department objects with `id` and `name` properties |
| `positions` | Array | Yes | Array of position objects with `id` and `name` properties |
| `initialValues` | Object | No | Initial form values for editing existing employees |

#### Validation Schema

```javascript
{
  email: Yup.string()
    .email('Invalid email format')
    .required('Email is required'),
  
  phone: Yup.string()
    .matches(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .required('Phone number is required'),
  
  firstName: Yup.string()
    .required('First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters')
    .matches(/^[a-zA-Z\s]+$/, 'First name must contain only letters'),
  
  salary: Yup.number()
    .required('Salary is required')
    .positive('Salary must be a positive number')
    .min(1000, 'Salary must be at least 1000'),
  
  // ... more validation rules
}
```

## Integration Steps

### Step 1: Install Dependencies
Ensure Formik and Yup are installed in your frontend project:

```bash
cd frontend
npm install formik yup
```

### Step 2: Import Component
Import the validated form component in your page/component:

```javascript
import ValidatedLeaveRequestForm from './forms/ValidatedLeaveRequestForm';
// or
import ValidatedEmployeeForm from './forms/ValidatedEmployeeForm';
```

### Step 3: Replace Old Form
Remove the old HTML form markup and replace with the validated component:

```javascript
// Before
<form onSubmit={handleSubmit}>
  <input name="leaveType" onChange={handleChange} />
  <button type="submit">Submit</button>
</form>

// After
<ValidatedLeaveRequestForm
  onSubmit={handleSubmit}
  loading={loading}
  leaveTypes={leaveTypes}
/>
```

### Step 4: Update Submit Handler
Update your submit handler to work with Formik's values object:

```javascript
// Before
const handleSubmit = (e) => {
  e.preventDefault();
  const data = {
    leaveType: state.leaveType,
    startDate: state.startDate,
    // ... manual state management
  };
  LeaveDataService.create(data);
};

// After
const handleSubmit = (values) => {
  // values already contains all form data, properly typed
  LeaveDataService.create(values);
};
```

### Step 5: Remove Old Validation Logic
Delete manual validation code, as Formik+Yup handles it:

```javascript
// DELETE this kind of code
if (!state.startDate || !state.endDate) {
  alert('Please fill all fields');
  return;
}

if (new Date(state.endDate) < new Date(state.startDate)) {
  alert('End date must be after start date');
  return;
}
```

## Benefits

### 1. **Better User Experience**
- Real-time validation feedback
- Clear error messages next to fields
- Visual validation summary at the top
- Submit button disabled until form is valid

### 2. **Reduced API Calls**
- Client-side validation prevents invalid submissions
- Only valid data reaches the backend
- Reduces server load and error responses

### 3. **Maintainable Code**
- Centralized validation logic in schema
- Easy to update validation rules
- Consistent validation across forms
- Less boilerplate code

### 4. **Type Safety**
- Schema defines data structure
- Intellisense support for form values
- Reduced runtime errors

## Validation Summary Feature

All validated forms include a validation summary that displays:
- Number of validation errors
- List of specific errors
- Auto-scrolls to first error on submit

```javascript
// Automatically shown when errors exist
<Alert severity="error">
  <AlertTitle>Please fix the following errors:</AlertTitle>
  <ul>
    <li>Start date is required</li>
    <li>Reason must be at least 10 characters</li>
  </ul>
</Alert>
```

## Customization

### Adding Custom Validation

Extend the validation schema:

```javascript
// In ValidatedLeaveRequestForm.js
const validationSchema = Yup.object({
  // Existing validation
  leaveTypeId: Yup.string().required('Leave type is required'),
  
  // Add custom validation
  customField: Yup.string()
    .required('Custom field is required')
    .test('custom-rule', 'Custom validation failed', (value) => {
      // Custom validation logic
      return value && value.length > 5;
    })
});
```

### Conditional Validation

```javascript
halfDayType: Yup.string().when('isHalfDay', {
  is: true,
  then: Yup.string().required('Half day type is required'),
  otherwise: Yup.string().notRequired()
})
```

### Async Validation

```javascript
email: Yup.string()
  .email('Invalid email')
  .test('email-unique', 'Email already exists', async (value) => {
    if (!value) return true;
    const response = await checkEmailAvailability(value);
    return response.data.available;
  })
```

## Troubleshooting

### Issue: Form not submitting
**Solution:** Check that `onSubmit` prop is provided and is a function

### Issue: Validation errors not showing
**Solution:** Ensure you're using `<ErrorMessage>` or `formik.errors` to display errors

### Issue: Initial values not populating
**Solution:** Check that `initialValues` prop keys match form field names

### Issue: Material-UI styling conflicts
**Solution:** Ensure Material-UI is installed and ThemeProvider is properly configured

## Best Practices

1. **Always provide initialValues**: Even if empty, define all expected fields
2. **Use appropriate field types**: Date fields should use date inputs, not text
3. **Provide helpful error messages**: Clear, actionable messages for users
4. **Test validation**: Write unit tests for complex validation logic
5. **Handle loading states**: Disable submit button and show loading indicator
6. **Graceful error handling**: Display API errors using snackbar/toast notifications

## Example Integration: Complete Flow

```javascript
import React, { useState, useEffect } from 'react';
import { useSnackbar } from 'notistack';
import ValidatedLeaveRequestForm from './forms/ValidatedLeaveRequestForm';
import LeaveDataService from '../services/LeaveService';
import enhancedApiService from '../services/enhancedApiService';

function LeaveRequestPage() {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    // Fetch leave types
    enhancedApiService.get('/leaves/meta/types')
      .then(response => setLeaveTypes(response.data.data))
      .catch(error => {
        console.error('Failed to load leave types:', error);
        enqueueSnackbar('Failed to load leave types', { variant: 'error' });
      });
  }, [enqueueSnackbar]);

  const handleSubmit = (values) => {
    setLoading(true);
    LeaveDataService.create(values)
      .then(response => {
        enqueueSnackbar('Leave request submitted successfully!', { 
          variant: 'success' 
        });
        // Redirect or reset form
      })
      .catch(error => {
        const message = error.response?.data?.message || 
                       'Failed to submit leave request';
        enqueueSnackbar(message, { variant: 'error' });
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="container">
      <h1>Leave Request</h1>
      <ValidatedLeaveRequestForm
        onSubmit={handleSubmit}
        loading={loading}
        leaveTypes={leaveTypes}
        initialValues={{
          leaveTypeId: '',
          startDate: '',
          endDate: '',
          isStartHalfDay: false,
          isEndHalfDay: false,
          startHalfDayType: '',
          endHalfDayType: '',
          reason: ''
        }}
      />
    </div>
  );
}

export default LeaveRequestPage;
```

## References

- [Formik Documentation](https://formik.org/docs/overview)
- [Yup Documentation](https://github.com/jquense/yup)
- [Material-UI Forms](https://mui.com/material-ui/react-text-field/)
- Project backend API documentation: `http://localhost:5000/api/docs`

## Support

For questions or issues:
1. Check console for validation errors
2. Review Formik documentation
3. Inspect form values using React DevTools
4. Contact development team

---

**Last Updated:** 2025-01-28
**Version:** 1.0.0
