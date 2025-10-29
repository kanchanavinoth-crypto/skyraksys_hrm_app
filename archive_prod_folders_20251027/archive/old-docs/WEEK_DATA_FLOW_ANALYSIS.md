# Week Data Flow Analysis: Frontend to Backend

## Quick Answer

**Yes, the week date changes and is passed from frontend to API, but NO, the API does not mandate week numbers or start/end dates during submission.**

## Detailed Data Flow

### 📤 What Frontend Sends to Backend

**For Timesheet Creation/Submission:**
```javascript
// Frontend sends ONLY:
{
  weekStartDate: "2025-09-15",  // Monday date (YYYY-MM-DD)
  projectId: "uuid",
  taskId: "uuid", 
  mondayHours: 8,
  tuesdayHours: 8,
  // ... other hour fields
  description: "optional"
}

// Frontend does NOT send:
// - weekNumber
// - year  
// - weekEndDate
```

**For Querying/Loading:**
```javascript
// Frontend calculates and uses in query parameters:
GET /api/timesheets?year=2025&weekNumber=38&limit=50
```

### 🔧 What Backend Calculates

The backend receives only `weekStartDate` and automatically calculates:

```javascript
// Backend validation and calculations:
1. Validates weekStartDate is a Monday (day === 1)
2. Calculates weekEndDate = weekStartDate + 6 days
3. Calculates weekNumber using ISO week formula
4. Calculates year from weekStartDate

// Stored in database:
{
  weekStartDate: "2025-09-15",   // From frontend
  weekEndDate: "2025-09-21",     // Calculated by backend
  weekNumber: 38,                // Calculated by backend  
  year: 2025                     // Calculated by backend
}
```

### 📋 Validation Requirements

**Backend API Requirements:**
- ✅ `weekStartDate` must be provided (REQUIRED)
- ✅ `weekStartDate` must be in YYYY-MM-DD format
- ✅ `weekStartDate` must be a Monday
- ❌ No `weekNumber` required in payload
- ❌ No `year` required in payload
- ❌ No `weekEndDate` required in payload

**From validation schema:**
```javascript
const timesheetSchema = {
  create: Joi.object({
    weekStartDate: Joi.date().iso().required().custom((value) => {
      const date = new Date(value);
      if (date.getDay() !== 1) {
        throw new Error('Week start date must be a Monday');
      }
      return value;
    }),
    // ... other fields
  })
}
```

### 🔄 Complete Week Navigation Flow

1. **Frontend Week Navigation:**
   ```javascript
   // User clicks previous/next week
   setCurrentWeek(prev => prev.subtract(1, 'week'))  // Go back 1 week
   setCurrentWeek(prev => prev.add(1, 'week'))       // Go forward 1 week
   ```

2. **Frontend Date Calculation:**
   ```javascript
   const startDate = currentWeek.format('YYYY-MM-DD');  // Always a Monday
   const year = currentWeek.year();
   const weekNumber = currentWeek.isoWeek();
   ```

3. **Loading Data (Frontend → Backend):**
   ```javascript
   fetch(`/api/timesheets?year=${year}&weekNumber=${weekNumber}`)
   ```

4. **Saving Data (Frontend → Backend):**
   ```javascript
   fetch('/api/timesheets', {
     method: 'POST',
     body: JSON.stringify({
       weekStartDate: currentWeek.format('YYYY-MM-DD'),  // Only this date field
       // ... hours and other data
     })
   })
   ```

5. **Backend Processing:**
   - Validates `weekStartDate` is Monday
   - Calculates all other week-related fields
   - Stores complete week data

### ✅ Key Findings

1. **Single Source of Truth:** `weekStartDate` (Monday) is the only date field required
2. **Backend Auto-Calculation:** Week number, year, and end date are calculated server-side
3. **Consistent Calculations:** Frontend and backend use same ISO week algorithm
4. **No Date Restrictions:** No limitations on past or future week submissions
5. **Simple API:** Frontend doesn't need to calculate or send week numbers

### 🎯 Answer to Your Question

**"Does the API mandate the week number to start/end dates during submission?"**

**NO** - The API only requires:
- `weekStartDate` (a Monday date in YYYY-MM-DD format)

The API automatically calculates and does NOT require:
- `weekNumber` 
- `year`
- `weekEndDate`

This design ensures consistency and reduces the chance of calculation errors between frontend and backend.