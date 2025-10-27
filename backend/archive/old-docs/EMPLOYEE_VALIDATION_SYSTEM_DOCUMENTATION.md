# Employee Validation System Documentation

## Overview
The Employee Validation System provides a comprehensive, reusable validation framework for both employee creation and editing forms. It includes real-time field validation, form-level validation, and business logic validation.

## Architecture

### Core Components

1. **`employeeValidation.js`** - Core validation logic and rules
2. **`useEmployeeValidation.js`** - React hook for form integration
3. **Form Components** - EmployeeForm (create) and EmployeeEdit (edit)

## Usage

### Basic Hook Usage

```javascript
import { useEmployeeValidation } from '../hooks/useEmployeeValidation';

const MyEmployeeForm = () => {
  const validation = useEmployeeValidation({}, 'create'); // or 'edit'
  
  const handleFieldChange = (fieldName, value) => {
    // Validate field in real-time
    validation.validateSingleField(fieldName, value, formData);
  };
  
  const handleSubmit = () => {
    const result = validation.validateForm(formData);
    if (result.isValid) {
      const apiData = validation.prepareDataForSubmission(formData);
      // Submit to API
    }
  };
};
```

### Advanced Usage with Business Logic

```javascript
const validation = useEmployeeValidation(initialData, 'edit');

const handleSubmit = async () => {
  const result = validation.validateWithBusinessLogic(formData);
  
  if (!result.isValid) {
    console.log('Validation errors:', result.errors);
    console.log('Missing required:', result.missingRequired);
    return;
  }
  
  // Proceed with submission
};
```

## Hook API Reference

### `useEmployeeValidation(initialData, mode)`

#### Parameters
- `initialData` (Object) - Initial form data
- `mode` (String) - 'create' or 'edit'

#### Returns Object with:

#### State Properties
- `validationErrors` - Object containing validation errors
- `fieldErrors` - Object containing real-time field errors
- `isValidating` - Boolean indicating validation in progress
- `hasErrors` - Boolean indicating if any errors exist
- `errorCount` - Number of total errors

#### Validation Functions
- `validateSingleField(fieldName, value, formData)` - Validates single field
- `validateForm(formData)` - Validates entire form
- `validateSection(fieldNames, formData)` - Validates specific sections
- `validateRequiredFields(formData)` - Checks required fields
- `validateWithBusinessLogic(formData)` - Enhanced validation with business rules

#### Error Management
- `clearValidationErrors()` - Clears all errors
- `clearFieldError(fieldName)` - Clears specific field error
- `getFieldError(fieldName)` - Gets error for specific field
- `hasFieldError(fieldName)` - Checks if field has error

#### Utility Functions
- `prepareDataForSubmission(formData)` - Transforms data for API

## Validation Rules

### Required Fields (Create Mode)
- `firstName` - 2-50 characters
- `lastName` - 2-50 characters
- `email` - Valid email format
- `employeeId` - 3-20 uppercase alphanumeric characters
- `hireDate` - Cannot be in future
- `departmentId` - Must be valid UUID
- `positionId` - Must be valid UUID

### Required Fields (Edit Mode)
- Same as create mode except `employeeId` is optional
- If provided, `employeeId` must follow format rules

### Optional But Validated Fields

#### Personal Information
- `phone` - 10-15 digits
- `dateOfBirth` - Must be in past, age 16-100
- `gender` - Male, Female, Other
- `maritalStatus` - Single, Married, Divorced, Widowed
- `pinCode` - 6 digits

#### Employment Details
- `employmentType` - Full-time, Part-time, Contract, Internship, Consultant
- `workLocation` - Office, Remote, Hybrid, Field, Client Site
- `probationPeriod` - 0-24 months
- `noticePeriod` - 0-90 days
- `joiningDate` - Cannot be before hire date
- `confirmationDate` - Cannot be before joining/hire date

#### Statutory Information (India)
- `aadhaarNumber` - 12 digits
- `panNumber` - Format: ABCDE1234F
- `ifscCode` - Format: SBIN0000123

#### Banking Information
- `bankAccountNumber` - 9-20 characters
- `emergencyContactPhone` - 10-15 digits
- `emergencyContactRelation` - Spouse, Parent, Child, Sibling, Friend, Guardian, Other

### Business Logic Validations

1. **Date Consistency**
   - Joining date cannot be before hire date
   - Confirmation date cannot be before joining date

2. **Probation Logic**
   - If probation period and dates provided, confirmation should be after probation ends

3. **Age Validation**
   - Employee must be 16-100 years old

## Form Integration Examples

### In Create Form (EmployeeForm.js)

```javascript
import { useEmployeeValidation } from '../../../hooks/useEmployeeValidation';

const EmployeeForm = () => {
  const [formData, setFormData] = useState(initialFormData);
  const validation = useEmployeeValidation({}, 'create');
  
  const handleFieldChange = (fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    validation.validateSingleField(fieldName, value, { ...formData, [fieldName]: value });
  };
  
  const handleSubmit = async () => {
    const result = validation.validateWithBusinessLogic(formData);
    
    if (!result.isValid) {
      setErrors(result.errors);
      return;
    }
    
    const apiData = validation.prepareDataForSubmission(formData);
    await employeeService.create(apiData);
  };
  
  return (
    <TextField
      value={formData.firstName}
      onChange={(e) => handleFieldChange('firstName', e.target.value)}
      error={validation.hasFieldError('firstName')}
      helperText={validation.getFieldError('firstName')}
    />
  );
};
```

### In Edit Form (EmployeeEdit.js)

```javascript
import { useEmployeeValidation } from '../../../hooks/useEmployeeValidation';

const EmployeeEdit = () => {
  const { id } = useParams();
  const [formData, setFormData] = useState({});
  const validation = useEmployeeValidation(formData, 'edit');
  
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    validation.validateSingleField(field, value, { ...formData, [field]: value });
  };
  
  const handleSave = async () => {
    const result = validation.validateForm(formData);
    
    if (!result.isValid) {
      setError('Please fix validation errors');
      return;
    }
    
    const apiData = validation.prepareDataForSubmission(formData);
    await employeeService.update(id, apiData);
  };
};
```

## Step-by-Step Form Validation

For multi-step forms, validate sections independently:

```javascript
const validation = useEmployeeValidation({}, 'create');

// Define step fields
const stepFields = {
  personal: ['firstName', 'lastName', 'email', 'phone'],
  employment: ['hireDate', 'departmentId', 'positionId'],
  contact: ['address', 'city', 'state']
};

// Validate current step
const isStepValid = (stepName) => {
  return validation.validateSection(stepFields[stepName], formData);
};

// Check if user can proceed to next step
const canProceedToNext = () => {
  return isStepValid('personal'); // or current step
};
```

## Error Handling Best Practices

1. **Real-time Validation**: Validate fields on blur/change
2. **Form-level Validation**: Validate entire form on submit
3. **Section Validation**: For multi-step forms, validate sections
4. **Clear Errors**: Clear errors when user corrects them
5. **User Feedback**: Show clear, helpful error messages

## Common Patterns

### Error Display in TextField
```javascript
<TextField
  error={validation.hasFieldError('fieldName')}
  helperText={validation.getFieldError('fieldName')}
  value={formData.fieldName}
  onChange={(e) => handleFieldChange('fieldName', e.target.value)}
/>
```

### Conditional Field Validation
```javascript
// Only validate if user has started entering data
if (value && value.trim()) {
  validation.validateSingleField(fieldName, value, formData);
}
```

### Batch Error Clearing
```javascript
// Clear all errors when form is reset
const resetForm = () => {
  setFormData(initialData);
  validation.clearValidationErrors();
};
```

## Migration Guide

### From Old Validation System
1. Replace direct `validateEmployeeForm` calls with hook
2. Update field validation to use `validateSingleField`
3. Use `prepareDataForSubmission` for API data transformation
4. Leverage business logic validation for complex rules

### Benefits of New System
- Consistent validation across create/edit forms
- Better error state management
- Built-in business logic validation
- Easier testing and maintenance
- Type-safe validation rules

## Testing

### Unit Tests for Validation Rules
```javascript
import { validateEmployeeForm } from '../utils/employeeValidation';

test('validates required fields', () => {
  const result = validateEmployeeForm({}, { mode: 'create' });
  expect(result.isValid).toBe(false);
  expect(result.errors.firstName).toBeDefined();
});
```

### Integration Tests for Hook
```javascript
import { renderHook } from '@testing-library/react';
import { useEmployeeValidation } from '../hooks/useEmployeeValidation';

test('validates single field', () => {
  const { result } = renderHook(() => useEmployeeValidation({}, 'create'));
  
  const error = result.current.validateSingleField('firstName', '', {});
  expect(error).toBe('First name is required');
});
```

This validation system provides a robust, maintainable solution for employee form validation with consistent behavior across both create and edit modes.